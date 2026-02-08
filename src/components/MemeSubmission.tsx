import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { User, DailyPrompt, firebaseService } from "@/lib/firebaseService";

interface MemeSubmissionProps {
  currentUser: User;
  todayPrompt: DailyPrompt | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function MemeSubmission({
  currentUser,
  todayPrompt,
  isOpen,
  onClose,
  onSubmit,
}: MemeSubmissionProps) {
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim() || !imageFile || !todayPrompt) return;

    setIsSubmitting(true);

    try {
      // Upload image to Firebase Storage
      const imageUrl = await firebaseService.uploadMemeImage(
        imageFile,
        currentUser.id,
      );

      // Create meme in Firestore
      await firebaseService.createMeme({
        imageUrl,
        caption: caption.trim(),
        creatorId: currentUser.id,
        creator: {
          username: currentUser.username,
          displayName: currentUser.displayName,
          pfpUrl: currentUser.pfpUrl,
        },
        likes: 0,
        rewardPool: 0,
        promptId: todayPrompt.id,
      });
      setCaption("");
      setImageFile(null);
      setImagePreview("");

      onSubmit();
      onClose();
      alert("Upload successful! Your meme is now live.");

      const lastSubmissionIso = await firebaseService.getLastSubmissionDate(
        currentUser.id,
      );

      const today = new Date().toISOString().split("T")[0];

      const lastSubmissionDate = lastSubmissionIso
        ? lastSubmissionIso.split("T")[0]
        : null;

      // if (lastSubmissionDate !== today) {
      //   await firebaseService.updateUserTokens(currentUser.id, 5);
      // }
    } catch (error) {
      console.error("Failed to submit meme:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = caption.trim() && imageFile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-purple-50 dark:from-[#0b0b14] dark:to-purple-900/20 border-2 border-purple-200 dark:border-purple-200 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center space-x-2 text-center">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            <span className="font-bold text-purple-700 dark:text-purple-200">
              Submit Your Meme
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {todayPrompt && (
            <div className="bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                📝 Today’s Prompt:
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-200 italic">
                “{todayPrompt.prompt}”
              </p>
            </div>
          )}

          {/* Upload Meme Image */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">Meme Image</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
              {imagePreview ? (
                <div className="space-y-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-48 object-contain mx-auto rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                    }}
                    className="border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-purple-600 hover:text-purple-700 dark:text-purple-300 dark:hover:text-purple-200 font-medium">
                        Click to upload
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {" "}
                        or drag and drop
                      </span>
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a funny caption for your meme..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/200 characters
            </p>
          </div>

          {/* Pro Tips */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
            <p className="text-sm text-purple-700 dark:text-purple-200">
              💡 <strong>Pro Tips:</strong>
            </p>
            <ul className="text-xs text-purple-600 dark:text-purple-300 mt-1 space-y-1">
              <li>• Make it relatable to today’s prompt</li>
              <li>• Keep it funny and engaging</li>
              <li>
                • Reach <b>500</b> Likes to earn 60% rewards!
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-500 dark:from-purple-300 to-indigo-500 dark:to-indigo-400 hover:from-purple-400 hover:to-indigo-400 text-white dark:text-gray-900 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Meme
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
