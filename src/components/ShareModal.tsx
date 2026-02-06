import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Twitter, MessageSquare, Send, Copy, Gift } from "lucide-react";
import { firebaseService } from "@/lib/firebaseService";

interface ShareModalProps {
  meme: any | null;
  currentUser: { id: string } | null;
  isOpen: boolean;
  onClose: () => void;
  onPadsEarned: (meme: any) => void;
}

export default function ShareModal({
  meme,
  currentUser,
  isOpen,
  onClose,
  onPadsEarned,
}: ShareModalProps) {
  if (!meme || !currentUser) return null;

  const shareText = `Check out this hilarious meme: "${meme.caption}" 😂 Vote and earn rewards on MemeTop! 🎭🚀`;
  //const shareUrl = window.location.href;
  const shareUrl  = 'https://farcaster.xyz/miniapps/LVaSPw5phAb_/memedotfun';

  const handleShare = (platform: string) => {
    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "warpcast":
        url = `https://warpcast.com/~/compose?text=${encodeURIComponent(
          shareText + " " + shareUrl
        )}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareText)}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "width=600,height=400");
    onClose();
    onPadsEarned(meme);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert("Link copied to clipboard! 📋");
      onClose();
      onPadsEarned(meme);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "MemeDotTop - Hilarious Meme!",
          text: shareText,
          url: shareUrl,
        });
        onClose();
        onPadsEarned(meme);
      } catch (err) {
        console.error("Web share failed:", err);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-[#0b0b14] dark:to-purple-900/20 border-2 border-purple-300 dark:border-purple-200 rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-200">
            <Share2 className="h-5 w-5" />
            <span>Share This Meme</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/10">
            <CardContent className="pt-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Earn +0.2 Likes for sharing!
                </span>
                <span className="text-xl">🎯</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share as much as you want — reward once per meme.
              </p>
            </CardContent>
          </Card>

          <div className="relative">
            <img
              src={meme.imageUrl}
              alt={meme.caption}
              className="w-full h-40 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <p className="text-white text-sm font-medium text-center px-4 italic">
                "{meme.caption}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleShare("twitter")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>

            <Button
              onClick={() => handleShare("warpcast")}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Warpcast
            </Button>

            <Button
              onClick={() => handleShare("telegram")}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Telegram
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="hover:bg-purple-900/30 border-purple-200 dark:border-purple-300 text-gray-700 dark:text-gray-200"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>

          {navigator.share && (
            <Button
              onClick={handleWebShare}
              variant="outline"
              className="w-full border-purple-200 dark:border-purple-300 hover:bg-purple-900/30 text-gray-700 dark:text-gray-200"
            >
              <Share2 className="w-4 h-4 mr-2" />
              More Options
            </Button>
          )}

          <div className="text-center">
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-500 dark:text-gray-400 hover:text-purple-300"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
