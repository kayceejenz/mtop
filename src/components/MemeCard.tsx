import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, Trophy, Coins } from 'lucide-react';
import { Meme, User, firebaseService } from '@/lib/firebaseService';

interface MemeCardProps {
  meme: Meme;
  currentUser: User;
  rank?: number;
  onComment: () => void;
  onShare: () => void;
  onVote: () => void;
}

export default function MemeCard({ meme, currentUser, rank, onComment, onShare, onVote }: MemeCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const voted = await firebaseService.hasUserVoted(meme.id, currentUser.id);
        setHasVoted(voted);
      } catch (error) {
        console.error('Failed to check vote status:', error);
      }
    };

    const loadCommentCount = async () => {
      try {
        const comments = await firebaseService.getCommentsByMeme(meme.id);
        setCommentCount(comments.length);
      } catch (error) {
        console.error('Failed to load comment count:', error);
      }
    };

    checkVoteStatus();
    loadCommentCount();
  }, [meme.id, currentUser.id]);

  const handleVote = async () => {
    if (currentUser.pads <= 0 || hasVoted || isVoting) return;
    
    setIsVoting(true);
    
    try {
      const success = await firebaseService.voteMeme(meme.id, currentUser.id);
      
      if (success) {
        setHasVoted(true);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 1000);
        onVote();
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setTimeout(() => setIsVoting(false), 500);
    }
  };

  const isTopThree = rank && rank <= 3;
  const crownEmoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  const canVote = currentUser.pads > 0 && !hasVoted && !isVoting;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isTopThree ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : 'hover:shadow-md'
    } ${confetti ? 'animate-pulse' : ''}`}>
      {confetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-4 left-4 text-2xl animate-bounce">🎉</div>
          <div className="absolute top-4 right-4 text-2xl animate-bounce delay-100">✨</div>
          <div className="absolute bottom-4 left-4 text-2xl animate-bounce delay-200">🎊</div>
          <div className="absolute bottom-4 right-4 text-2xl animate-bounce delay-300">⭐</div>
        </div>
      )}

      {rank && (
        <div className="absolute top-2 left-2 z-20">
          <Badge variant={isTopThree ? "default" : "secondary"} className={`text-sm font-bold ${
            isTopThree ? 'bg-yellow-500 text-white' : ''
          }`}>
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
              <Badge className="bg-green-500 text-white">
                <Trophy className="w-3 h-3 mr-1" />
                1K Club!
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900 leading-tight mb-2">
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
                <span>{meme.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={canVote ? "default" : "secondary"}
                size="sm"
                onClick={handleVote}
                disabled={!canVote}
                className={`${canVote 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } transition-all duration-200 ${hasVoted ? 'bg-red-600' : ''}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${isVoting ? 'animate-pulse' : ''} ${hasVoted ? 'fill-current' : ''}`} />
                {meme.likes}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onComment}
                className="hover:bg-blue-50"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {commentCount}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="hover:bg-green-50"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-green-600 font-medium">
                <Coins className="w-4 h-4 mr-1" />
                {Math.floor(meme.rewardPool)} tokens
              </div>
            </div>
          </div>

          {currentUser.pads <= 0 && !hasVoted && (
            <div className="text-xs text-center text-red-500 bg-red-50 p-2 rounded">
              Out of Pads! Buy more to keep voting 🎯
            </div>
          )}

          {hasVoted && (
            <div className="text-xs text-center text-green-600 bg-green-50 p-2 rounded">
              You voted for this meme! 💚
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}