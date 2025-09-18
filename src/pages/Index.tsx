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
      await firebaseService.rewardSharing(user.id);
      await handleRefresh();
    } catch (error) {
      console.error("Failed to reward sharing:", error);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-pulse">🎭</div>
          <p className="text-lg text-muted-foreground">Loading MemeTop...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
        <WalletConnect onConnect={handleUserConnect} />
      </div>
    );
  }

  const topMemes = [...memes].sort((a, b) => b.likes - a.likes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🎭 MemeTop
              </h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Beta
              </Badge>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 rounded-full border">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-bold text-blue-700">{user.pads}</span>
                <span className="text-sm text-blue-600">Pads</span>
              </div>

              <Button
                onClick={
                  !isConnected
                    ? () => connect({ connector: connectors[0] })
                    : handleBuyPads
                }
                size="sm"
                disabled={isSending || isConfirming}
                className={`bg-gradient-to-r transition-all duration-200 ${
                  buyPadsStatus === "success"
                    ? "from-green-500 to-emerald-500"
                    : buyPadsStatus === "error"
                    ? "from-red-500 to-red-600"
                    : "from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                } ${
                  isSending || isConfirming
                    ? "cursor-not-allowed opacity-75"
                    : ""
                }`}
              >
                {getBuyPadsButtonIcon()}
                {getBuyPadsButtonText()}
              </Button>

              <div className="flex items-center space-x-1">
                <img
                  src={user.pfpUrl}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium hidden sm:inline">
                  {user.username}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Status Alerts */}
      {buyPadsStatus === "success" && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully purchased 10 pads! Your balance has been updated.
              {hash && (
                <div className="mt-1 text-xs font-mono break-all">
                  Transaction: {hash}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {buyPadsStatus === "error" && buyPadsError && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {buyPadsError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {buyPadsStatus === "confirming" && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Confirming your transaction on the blockchain. This may take a few
              moments...
              {hash && (
                <div className="mt-1 text-xs font-mono break-all">
                  Transaction: {hash}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Wallet Connection Alert */}
      {!isConnected && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <Target className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Connect your Farcaster wallet to purchase pads and interact with
              the app.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Daily Prompt */}
        <DailyPrompt onSubmitMeme={() => setShowSubmission(true)} />

        {/* Main Content */}
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed">Meme Feed</TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memes.map((meme, index) => (
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
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-6xl mb-4">🎭</div>
                  <h3 className="text-xl font-semibold mb-2">No memes yet!</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to submit a meme for today's prompt.
                  </p>
                  <Button onClick={() => setShowSubmission(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit First Meme
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  Today's Top Memes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMemes.slice(0, 10).map((meme, index) => (
                    <div
                      key={meme.id}
                      className={`flex items-center space-x-4 p-3 rounded-lg ${
                        index < 3
                          ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 font-bold text-sm">
                        {index + 1}
                      </div>

                      <img
                        src={meme.imageUrl}
                        alt={meme.caption}
                        className="w-12 h-12 object-cover rounded"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{meme.caption}</p>
                        <p className="text-sm text-muted-foreground">
                          by {meme.creator.username}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-red-500">
                          {meme.likes} ❤️
                        </div>
                        <div className="text-sm text-green-600 flex items-center">
                          <Coins className="h-3 w-3 mr-1" />
                          {meme.rewardPool}
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-xl transition-all duration-200"
        size="lg"
      >
        <Plus className="h-6 w-6" />
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
