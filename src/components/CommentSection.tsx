import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { Meme, User, Comment, firebaseService } from "@/lib/firebaseService";

interface CommentSectionProps {
  meme: Meme | null;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
}

export default function CommentSection({
  meme,
  currentUser,
  isOpen,
  onClose,
  onCommentAdded,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meme || !isOpen) return;

    const loadComments = async () => {
      setLoading(true);
      try {
        const memeComments = await firebaseService.getCommentsByMeme(meme.id);
        setComments(memeComments);
      } catch (error) {
        console.error("Failed to load comments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();

    // Subscribe to real-time comment updates
    const unsubscribe = firebaseService.subscribeToComments(
      meme.id,
      (updatedComments) => {
        setComments(updatedComments);
      }
    );

    return () => unsubscribe();
  }, [meme, isOpen]);

  const handleSubmitComment = async () => {
    if (!meme || !newComment.trim()) return;

    try {
      await firebaseService.addComment({
        memeId: meme.id,
        userId: currentUser.id,
        user: {
          username: currentUser.username,
          displayName: currentUser.displayName,
          pfpUrl: currentUser.pfpUrl,
        },
        text: newComment.trim(),
      });

      setNewComment("");
      onCommentAdded();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (!meme) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <img
              src={meme.creator.pfpUrl}
              alt={meme.creator.displayName}
              className="w-6 h-6 rounded-full"
            />
            <span className="truncate">{meme.creator.username}'s Meme</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          <div className="relative">
            <img
              src={meme.imageUrl}
              alt={meme.caption}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>

          <p className="text-sm font-medium text-gray-900">{meme.caption}</p>

          <div className="flex-1">
            <h4 className="font-medium mb-3 flex items-center">
              💬 Comments ({comments.length})
            </h4>

            <ScrollArea className="h-48 pr-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-pulse">Loading comments...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet. Be the first to comment! 🎉
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <img
                            src={comment.user.pfpUrl}
                            alt={comment.user.displayName}
                            className="w-4 h-4 rounded-full"
                          />
                          <span className="text-sm font-medium">
                            {comment.user.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt
                              ?.toDate()
                              .toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex space-x-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
