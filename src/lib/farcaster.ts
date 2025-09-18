import { sdk } from "@farcaster/miniapp-sdk";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "viem";

const CENTRAL_WALLET_ADDRESS = import.meta.env.VITE_CENTRAL_WALLET_ADDRESS;
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

const { sendTransaction, data: hash, isPending } = useSendTransaction();
export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

class FarcasterService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await sdk.actions.ready();
      this.isInitialized = true;
      console.log("Farcaster SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Farcaster SDK:", error);
      // Fallback for development/testing
      this.isInitialized = false;
    }
  }

  getSDK() {
    return sdk;
  }

  async buyPadsWithUSDC(amount: number) {
    const PRICE_PER_PAD = 0.5; // $0.50 per pad
    const amountPerPad = amount * PRICE_PER_PAD; // e.g. amount * 0.5
    const cost = (amountPerPad * Math.pow(10, USDC_DECIMALS)).toString();

    const sdk = farcasterService.getSDK();
    const wallet = sdk.wallet;

    if (!wallet) {
      console.error("Wallet not available");
      alert("Please connect your wallet first.");
      return;
    }

    try {
      sdk.haptics.impactOccurred("medium");

      const costInUnits = parseUnits(cost, 6);

      // Encode the transfer call
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [CENTRAL_WALLET_ADDRESS, costInUnits],
      });

      sendTransaction({
        to: USDC_CONTRACT,
        data,
      });

      sdk.haptics.notificationOccurred("success");

      // Maybe show UI feedback
      alert(`Transaction submitted! You bought ${amount} pad(s).`);

      return hash;
    } catch (err: any) {
      console.error("Error buying pads with USDC:", err);

      // Trigger error haptics
      sdk.haptics.notificationOccurred("error");

      // Show error to user
      alert("Transaction failed: " + (err.message ?? err));

      throw err;
    }
  }

  async getUser(): Promise<FarcasterUser | null> {
    try {
      const context = await sdk.context;

      if (context.user) {
        return {
          fid: context.user.fid,
          username: context.user.username || "",
          displayName: context.user.displayName || "",
          pfpUrl: context.user.pfpUrl || "",
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async shareFrame(text: string, embedUrl?: string) {
    if (!this.isInitialized) {
      // Fallback sharing for development
      if (navigator.share) {
        return navigator.share({
          title: import.meta.env.VITE_APP_NAME,
          text,
          url: embedUrl || window.location.href,
        });
      }
      return Promise.resolve();
    }

    try {
      return await sdk.actions.openUrl(embedUrl || window.location.href);
    } catch (error) {
      console.error("Failed to share frame:", error);
      throw error;
    }
  }

  isInFarcaster(): boolean {
    return this.isInitialized;
  }
}

export const farcasterService = new FarcasterService();
