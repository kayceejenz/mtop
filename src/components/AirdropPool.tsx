import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Clock } from "lucide-react";
import { getDatabase, ref, onValue } from "firebase/database";

function getServerTimeOffset(callback: (offset: number) => void) {
  const db = getDatabase();
  const offsetRef = ref(db, ".info/serverTimeOffset");

  return onValue(offsetRef, (snap) => {
    callback(snap.val() || 0);
  });
}

const AIRDROP_END_TIME = new Date("2026-04-30T23:59:59Z").getTime();

// Banner Component
export function AirdropPoolBanner() {
  const [timeLeft, setTimeLeft] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poolAmount, setPoolAmount] = useState(10500); // Starting pool amount
  const [userCount, setUserCount] = useState(0); // Track user count for pool increases

  // Simulate user growth (in a real app, this would come from your backend)
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount((prev) => {
        const newCount = prev + Math.floor(Math.random() * 5);

        // Increase pool by $100 for every 50 new users
        if (newCount % 50 === 0 && newCount > prev) {
          setPoolAmount((prevAmount) => prevAmount + 100);
        }

        return newCount;
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   // Calculate 90 days from now
  //   const endDate = new Date();
  //   endDate.setDate(endDate.getDate() + 60);

  //   const updateCountdown = () => {
  //     const now = new Date();
  //     const difference = endDate.getTime() - now.getTime();

  //     if (difference > 0) {
  //       const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  //       const hours = Math.floor(
  //         (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  //       );
  //       const minutes = Math.floor(
  //         (difference % (1000 * 60 * 60)) / (1000 * 60)
  //       );
  //       const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  //       setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
  //     } else {
  //       setTimeLeft("Airdrop Ended");
  //     }
  //   };

  //   updateCountdown();
  //   const interval = setInterval(updateCountdown, 1000); // Update every second

  //   return () => clearInterval(interval);
  // }, []);

  const [serverOffset, setServerOffset] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = getServerTimeOffset(setServerOffset);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (serverOffset === null) return;

    let now = Date.now() + serverOffset;

    const interval = setInterval(() => {
      now += 1000; // ⬅️ THIS is what was missing

      const diff = AIRDROP_END_TIME - now;

      if (diff <= 0) {
        setTimeLeft("Airdrop Ended");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [serverOffset]);

  return (
    <>
      <AirdropPoolModal
        timer={timeLeft}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div
        className=" cursor-pointer 
    bg-gradient-to-r 
    from-purple-500 to-indigo-500 
    dark:from-purple-300 dark:to-violet-400 
    text-white 
    dark:text-gray-900
    py-3 overflow-hidden relative group shadow-md"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-center px-4">
          <div
            className="flex gap-40 whitespace-nowrap animate-scroll"
            style={{
              display: "inline-flex",
              animation: "scroll-left 25s linear infinite",
              width: "max-content",
            }}
          >
            {/* Repeat content twice for seamless loop */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-8 pr-4">
                {/* Pool amount */}
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white dark:text-gray-900 drop-shadow">
                    🎉 ${poolAmount.toLocaleString()} Airdrop Pool!
                  </span>
                </div>

                {/* Timer */}
                <div className="flex items-center space-x-2">
                  <Badge className="bg-white/20 text-white dark:text-gray-900 border-white/30 dark:border-gray-600 backdrop-blur-sm">
                    ⏰ {timeLeft}
                  </Badge>
                </div>

                {/* Rewards */}
                <div className="flex items-center space-x-2">
                  <span className="text-white/90 dark:text-gray-900 font-medium">
                    🏆 Top users share ${poolAmount?.toLocaleString()} in tokens
                  </span>
                </div>

                {/* Growth info */}
                <div className="flex items-center space-x-2">
                  <span className="text-white/90 dark:text-gray-900 font-medium">
                    📈 Pool grows with more users!
                  </span>
                </div>

                {/* Action button */}
                <Button
                  className="bg-white/10 hover:bg-white/20 text-white dark:text-gray-900 border border-white/30 dark:border-gray-500 shadow-sm ml-4 shrink-0 backdrop-blur-sm"
                  size="sm"
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </div>

        <style>{`
    @keyframes scroll-left {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `}</style>
      </div>
    </>
  );
}

// Modal Component
interface AirdropPoolModalProps {
  isOpen: boolean;
  timer: string;
  onClose: () => void;
  initialPool?: number;
  initialUsers?: number;
  currentUsers?: number;
  rewardIncrement?: number;
  userThreshold?: number;
}

export function AirdropPoolModal({
  isOpen,
  onClose,
  timer,
  initialPool = 10500,
  initialUsers = 1000,
  currentUsers = 1250,
  rewardIncrement = 100,
  userThreshold = 50,
}: AirdropPoolModalProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [poolAmount, setPoolAmount] = useState(initialPool);

  // Calculate pool amount based on user growth
  useEffect(() => {
    const userIncrease = currentUsers - initialUsers;
    const thresholdCount = Math.floor(userIncrease / userThreshold);
    // const newPoolAmount = initialPool + thresholdCount * rewardIncrement;
    const newPoolAmount = initialPool;
    setPoolAmount(newPoolAmount);
  }, [currentUsers, initialUsers, initialPool, rewardIncrement, userThreshold]);

  // Countdown timer
  useEffect(() => {
    // Calculate 90 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const updateCountdown = () => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );

        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft("Airdrop completed!");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, []);

  // Calculate user progress to next threshold
  const userIncrease = currentUsers - initialUsers;
  const nextThreshold = userThreshold - (userIncrease % userThreshold);
  const progressPercentage =
    ((userIncrease % userThreshold) / userThreshold) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-purple-50 dark:from-[#0b0b14] dark:to-purple-900/20 border-2 border-purple-200 dark:border-purple-200 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle
            className="
          text-center text-2xl font-extrabold 
          text-purple-700 dark:text-purple-300
        "
          >
            Token Airdrop Pool
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pool Amount */}
          <div className="text-center">
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                ${poolAmount.toLocaleString()}
              </span>
              <span className="text-gray-700 dark:text-gray-400 ml-2">
                in token rewards
              </span>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
              Distributed to top meme voters
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="bg-white dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-300 mr-2" />
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                Airdrop Countdown
              </span>
            </div>
            <div className="text-center">
              <Badge
                className="
              bg-purple-600 dark:bg-purple-300 
              text-white dark:text-gray-900 
              text-lg py-1 px-3 rounded-md shadow
            "
              >
                {timer}
              </Badge>
            </div>
          </div>

          {/* How to Qualify */}
          <div className="bg-white dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center">
              <Gift className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-300" />
              How to qualify for the airdrop:
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-400 space-y-1">
              {[
                "Vote on memes daily",
                "Share content with your friends",
                "Invite others to join the platform",
                "Create engaging meme content",
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-300 mr-2">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 dark:from-purple-300 to-indigo-500 dark:to-indigo-400 hover:from-purple-400 hover:to-indigo-400 text-white dark:text-gray-900 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AirdropPoolBanner;
