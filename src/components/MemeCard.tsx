import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Trophy, Coins } from "lucide-react";
import { Meme, User, firebaseService } from "@/lib/firebaseService";

const voteWeight = -2;
interface MemeCardProps {
  meme: Meme;
  currentUser: User;
  rank?: number;
  onComment: () => void;
  onShare: () => void;
  onVote: () => void;
}

export default function MemeCard({
  meme,
  currentUser,
  rank,
  onComment,
  onShare,
  onVote,
}: MemeCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        // const voted = await firebaseService.hasUserVoted(
        //   meme.id,
        //   currentUser.id
        // );
      } catch (error) {
        console.error("Failed to check vote status:", error);
      }
    };

    const loadCommentCount = async () => {
      try {
        const comments = await firebaseService.getCommentsByMeme(meme.id);
        setCommentCount(comments.length);
      } catch (error) {
        console.error("Failed to load comment count:", error);
      }
    };

    checkVoteStatus();
    loadCommentCount();
  }, [meme.id, currentUser.id]);

  const handleVote = async () => {
    if (isVoting) return;

    setIsVoting(true);

    try {
      const pads = await firebaseService.getPads(currentUser.id);

      if (pads + voteWeight < 0) {
        console.warn("Not enough pads to vote");
        return;
      }

      await firebaseService.updateUserPads(currentUser.id, voteWeight);
      const success = await firebaseService.voteMeme(meme.id, currentUser.id);

      if (success) {
        await firebaseService.updateUserTokens(currentUser.id, 5);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1000);
        onVote();
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setTimeout(() => setIsVoting(false), 500);
    }
  };

  const isTopThree = rank && rank <= 3;
  const crownEmoji =
    rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
  const canVote = currentUser.pads > 0 && !isVoting;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 ${
        isTopThree
          ? "border-2 border-purple-400 "
          : "hover:shadow-md border border-gray-200 dark:border-gray-700"
      } ${confetti ? "animate-pulse" : ""}`}
    >
      {confetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-4 left-4 text-2xl animate-bounce">
            🎉
          </div>
          <div className="absolute top-4 right-4 text-2xl animate-bounce delay-100">
            ✨
          </div>
          <div className="absolute bottom-4 left-4 text-2xl animate-bounce delay-200">
            🎊
          </div>
          <div className="absolute bottom-4 right-4 text-2xl animate-bounce delay-300">
            ⭐
          </div>
        </div>
      )}

      {rank && (
        <div className="absolute top-2 left-2 z-20">
          <Badge
            variant={isTopThree ? "default" : "secondary"}
            className={`text-sm font-bold ${
              isTopThree
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white dark:from-purple-300 dark:to-indigo-400 dark:text-gray-900"
                : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {crownEmoji} #{rank}
          </Badge>
        </div>
      )}

      <CardContent className="p-0">
        <div className="relative">
          <img
            src={meme.imageUrl}
            alt={meme.caption}
            className="w-full h-64 object-cover"
          />
          {meme.likes >= 1000 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white dark:from-purple-300 dark:to-indigo-400 dark:text-gray-900">
                <Trophy className="w-3 h-3 " />
                1K Club!
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100 leading-tight mb-2">
                {meme.caption}
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <img
                  src={meme.creator.pfpUrl}
                  alt={meme.creator.displayName}
                  className="w-5 h-5 rounded-full"
                />
                <span className="font-medium">{meme.creator.username}</span>
                <span>•</span>
                <span>
                  {meme.createdAt?.toDate().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* <Button
                size="sm"
                onClick={handleVote}
                disabled={!canVote}
                className={`transition-all duration-200 ${
                  canVote
                    ? `bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white dark:from-purple-300 dark:to-indigo-400 dark:text-gray-900`
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                } ${
                  hasVoted ? "ring-2 ring-purple-400 dark:ring-purple-300" : ""
                }`}
              >
                <Heart
                  className={`w-4 h-4  ${isVoting ? "animate-pulse" : ""} ${
                    hasVoted ? "fill-current" : ""
                  }`}
                />
                {meme.likes}
              </Button> */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleVote}
                disabled={!canVote}
                className={`transition-all duration-200 flex items-center px-3 py-1 rounded-md`}
              >
                <Heart
                  className={`w-4 h-4  transition-colors duration-200 text-gray-800`}
                />
                {meme.likes}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onComment}
                className="hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <MessageCircle className="w-4 h-4 " />
                {commentCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-300">
                <Coins className="w-4 h-4 " />
                {Math.floor(meme.rewardPool)} tokens
              </div>
            </div>
          </div>

          {currentUser.pads <= 0 && (
            <div className="text-xs text-center text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
              Out of likes! Buy more to keep voting 🎯
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
