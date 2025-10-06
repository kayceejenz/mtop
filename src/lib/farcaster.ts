import { sdk } from "@farcaster/miniapp-sdk";
import { encodeFunctionData, parseUnits } from "viem";
import { erc20Abi } from "viem";

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
}
export interface TransactionParams {
  address: `0x${string}`;
  abi: any;
  functionName: "transfer";
  args: [`0x${string}`, bigint];
}

class FarcasterService {
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await sdk.actions.ready();
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Farcaster SDK:", error);
      this.isInitialized = false;
    }
  }

  getSDK() {
    return sdk;
  }

  /**
   * Prepares USDC transfer transaction parameters for Wagmi
   * Use this with Wagmi's useSendTransaction or useWriteContract hook
   */
  preparePadsPurchaseTransaction(price: number): TransactionParams {
    const CENTRAL_WALLET_ADDRESS = import.meta.env.VITE_CENTRAL_WALLET_ADDRESS;
    const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const USDC_DECIMALS = 6;

    if (!CENTRAL_WALLET_ADDRESS) {
      throw new Error("Central wallet address not configured");
    }

    const costInUnits = parseUnits(price.toString(), USDC_DECIMALS);

    return {
      address: USDC_CONTRACT as `0x${string}`,
      abi: erc20Abi,
      functionName: "transfer",
      args: [CENTRAL_WALLET_ADDRESS as `0x${string}`, costInUnits],
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

  // Haptic feedback helpers
  async triggerSuccessHaptic() {
    try {
      if (sdk.haptics?.impactOccurred) {
        await sdk.haptics.impactOccurred("medium");
      }
    } catch (error) {
      console.warn("Haptic feedback not available:", error);
    }
  }

  async triggerErrorHaptic() {
    try {
      if (sdk.haptics?.notificationOccurred) {
        await sdk.haptics.notificationOccurred("error");
      }
    } catch (error) {
      console.warn("Error haptic feedback not available:", error);
    }
  }
}

export const farcasterService = new FarcasterService();
