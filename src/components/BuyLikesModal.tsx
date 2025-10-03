import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, DollarSign, Star } from "lucide-react";

interface BuyLikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number, paymentMethod: "eth" | "usdc") => void;
  ethToTokenRate: number;
  tokenToPadsRate: number;
}

const BUNDLE_PACKAGES = [
  {
    likes: 10,
    usdcPrice: 0.99,
    popular: false,
    savings: null,
  },
  {
    likes: 30,
    usdcPrice: 1.99,
    popular: false,
    savings: "30%",
  },
  {
    likes: 60,
    usdcPrice: 2.99,
    popular: true,
    savings: "46%",
  },
  {
    likes: 100,
    usdcPrice: 4.99,
    popular: false,
    savings: "46%",
  },
];

export default function BuyLikesModal({
  isOpen,
  onClose,
  onPurchase,
  ethToTokenRate,
  tokenToPadsRate,
}: BuyLikesModalProps) {
  const [selectedBundle, setSelectedBundle] = useState(BUNDLE_PACKAGES[2]); // Default to 30 likes
  const paymentMethod = "usdc"; // Fixed to USDC only

  // Calculate ETH equivalent (assuming 1 ETH = ~$2500)
  const ethPrice = 2500; // This should ideally come from a price feed
  const ethCost = selectedBundle.usdcPrice / ethPrice;

  const handlePurchase = () => {
    onPurchase(selectedBundle.likes, paymentMethod);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-[#0b0b14] dark:to-purple-900/20 border-2 border-purple-300 dark:border-purple-200 rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center space-x-2 text-purple-700 dark:text-purple-200">
            <span>Choose a bundle</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bundle Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUNDLE_PACKAGES.map((bundle) => (
                <div
                  key={bundle.likes}
                  className={`relative h-full flex flex-col items-center justify-start rounded-xl p-4 cursor-pointer transition-all duration-150 border-2 
            ${
              selectedBundle.likes === bundle.likes
                ? "border-purple-500 bg-gradient-to-br from-purple-300 to-purple-50 dark:from-purple-800/40 dark:to-gray-900 shadow-md"
                : "border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900 hover:border-purple-400 hover:shadow-sm"
            }`}
                  onClick={() => setSelectedBundle(bundle)}
                >
                  {bundle.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 min-w-[120px] text-center shadow-md">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 items-center justify-center mt-2 text-center">
                    <div className="font-black text-purple-600 dark:text-white flex items-center justify-center">
                      ⚡
                      <span className="text-xl sm:text-2xl ">
                        {bundle.likes}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-normal ml-1">
                        Likes
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-purple-200">
                      ${bundle.usdcPrice}
                    </div>
                    {bundle.savings && (
                      <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs">
                        🎉 Save {bundle.savings}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">
              Payment Method
            </h3>
            <div className="flex justify-center">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-2 flex flex-col items-start gap-0">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                    $USDC Only
                  </div>
                  <div className="text-green-500 text-lg">✓</div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Stable pricing, no volatility
                </div>
              </div>
            </div>
          </div>

          {/* Selected Package Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm">
            <div className="text-center space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Purchase
              </h4>
              <div className="flex justify-center items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-600 dark:text-purple-300 flex items-center">
                    ⚡ {selectedBundle.likes}
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-normal ml-2">
                      Likes
                    </span>
                  </div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    ${selectedBundle.usdcPrice} USDC
                  </div>
                </div>
              </div>
              {selectedBundle.savings && (
                <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  🎉 You save {selectedBundle.savings}!
                </Badge>
              )}
            </div>
          </div>

          {/* Purchase Button */}
          <Button
            onClick={handlePurchase}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-300 dark:to-indigo-300 hover:from-purple-400 hover:to-indigo-400 text-white dark:text-gray-900 font-semibold py-4 text-lg"
            size="lg"
          >
            <Zap className="w-6 h-6 mr-2" />
            Buy {selectedBundle.likes} Likes Bundle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
