import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Coins, Trophy, Target, ShoppingCart } from "lucide-react";
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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const user = await farcasterService.getUser();
        const updatedUser = await firebaseService.getUserByFid(user.fid);
        setUser(updatedUser);
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
    if (!user) return;

    try {
      // Simulate buying 10 pads for $5
      await firebaseService.buyPads(user.id, 10);
      await handleRefresh();
    } catch (error) {
      console.error("Failed to buy pads:", error);
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
                onClick={handleBuyPads}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Buy Pads
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
