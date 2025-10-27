import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Share2, Gift } from "lucide-react";
import { farcasterService, FarcasterUser } from "@/lib/farcaster";
import { firebaseService, User } from "@/lib/firebaseService";
import { Timestamp } from "firebase/firestore";
import { useAccount } from "wagmi";

interface WalletConnectProps {
  onConnect: (user: User) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isConnected, address } = useAccount();

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        await farcasterService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Farcaster:", error);
        setIsInitialized(true); // Continue with fallback
      }
    };

    initializeFarcaster();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      // Get Farcaster user info
      const farcasterUser: FarcasterUser | null =
        await farcasterService.getUser();

      if (!farcasterUser) {
        throw new Error("Failed to get user information");
      }

      // Check if user exists in Firebase
      let user = await firebaseService.getUserByFid(farcasterUser.fid);

      if (!user) {
        // Create new user with 5 free pads
        const userId = await firebaseService.createUser({
          fid: farcasterUser.fid,
          username: farcasterUser.username,
          displayName: farcasterUser.displayName,
          pfpUrl: farcasterUser.pfpUrl,
          address,
          pads: 5, // 5 free pads for new users
          totalEarned: 0,
          token: 0,
        });

        user = await firebaseService.getUser(userId);
      } else {
        // Update last active
        await firebaseService.updateUser(user.id, {});
      }

      if (user) {
        setShowWelcome(true);
        onConnect(user);
      }
    } catch (error) {
      console.error("Connection failed:", error);
      // Fallback for development
      const fallbackUser: User = {
        id: "demo-user",
        fid: 12345,
        username: "demouser",
        displayName: "Demo User",
        address: "",
        // pfpUrl:
        //   "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/3388e27f-9da8-4a77-7d51-24f0899c9800/rectcrop3",
        pfpUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          "Demo User"
        )}&background=6B46C1&color=fff&rounded=true`,
        pads: 5,
        token: 0,
        totalEarned: 0,
        createdAt: Timestamp.fromDate(new Date()),
        lastActive: Timestamp.fromDate(new Date()),
      };
      setShowWelcome(true);
      onConnect(fallbackUser);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareText = `I'm voting on the funniest memes on Memedotfun – join and earn rewards! 🎭🚀 ${window.location.href}`;

      if (farcasterService.isInFarcaster()) {
        await farcasterService.shareFrame(shareText);
      } else if (navigator.share) {
        await navigator.share({
          title: "Memedotfun - Vote & Earn!",
          text: shareText,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        alert("Link copied to clipboard! 📋");
      }

      // Reward user with 2 pads for sharing
      // Note: In real implementation, you'd get current user ID
      // await firebaseService.rewardSharing(currentUserId);

      setShowWelcome(false);
    } catch (error) {
      console.error("Sharing failed:", error);
      setShowWelcome(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen transition-colors duration-500 bg-purple-50 dark:bg-[#0b0b14] flex items-center justify-center">
        <img
          src="/memewhiteBG.jpg"
          alt="Memedotfun"
          className="w-20 rounded-md"
        />
        {/* <p className="text-xl font-medium text-purple-700 dark:text-white">
          Initializing Memedotfun...
        </p> */}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center h-full px-6 text-center space-y-6 transition-colors duration-500 bg-purple-50 dark:bg-[#0b0b14]">
        <div className="space-y-4">
          <img
            src="/memewhiteBG.jpg"
            alt="Memedotfun"
            className="w-20 mx-auto rounded-md"
          />
          <h1 className="text-4xl font-extrabold text-purple-700 dark:text-purple-300">
            Welcome to MemeDotFun!
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            Vote Memes. Earn Rewards. Rule the Board!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Connect with Farcaster to get{" "}
            <span className="font-semibold text-purple-700 dark:text-purple-400">
              5 free Likes
            </span>{" "}
            🎯
          </p>
        </div>

        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          size="lg"
          className="shadow-md bg-purple-600 text-white hover:bg-purple-700 
             dark:bg-purple-300 dark:text-gray-900 dark:hover:bg-purple-400 transition-all"
        >
          <Wallet className="mr-2 h-5 w-5" />
          {isConnecting ? "Connecting..." : "Connect with Farcaster"}
        </Button>
      </div>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md rounded-xl shadow-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-[#0b0b14] dark:to-purple-900/20 border-2 border-purple-200 dark:border-purple-200">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-purple-700 dark:text-purple-200">
              🎉 Welcome to Memedotfun!
            </DialogTitle>
          </DialogHeader>

          <Card className="border border-purple-200 dark:border-purple-700 bg-white dark:bg-[#1a0b33] rounded-lg">
            <CardContent className="pt-6 text-center space-y-5">
              {/* Reward Row */}
              <div className="flex items-center justify-center space-x-2">
                <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <span className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                  You got 5 free Likes!
                </span>
                <span className="text-2xl">🎯</span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use Likes to vote on your favorite memes and earn rewards!
              </p>

              {/* Share CTA */}
              <div className="border-t pt-4 border-gray-200 dark:border-purple-700">
                <p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                  🚀 Share this app to your socials to earn +2 Likes instantly!
                </p>
                <Button
                  onClick={handleShare}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-md"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share & Earn +2 Likes
                </Button>
              </div>

              {/* Start Button */}
              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md 
                     dark:bg-purple-300 dark:text-gray-900 dark:hover:bg-purple-400 transition-all"
              >
                Start Voting!
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
