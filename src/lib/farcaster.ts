import { sdk } from "@farcaster/miniapp-sdk";
import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "viem";

const CENTRAL_WALLET_ADDRESS = import.meta.env.VITE_CENTRAL_WALLET_ADDRESS;
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}

export interface TransactionParams {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: `0x${string}`;
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

  /**
   * Prepares USDC transfer transaction parameters for Wagmi
   * This function creates the transaction data but doesn't send it
   * The actual sending should be done using Wagmi's useSendTransaction hook
   */
  preparePadsPurchaseTransaction(amount: number): TransactionParams {
    const PRICE_PER_PAD = 0.5; // $0.50 per pad
    const totalCost = amount * PRICE_PER_PAD; // e.g. 10 * 0.5 = 5.0 USDC

    if (!CENTRAL_WALLET_ADDRESS) {
      throw new Error("Central wallet address not configured");
    }

    // Convert to proper units (USDC has 6 decimals)
    const costInUnits = parseUnits(totalCost.toString(), USDC_DECIMALS);

    // Encode the transfer function call
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [CENTRAL_WALLET_ADDRESS as `0x${string}`, costInUnits],
    });

    return {
      to: USDC_CONTRACT as `0x${string}`,
      data: data,
      value: "0x0", // No ETH value for ERC20 transfer
    };
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
      console.error("Failed to get user:", error);
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

  // Helper method to get capabilities
  async getCapabilities(): Promise<string[]> {
    try {
      return await sdk.getCapabilities();
    } catch (error) {
      console.warn("Failed to get capabilities:", error);
      return [];
    }
  }

  // Haptic feedback helpers
  async triggerSuccessHaptic() {
    try {
      const capabilities = await this.getCapabilities();
      if (capabilities.includes("haptics.impactOccurred")) {
        await sdk.haptics.impactOccurred("medium");
      }
    } catch (error) {
      console.warn("Haptic feedback not available:", error);
    }
  }

  async triggerErrorHaptic() {
    try {
      const capabilities = await this.getCapabilities();
      if (capabilities.includes("haptics.notificationOccurred")) {
        await sdk.haptics.notificationOccurred("error");
      }
    } catch (error) {
      console.warn("Error haptic feedback not available:", error);
    }
  }
}

export const farcasterService = new FarcasterService();
