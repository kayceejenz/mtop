import { sdk } from "@farcaster/miniapp-sdk";

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

  async getUser(): Promise<FarcasterUser | null> {
    if (!this.isInitialized) {
      return {
        fid: 12345,
        username: "testuser",
        displayName: "Test User",
        pfpUrl: "https://via.placeholder.com/100x100/6366f1/ffffff?text=TU",
      };
    }

    try {
      const context = await sdk.context;
      console.log(context);

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
      console.error("Failed to get Farcaster user:", error);
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
