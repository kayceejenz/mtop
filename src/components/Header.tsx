import { useState } from "react";
import { CheckCircle, Loader2, Menu, Wallet, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import { hash } from "crypto";
import { Alert, AlertDescription } from "./ui/alert";

export default function Header({
  user,
  isConnected,
  connectors,
  connect,
  handleBuyPads,
  buyPadsStatus,
  isSending,
  isConfirming,
  getBuyPadsButtonIcon,
  getBuyPadsButtonText,
  buyPadsError,
  hash,
}) {
  return (
    <header className=" top-0 z-40 bg-purple-50 dark:bg-[#0b0b14] backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Beta */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-500 dark:from-purple-300 dark:to-purple-300 bg-clip-text text-transparent">
              Memedotfun
            </h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Beta
            </Badge>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {/* Pads counter */}
            <div className="flex items-center gap-2 ">
              ⚡
              <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                {user.pads} Likes
              </span>
            </div>

            {/* Buy Pads button */}
            <Button
              onClick={
                // !isConnected
                //   ? () => connect({ connector: connectors[0] })
                //   : handleBuyPads
                handleBuyPads
              }
              size="sm"
              disabled={isSending || isConfirming}
              className={`transition-all duration-200 shadow-sm font-medium  hover:shadow-xl
    ${
      buyPadsStatus === "success"
        ? "bg-green-600 hover:bg-green-700 text-white"
        : buyPadsStatus === "error"
        ? "bg-red-600 hover:bg-red-700 text-white"
        : "bg-gradient-to-r from-purple-500 dark:from-purple-300 to-indigo-500 dark:to-indigo-300 hover:from-purple-400 hover:to-indigo-400 text-white dark:text-gray-900"
    }
    ${isSending || isConfirming ? "cursor-not-allowed opacity-75" : ""}
  `}
            >
              {getBuyPadsButtonIcon()}
              {getBuyPadsButtonText()}
            </Button>

            {/* User profile */}
            <div className="flex items-center space-x-2">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.username || "User"
                )}&background=6B46C1&color=fff&rounded=true`}
                alt={user.displayName || "User"}
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700"
              />
              <span className="text-sm font-medium hidden sm:inline text-gray-800 dark:text-gray-200">
                {user.username}
              </span>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            {/* User profile */}
            <div className="flex items-center gap-2">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.username || "User"
                )}&background=6B46C1&color=fff&rounded=true`}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {user.username}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden mt-3 space-y-3 border-t border-gray-200 dark:border-gray-800 pt-3">
          {/* Pads counter */}
          <div className="flex items-center gap-2 p-2 pr-4 rounded-md border border-gray-200 dark:border-gray-700">
            ⚡
            <span className="font-semibold text-md text-gray-800 dark:text-gray-100">
              {user.pads} Likes
            </span>
          </div>

          {/* Buy Pads button */}
          <Button
            onClick={
              !isConnected
                ? () => connect({ connector: connectors[0] })
                : handleBuyPads
            }
            size="sm"
            disabled={isSending || isConfirming}
            className={`w-full transition-all duration-200 shadow-sm font-medium hover:shadow-xl
    ${
      buyPadsStatus === "success"
        ? "bg-green-600 hover:bg-green-700 text-white"
        : buyPadsStatus === "error"
        ? "bg-red-600 hover:bg-red-700 text-white"
        : "bg-gradient-to-r from-purple-500 dark:from-purple-300 to-indigo-500 dark:to-indigo-300 hover:from-purple-400 hover:to-indigo-400 text-white dark:text-gray-900"
    }
    ${isSending || isConfirming ? "cursor-not-allowed opacity-75" : ""}
  `}
          >
            {getBuyPadsButtonIcon()}
            {getBuyPadsButtonText()}
          </Button>

          {/* User profile */}
          {/* <div className="flex items-center gap-2">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.username || "User"
                )}&background=6B46C1&color=fff&rounded=true`}
                alt={user.displayName || "User"}
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {user.username}
              </span>
            </div> */}
        </div>

        {/* Status Alerts */}
        {buyPadsStatus === "success" && (
          <div className="container mx-auto  pt-4">
            <Alert className="flex items-start gap-3 border border-green-300 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200 shadow-sm rounded-lg p-4">
              <CheckCircle className="h-5 w-5 flex-shrink-0 !text-green-900 dark:!text-green-300" />
              <div className="flex flex-col text-left">
                <AlertDescription className="text-sm font-medium">
                  Successfully purchased{" "}
                  <span className="font-bold">10 likes</span> 🎉
                  <span className="block text-xs text-green-700 dark:text-green-300 mt-1">
                    Your balance has been updated.
                  </span>
                </AlertDescription>

                {hash && (
                  <div className="mt-2 text-xs font-mono break-all text-gray-700 dark:text-gray-400">
                    <span className="font-semibold">Transaction:</span> {hash}
                  </div>
                )}
              </div>
            </Alert>
          </div>
        )}

        {buyPadsStatus === "error" && buyPadsError && (
          <div className="pt-4">
            <Alert className="flex items-start gap-3 border border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200 shadow-sm rounded-lg p-4">
              <XCircle className="h-5 w-5 flex-shrink-0 !text-red-900 dark:!text-red-300" />
              <div className="flex flex-col text-left">
                <AlertDescription className="text-sm font-medium mt-0.5">
                  Oops! Something went wrong.
                  <span className="block text-xs text-red-700 dark:text-red-300 ">
                    {buyPadsError}
                  </span>
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}

        {buyPadsStatus === "confirming" && (
          <div className="pt-4">
            <Alert className="flex items-start gap-3 border border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200 shadow-sm rounded-lg p-4">
              <Loader2 className="h-5 w-5 flex-shrink-0 !text-blue-900 dark:!text-blue-300 animate-spin" />
              <div className="flex flex-col text-left">
                <AlertDescription className="text-sm font-medium">
                  Confirming your transaction on the blockchain.
                  <span className="block text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This may take a few moments...
                  </span>
                  {hash && (
                    <div className="mt-2 text-xs font-mono break-all p-1 rounded bg-blue-100 dark:bg-blue-800/40">
                      Transaction: {hash}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}

        {/* Wallet Connection Alert */}
        {!isConnected && (
          <div className="pt-4">
            <Alert className="flex items-start gap-3 border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200 shadow-sm rounded-lg p-4">
              <Wallet className="h-5 w-5 flex-shrink-0 !text-amber-900 dark:!text-amber-400" />{" "}
              <div className="flex flex-col text-left">
                <AlertDescription className="text-sm font-medium">
                  Connect your{" "}
                  <span className="font-semibold">Farcaster wallet</span> to
                  purchase likes and interact with the app.
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}
      </div>
    </header>
  );
}
