import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Share2, Gift } from 'lucide-react';
import { farcasterService, FarcasterUser } from '@/lib/farcaster';
import { firebaseService, User } from '@/lib/firebaseService';
import { Timestamp } from 'firebase/firestore';

interface WalletConnectProps {
  onConnect: (user: User) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        await farcasterService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Farcaster:', error);
        setIsInitialized(true); // Continue with fallback
      }
    };

    initializeFarcaster();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Get Farcaster user info
      const farcasterUser: FarcasterUser | null = await farcasterService.getUser();
      
      if (!farcasterUser) {
        throw new Error('Failed to get user information');
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
          pads: 5, // 5 free pads for new users
          totalEarned: 0,
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
      console.error('Connection failed:', error);
      // Fallback for development
      const fallbackUser: User = {
        id: 'demo-user',
        fid: 12345,
        username: 'demouser',
        displayName: 'Demo User',
        pfpUrl: 'https://via.placeholder.com/100x100/6366f1/ffffff?text=DU',
        pads: 5,
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
      const shareText = `I'm voting on the funniest memes on MemeTop – join and earn rewards! 🎭🚀 ${window.location.href}`;
      
      if (farcasterService.isInFarcaster()) {
        await farcasterService.shareFrame(shareText);
      } else if (navigator.share) {
        await navigator.share({
          title: 'MemeTop - Vote & Earn!',
          text: shareText,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        alert('Link copied to clipboard! 📋');
      }
      
      // Reward user with 2 pads for sharing
      // Note: In real implementation, you'd get current user ID
      // await firebaseService.rewardSharing(currentUserId);
      
      setShowWelcome(false);
    } catch (error) {
      console.error('Sharing failed:', error);
      setShowWelcome(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-6xl mb-4 animate-pulse">🎭</div>
        <p className="text-lg text-muted-foreground">Initializing MemeTop...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🎭</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to MemeTop!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Vote Memes. Earn Rewards. Rule the Board!
          </p>
          <p className="text-sm text-muted-foreground">
            Connect with Farcaster to get 5 free Pads and start voting! 🎯
          </p>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isConnecting}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Wallet className="mr-2 h-5 w-5" />
          {isConnecting ? 'Connecting...' : 'Connect with Farcaster'}
        </Button>
      </div>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Welcome to MemeTop!
            </DialogTitle>
          </DialogHeader>
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Gift className="h-6 w-6 text-purple-600" />
                <span className="text-lg font-semibold">You got 5 free Pads!</span>
                <span className="text-2xl">🎯</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Use Pads to vote on your favorite memes and earn rewards!
              </p>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">
                  🚀 Share this app to your socials to earn +2 free Pads instantly!
                </p>
                <Button 
                  onClick={handleShare}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share & Earn +2 Pads
                </Button>
              </div>

              <Button 
                onClick={() => setShowWelcome(false)}
                variant="outline"
                className="w-full mt-2"
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