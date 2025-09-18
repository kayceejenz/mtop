import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { User, DailyPrompt, firebaseService } from '@/lib/firebaseService';

interface MemeSubmissionProps {
  currentUser: User;
  todayPrompt: DailyPrompt | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function MemeSubmission({ currentUser, todayPrompt, isOpen, onClose, onSubmit }: MemeSubmissionProps) {
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
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
      const imageUrl = await firebaseService.uploadMemeImage(imageFile, currentUser.id);

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

      // Reset form
      setCaption('');
      setImageFile(null);
      setImagePreview('');
      
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Failed to submit meme:', error);
      alert('Failed to submit meme. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = caption.trim() && imageFile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span>Submit Your Meme</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {todayPrompt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                📝 Today's Prompt:
              </p>
              <p className="text-sm text-yellow-700">
                "{todayPrompt.prompt}"
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="image-upload">Meme Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
                      setImagePreview('');
                      setImageFile(null);
                    }}
                  >
                    Change Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Click to upload
                      </span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Pro Tips:</strong>
            </p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Make it relatable to today's prompt</li>
              <li>• Keep it funny and engaging</li>
              <li>• Reach 1000 Pads to earn 30% rewards!</li>
            </ul>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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