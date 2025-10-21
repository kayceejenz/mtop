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
  // onCommentAdded: () => void;
  onCommentAdded: (memeId: string) => void;
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

  // const handleSubmitComment = async () => {
  //   if (!meme || !newComment.trim()) return;

  //   try {
  //     await firebaseService.addComment({
  //       memeId: meme.id,
  //       userId: currentUser.id,
  //       user: {
  //         username: currentUser.username,
  //         displayName: currentUser.displayName,
  //         pfpUrl: currentUser.pfpUrl,
  //       },
  //       text: newComment.trim(),
  //     });

  //     setNewComment("");
  //     onCommentAdded();
  //   } catch (error) {
  //     console.error("Failed to add comment:", error);
  //   }
  // };

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

      // Notify parent that a comment was added for this specific meme
      onCommentAdded(meme.id);
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
    // <Dialog open={isOpen} onOpenChange={onClose}>
    //   <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-[#0b0b14] dark:to-purple-900/20 border border-purple-200 dark:border-purple-300 rounded-xl shadow-lg">
    //     <DialogHeader>
    //       <DialogTitle className="flex items-center space-x-2">
    //         <img
    //           src={meme.creator.pfpUrl}
    //           alt={meme.creator.displayName}
    //           className="w-6 h-6 rounded-full"
    //         />
    //         <span className="truncate">{meme.creator.username}'s Meme</span>
    //       </DialogTitle>
    //     </DialogHeader>

    //     <div className="flex-1 flex flex-col space-y-4">
    //       <div className="relative">
    //         <img
    //           src={meme.imageUrl}
    //           alt={meme.caption}
    //           className="w-full h-32 object-cover rounded-lg"
    //         />
    //       </div>

    //       <p className="text-sm font-medium text-gray-900">{meme.caption}</p>

    //       <div className="flex-1">
    //         <h4 className="font-medium mb-3 flex items-center">
    //           💬 Comments ({comments.length})
    //         </h4>

    //         <ScrollArea className="h-48 pr-4">
    //           {loading ? (
    //             <div className="text-center py-4">
    //               <div className="animate-pulse">Loading comments...</div>
    //             </div>
    //           ) : (
    //             <div className="space-y-3">
    //               {comments.length === 0 ? (
    //                 <p className="text-sm text-muted-foreground text-center py-4">
    //                   No comments yet. Be the first to comment! 🎉
    //                 </p>
    //               ) : (
    //                 comments.map((comment) => (
    //                   <div
    //                     key={comment.id}
    //                     className="bg-gray-50 rounded-lg p-3"
    //                   >
    //                     <div className="flex items-center space-x-2 mb-1">
    //                       <img
    //                         src={comment.user.pfpUrl}
    //                         alt={comment.user.displayName}
    //                         className="w-4 h-4 rounded-full"
    //                       />
    //                       <span className="text-sm font-medium">
    //                         {comment.user.username}
    //                       </span>
    //                       <span className="text-xs text-muted-foreground">
    //                         {comment.createdAt
    //                           ?.toDate()
    //                           .toLocaleTimeString([], {
    //                             hour: "2-digit",
    //                             minute: "2-digit",
    //                           })}
    //                       </span>
    //                     </div>
    //                     <p className="text-sm text-gray-700">{comment.text}</p>
    //                   </div>
    //                 ))
    //               )}
    //             </div>
    //           )}
    //         </ScrollArea>
    //       </div>

    //       <div className="flex space-x-2">
    //         <Input
    //           placeholder="Add a comment..."
    //           value={newComment}
    //           onChange={(e) => setNewComment(e.target.value)}
    //           onKeyPress={handleKeyPress}
    //           className="flex-1"
    //         />
    //         <Button
    //           onClick={handleSubmitComment}
    //           disabled={!newComment.trim()}
    //           size="sm"
    //         >
    //           <Send className="w-4 h-4" />
    //         </Button>
    //       </div>
    //     </div>
    //   </DialogContent>
    // </Dialog>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-purple-50 dark:from-[#0b0b14] dark:to-purple-900/20 border-2 border-purple-200 dark:border-purple-200 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-purple-600 dark:text-purple-300">
            <img
              src={meme.creator.pfpUrl}
              alt={meme.creator.displayName}
              className="w-6 h-6 rounded-full border border-purple-200"
            />
            <span className="truncate font-semibold">
              {meme.creator.username}'s Meme
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Meme Image */}
          <div className="relative">
            <img
              src={meme.imageUrl}
              alt={meme.caption}
              className="w-full h-48 object-cover rounded-lg border border-purple-200 "
            />
          </div>

          {/* Caption */}
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {meme.caption}
          </p>

          {/* Comments */}
          <div className="flex-1">
            <h4 className="font-medium mb-3 flex items-center text-purple-600 dark:text-purple-300">
              💬 Comments ({comments.length})
            </h4>

            <ScrollArea className="pr-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-pulse text-purple-500">
                    Loading comments...
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-purple-500 dark:text-purple-300 text-center py-4">
                      No comments yet. Be the first to comment! 🎉
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-700"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <img
                            src={comment.user.pfpUrl}
                            alt={comment.user.displayName}
                            className="w-4 h-4 rounded-full border border-purple-200 dark:border-purple-500"
                          />
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-300">
                            {comment.user.username}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {comment.createdAt
                              ?.toDate()
                              .toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {comment.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input + Button */}
          <div className="flex space-x-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-purple-300 dark:border-purple-400 focus-visible:ring-purple-500 focus-visible:border-none"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
              size="sm"
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white dark:text-gray-900"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
