import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Coins,
  Trophy,
  Target,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  useAccount,
  useConnect,
  useSendTransaction,
  useWaitForTransactionReceipt,
  type BaseError,
} from "wagmi";
import WalletConnect from "@/components/WalletConnect";
import DailyPrompt from "@/components/DailyPrompt";
import MemeCard from "@/components/MemeCard";
import CommentSection from "@/components/CommentSection";
import ShareModal from "@/components/ShareModal";
import MemeSubmission from "@/components/MemeSubmission";
import {
  firebaseService,
  User,
  Meme,
  DailyPrompt as DailyPromptType,
} from "@/lib/firebaseService";
import { farcasterService } from "@/lib/farcaster";
import { ThemeToggle } from "@/components/ThemeToggle";
import Header from "@/components/Header";
import AirdropPoolBanner from "@/components/AirdropPool";
import { Timestamp } from "firebase/firestore";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [todayPrompt, setTodayPrompt] = useState<DailyPromptType | null>(null);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pad buying states
  const [buyPadsStatus, setBuyPadsStatus] = useState<
    "idle" | "pending" | "confirming" | "success" | "error"
  >("idle");
  const [buyPadsError, setBuyPadsError] = useState<string | null>(null);

  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const {
    data: hash,
    error: sendError,
    isPending: isSending,
    sendTransaction,
  } = useSendTransaction();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTransactionError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Auto-connect to Farcaster wallet on load
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connectors, connect]);

  // Handle transaction status changes
  useEffect(() => {
    if (hash) {
      if (isSending) {
        setBuyPadsStatus("pending");
      } else if (isConfirming) {
        setBuyPadsStatus("confirming");
      } else if (isConfirmed) {
        setBuyPadsStatus("success");
        handlePadsPurchaseConfirmed();
      } else if (isTransactionError) {
        setBuyPadsStatus("error");
        setBuyPadsError("Transaction failed on blockchain");
        farcasterService.triggerErrorHaptic();
      }
    }

    // Handle send transaction errors
    if (sendError) {
      setBuyPadsStatus("error");
      const error = sendError as BaseError;
      setBuyPadsError(
        error.shortMessage || error.message || "Transaction failed"
      );
      farcasterService.triggerErrorHaptic();
    }
  }, [
    hash,
    isSending,
    isConfirming,
    isConfirmed,
    isTransactionError,
    sendError,
  ]);

  // Auto-hide success/error messages after 5 seconds
  useEffect(() => {
    if (buyPadsStatus === "success" || buyPadsStatus === "error") {
      const timer = setTimeout(() => {
        setBuyPadsStatus("idle");
        setBuyPadsError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [buyPadsStatus]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await farcasterService.initialize();
        const farcasterUser = await farcasterService.getUser();

        if (farcasterUser) {
          const updatedUser = await firebaseService.getUserByFid(
            farcasterUser.fid
          );
          setUser(updatedUser);
        }

        const prompt = await firebaseService.getTodayPrompt();
        setTodayPrompt(prompt);

        if (prompt) {
          const promptMemes = await firebaseService.getMemesByPrompt(prompt.id);
          setMemes(promptMemes);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!todayPrompt) return;

    // Subscribe to real-time meme updates
    const unsubscribe = firebaseService.subscribeToMemes(
      todayPrompt.id,
      (updatedMemes) => {
        setMemes(updatedMemes);
      }
    );

    return () => unsubscribe();
  }, [todayPrompt]);

  const handleUserConnect = (connectedUser: User) => {
    setUser(connectedUser);
  };

  const handleRefresh = async () => {
    if (user) {
      try {
        const updatedUser = await firebaseService.getUser(user.id);
        if (updatedUser) {
          setUser(updatedUser);
        }
      } catch (error) {
        console.error("Failed to refresh user:", error);
      }
    }
  };

  const handleComment = (meme: Meme) => {
    setSelectedMeme(meme);
    setShowComments(true);
  };

  const handleShare = (meme: Meme) => {
    setSelectedMeme(meme);
    setShowShare(true);
  };

  const handleVote = async (memeId: string) => {
    if (!user || user.pads <= 0) return;

    try {
      const success = await firebaseService.voteMeme(memeId, user.id);
      if (success) {
        await handleRefresh();
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleBuyPads = async () => {
    if (!user || !isConnected) {
      setBuyPadsError("Please connect your wallet first");
      return;
    }

    if (isSending || isConfirming) return;

    try {
      setBuyPadsStatus("pending");
      setBuyPadsError(null);

      if (!farcasterService.isInFarcaster()) {
        throw new Error("This feature requires opening the app in Farcaster");
      }

      const PADS_TO_BUY = 10;

      // Prepare the transaction using the service
      const txParams =
        farcasterService.preparePadsPurchaseTransaction(PADS_TO_BUY);

      // Send transaction using Wagmi
      sendTransaction(txParams);
    } catch (error) {
      console.error("Failed to prepare transaction:", error);

      let errorMessage = "Failed to prepare transaction. Please try again.";
      if (error.message?.includes("Central wallet address")) {
        errorMessage = "App configuration error. Please contact support.";
      } else if (error.message?.includes("Farcaster")) {
        errorMessage = error.message;
      }

      setBuyPadsStatus("error");
      setBuyPadsError(errorMessage);
      farcasterService.triggerErrorHaptic();
    }
  };

  const handlePadsPurchaseConfirmed = async () => {
    if (!user) return;

    try {
      const PADS_TO_BUY = 10;
      await firebaseService.buyPads(user.id, PADS_TO_BUY);
      await handleRefresh();

      console.log(`Successfully purchased ${PADS_TO_BUY} pads.`);

      // Trigger success haptic
      await farcasterService.triggerSuccessHaptic();

      // Share on Farcaster
      try {
        await farcasterService.shareFrame(
          `Just bought ${PADS_TO_BUY} pads! 🎉`,
          window.location.href
        );
      } catch (shareError) {
        console.error("Failed to share:", shareError);
      }
    } catch (error) {
      console.error("Failed to credit pads:", error);
      setBuyPadsStatus("error");
      setBuyPadsError("Failed to credit pads to your account");
    }
  };

  const handleMemeSubmitted = async () => {
    await handleRefresh();
    if (todayPrompt) {
      const updatedMemes = await firebaseService.getMemesByPrompt(
        todayPrompt.id
      );
      setMemes(updatedMemes);
    }
  };

  const handleShareReward = async () => {
    if (!user) return;

    try {
      // Check current shares before attempting to reward
      const sharesToday = await firebaseService.getUserSharesToday(user.id);
      const remaining = 2 - sharesToday;

      if (remaining > 0) {
        // User can still share, attempt to reward
        const success = await firebaseService.rewardSharing(user.id);

        if (success) {
          await handleRefresh();

          // Calculate new remaining shares
          const newRemaining = remaining - 1;

          if (newRemaining > 0) {
            // Show success message with remaining shares
            setBuyPadsStatus("success");
            setBuyPadsError(
              `Share reward earned! You can share ${newRemaining} more time${
                newRemaining === 1 ? "" : "s"
              } today.`
            );
          } else {
            // This was the last share
            setBuyPadsStatus("success");
            setBuyPadsError(
              "Share reward earned! You've reached the daily sharing limit (2/2)."
            );
          }

          // Auto-hide success message
          setTimeout(() => {
            setBuyPadsStatus("idle");
            setBuyPadsError(null);
          }, 3000);
        } else {
          // Reward failed (shouldn't happen if remaining > 0)
          setBuyPadsError(
            "Failed to process sharing reward. Please try again."
          );
          setBuyPadsStatus("error");

          setTimeout(() => {
            setBuyPadsStatus("idle");
            setBuyPadsError(null);
          }, 3000);
        }
      } else {
        // User has already shared twice today
        setBuyPadsError(
          "You've already shared twice today. Sharing limit resets tomorrow."
        );
        setBuyPadsStatus("error");

        setTimeout(() => {
          setBuyPadsStatus("idle");
          setBuyPadsError(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to process sharing reward:", error);
      setBuyPadsError("Failed to process sharing reward. Please try again.");
      setBuyPadsStatus("error");

      setTimeout(() => {
        setBuyPadsStatus("idle");
        setBuyPadsError(null);
      }, 3000);
    }
  };

  const getBuyPadsButtonText = () => {
    if (!isConnected) return "Connect Wallet";

    switch (buyPadsStatus) {
      case "pending":
        return "Preparing...";
      case "confirming":
        return "Confirming...";
      case "success":
        return "Success!";
      default:
        return "Buy Pads";
    }
  };

  const getBuyPadsButtonIcon = () => {
    if (isSending || isConfirming) {
      return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
    }
    if (buyPadsStatus === "success") {
      return <CheckCircle className="h-4 w-4 mr-1" />;
    }
    return <ShoppingCart className="h-4 w-4 mr-1" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen transition-colors duration-500 bg-purple-50 dark:bg-[#0b0b14] flex items-center justify-center">
        <div className="text-center space-y-4">
          {/* <div className="text-6xl bg-gradient-to-r from-purple-500 to-purple-500 dark:from-purple-300 dark:to-purple-300 bg-clip-text text-transparent animate-bounce ">
            🎭
          </div> */}
          <div className="text-6xl mb-4 animate-bounce">😎</div>
          <p className="text-xl font-medium text-purple-700 dark:text-white">
            Loading Memedotfun...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WalletConnect onConnect={handleUserConnect} />;
  }

  const topMemes = [...memes].sort((a, b) => b.likes - a.likes);

  // mockData.ts
  const mockMemes: Meme[] = [
    {
      id: "1",
      imageUrl: "https://picsum.photos/400/300?random=1",
      caption: "When React re-renders unnecessarily 😂",
      creatorId: "user_1",
      creator: {
        username: "reactfan",
        displayName: "React Fan",
        pfpUrl: "https://i.pravatar.cc/100?img=1",
      },
      likes: 120,
      rewardPool: 45,
      promptId: "prompt_1",
      createdAt: Timestamp.fromDate(new Date("2025-09-20T10:00:00")),
      updatedAt: Timestamp.fromDate(new Date("2025-09-21T12:00:00")),
    },
    {
      id: "2",
      imageUrl: "https://picsum.photos/400/300?random=2",
      caption: "TypeScript fixes 99 bugs, introduces 100 more 🔥",
      creatorId: "user_2",
      creator: {
        username: "ts_master",
        displayName: "TypeScript Guru",
        pfpUrl: "https://i.pravatar.cc/100?img=2",
      },
      likes: 95,
      rewardPool: 30,
      promptId: "prompt_2",
      createdAt: Timestamp.fromDate(new Date("2025-09-21T09:30:00")),
      updatedAt: Timestamp.fromDate(new Date("2025-09-21T09:45:00")),
    },
    {
      id: "3",
      imageUrl: "https://picsum.photos/400/300?random=3",
      caption: "It works on my machine ✅",
      creatorId: "user_3",
      creator: {
        username: "devops_guru",
        displayName: "DevOps Legend",
        pfpUrl: "https://i.pravatar.cc/100?img=3",
      },
      likes: 180,
      rewardPool: 75,
      promptId: "prompt_3",
      createdAt: Timestamp.fromDate(new Date("2025-09-19T15:20:00")),
      updatedAt: Timestamp.fromDate(new Date("2025-09-21T14:10:00")),
    },
  ];

  return (
    <div className="min-h-screen bg-purple-50 dark:bg-[#0b0b14] ">
      {/* Header */}
      <Header
        user={user}
        isConnected={isConnected}
        connectors={connectors}
        connect={connect}
        handleBuyPads={handleBuyPads}
        buyPadsStatus={buyPadsStatus}
        buyPadsError={buyPadsError}
        hash={hash}
        isSending={isSending}
        isConfirming={isConfirming}
        getBuyPadsButtonIcon={getBuyPadsButtonIcon}
        getBuyPadsButtonText={getBuyPadsButtonText}
      />

      {/* Airdrop banner */}
      <AirdropPoolBanner />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Daily Prompt */}
        <DailyPrompt onSubmitMeme={() => setShowSubmission(true)} />

        {/* Main Content */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-md bg-muted bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
            <TabsTrigger
              value="feed"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white dark:data-[state=active]:from-purple-300 dark:data-[state=active]:to-indigo-400 dark:data-[state=active]:text-gray-900"
            >
              Meme Feed
            </TabsTrigger>
            <TabsTrigger
              value="leaderboard"
              className="flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white dark:data-[state=active]:from-purple-300 dark:data-[state=active]:to-indigo-400 dark:data-[state=active]:text-gray-900"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* FEED */}
          <TabsContent value="feed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memes.map((meme) => (
                <MemeCard
                  key={meme.id}
                  meme={meme}
                  currentUser={user}
                  onComment={() => handleComment(meme)}
                  onShare={() => handleShare(meme)}
                  onVote={() => handleVote(meme.id)}
                />
              ))}
            </div>

            {memes.length === 0 && (
              <Card className="rounded-xl text-center py-12 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
                <CardContent>
                  <div className="text-6xl">😎</div>
                  <h3 className="text-xl font-semibold mb-2">No memes yet!</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to submit a meme for today's prompt.
                  </p>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white dark:from-purple-300 dark:to-indigo-400 dark:hover:from-purple-400 dark:hover:to-indigo-500 dark:text-gray-900 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => setShowSubmission(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Submit First Meme
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* LEADERBOARD */}
          <TabsContent value="leaderboard" className="space-y-4">
            <Card className="rounded-xl text-center  bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-300" />
                  Today's Top Memes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memes.slice(0, 10).map((meme, index) => (
                    <div
                      key={meme.id}
                      className={`p-4 rounded-xl transition-all duration-200 border shadow-sm flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 ${
                        index < 3
                          ? "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-gray-900 border-purple-300 dark:border-purple-200"
                          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {/* Left side: Rank + Thumbnail */}
                      <div className="flex items-start space-x-3">
                        {/* Rank Circle */}
                        <div
                          className={`flex items-center justify-center w-6 h-6 rounded-xl font-bold text-xs shrink-0 ${
                            index < 3
                              ? "bg-purple-500 text-white dark:bg-purple-300 dark:text-gray-900"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {index + 1}
                        </div>

                        {/* Thumbnail */}
                        <img
                          src={meme.imageUrl}
                          alt={meme.caption}
                          className="w-14 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <div className="min-w-0 text-left">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {meme.caption}
                          </p>
                          <p className="text-sm text-purple-500 dark:text-purple-300 font-medium">
                            {meme.creator.username}
                          </p>
                          <div className="flex space-x-4 sm:space-x-0 sm:flex-col sm:items-end sm:space-y-1">
                            <div className="font-bold text-red-500 flex items-center">
                              {meme.likes} <span className="ml-1">❤️</span>
                            </div>
                            <div className="text-sm text-purple-500 dark:text-purple-300 flex items-center">
                              <Coins className="h-3 w-3 mr-1" />
                              {meme.rewardPool}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowSubmission(true)}
        className="fixed bottom-4 right-4 h-10 w-10 rounded-xl shadow-lg bg-gradient-to-r from-purple-500 dark:from-purple-300 to-indigo-500 dark:to-indigo-400 hover:from-purple-400 hover:to-indigo-400 text-white dark:text-gray-900 font-medium  hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        <Plus className="h-5 w-5" />
      </Button>

      {/* Modals */}
      <CommentSection
        meme={selectedMeme}
        currentUser={user}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onCommentAdded={handleRefresh}
      />

      <ShareModal
        meme={selectedMeme}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        onPadsEarned={handleShareReward}
      />

      <MemeSubmission
        currentUser={user}
        todayPrompt={todayPrompt}
        isOpen={showSubmission}
        onClose={() => setShowSubmission(false)}
        onSubmit={handleMemeSubmitted}
      />
    </div>
  );
}
