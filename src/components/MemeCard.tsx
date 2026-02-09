import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Trophy, Coins } from "lucide-react";
import { Meme, User, firebaseService } from "@/lib/firebaseService";

const voteWeight = -3;

interface MemeCardProps {
  meme: Meme;
  currentUser: User;
  rank?: number;
  commentCount: number;
  onComment: () => void;
  onShare: () => void;
  onInsufficientPad: () => void;
  onVote: () => void;
}

export default function MemeCard({
  meme,
  currentUser,
  rank,
  commentCount,
  onComment,
  onShare,
  onInsufficientPad,
  onVote,
}: MemeCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [optimisticLikes, setOptimisticLikes] = useState(meme.likes);

  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const voted = await firebaseService.hasUserVoted(
          meme.id,
          currentUser.id,
        );
        setHasVoted(voted);
      } catch (error) {
        console.error("Failed to check vote status:", error);
      }
    };

    checkVoteStatus();
  }, [meme.id, currentUser.id]);

  // const handleVote = async () => {
  //   if (hasVoted) return; // Prevent double voting

  //   // IMMEDIATE UI UPDATE - No waiting for Firebase
  //   setHasVoted(true);
  //   setOptimisticLikes((prev) => prev + 1);
  //   setConfetti(true);
  //   setTimeout(() => setConfetti(false), 1000);

  //   // Call Firebase in background - don't wait for it
  //   setIsVoting(true);

  //   try {
  //     const pads = await firebaseService.getPads(currentUser.id);

  //     if (pads + voteWeight < 0) {
  //       onInsufficientPad();
  //       // Don't revert UI - let the user see their like
  //       return;
  //     }

  //     // Fire and forget - don't await, just trigger
  //     firebaseService
  //       .voteMeme(meme.id, currentUser.id)
  //       .then((success) => {
  //         if (success) {
  //           firebaseService.updateUserTokens(currentUser.id, 10);
  //           onVote(); // Notify parent for data refresh
  //         } else {
  //           console.warn("Vote failed on server, but UI remains updated");
  //         }
  //       })
  //       .catch((error) => {
  //         console.error("Background vote failed:", error);
  //         // Don't revert UI - keep the optimistic update
  //       })
  //       .finally(() => {
  //         setIsVoting(false);
  //       });
  //   } catch (error) {
  //     console.error("Failed to check pads:", error);
  //     setIsVoting(false);
  //     // Still don't revert UI - optimistic update stays
  //   }
  // };
  const handleVote = async () => {
    if (hasVoted || isVoting) return;

    setIsVoting(true);

    try {
      const pads = await firebaseService.getPads(currentUser.id);

      // 🚫 HARD BLOCK — do NOT allow optimistic update
      if (pads + voteWeight < 0) {
        onInsufficientPad();
        setIsVoting(false);
        return;
      }

      // ✅ SAFE optimistic update
      setHasVoted(true);
      setOptimisticLikes((prev) => prev + 1);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 1000);

      // 🔥 Fire-and-forget
      firebaseService
        .voteMeme(meme.id, currentUser.id)
        .then((success) => {
          if (success) {
            firebaseService.updateUserTokens(currentUser.id, 10);
            onVote();
          } else {
            console.warn("Vote failed on server, UI kept optimistic");
          }
        })
        .catch((error) => {
          console.error("Background vote failed:", error);
        })
        .finally(() => {
          setIsVoting(false);
        });
    } catch (error) {
      console.error("Failed to check pads:", error);
      setIsVoting(false);
    }
  };

  const isTopThree = rank && rank <= 3;
  const crownEmoji =
    rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";

  // User can vote if they haven't voted yet (regardless of Firebase state)
  const canVote = !hasVoted;

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
            // className="w-full h-64 object-cover"
            className="w-full object-contain"
          />
          {optimisticLikes >= 500 && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white dark:from-purple-300 dark:to-indigo-400 dark:text-gray-900">
                <Trophy className="w-3 h-3" />
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleVote}
                disabled={!canVote}
                className={`transition-all duration-200 flex items-center px-3 py-1 rounded-md ${
                  hasVoted
                    ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
                    : "hover:bg-purple-50 dark:hover:bg-purple-900/30 border-gray-200"
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-200 ${
                    hasVoted
                      ? "fill-red-500 text-red-500"
                      : "text-red-500 hover:text-red-600"
                  }`}
                />
                <span className="ml-1">{optimisticLikes}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onComment}
                className="hover:bg-purple-50 dark:hover:bg-purple-900/30 border-gray-200"
              >
                <MessageCircle className="w-4 h-4" />
                {commentCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border-gray-200"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-300">
                <Coins className="w-4 h-4" />
                {Math.floor(meme.rewardPool)} tokens
              </div>
            </div>
          </div>

          {currentUser.pads <= 0 && !hasVoted && (
            <div className="text-xs text-center text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
              Out of likes! Buy more to keep voting 🎯
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
