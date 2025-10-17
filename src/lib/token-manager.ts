import type { TokenData } from "@/types/auth";

const TOKEN_KEY = "auth-tokens";
const SESSION_TOKEN_KEY = "session-auth-tokens";

export class TokenManager {
  private static instance: TokenManager;
  private tokenData: TokenData | null = null;

  private constructor() {
    this.loadTokens();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Store tokens with remember me functionality
  setTokens(
    accessToken: string,
    expiresIn: number,
    rememberMe: boolean = false,
    userId?: number
  ): void {
    const expiresAt = Date.now() + expiresIn * 1000;

    this.tokenData = {
      accessToken,
      expiresAt,
      rememberMe,
      userId,
    };

    if (typeof window !== "undefined") {
      // Only store access token and metadata, not refresh token
      const tokenDataForStorage = {
        accessToken,
        expiresAt,
        rememberMe,
        userId,
      };
      const tokenDataString = JSON.stringify(tokenDataForStorage);

      if (rememberMe) {
        // Store in localStorage for persistent login
        localStorage.setItem(TOKEN_KEY, tokenDataString);
        localStorage.setItem("mirage_remember_me", "true");
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
      } else {
        // Store in sessionStorage for session-only login
        sessionStorage.setItem(SESSION_TOKEN_KEY, tokenDataString);
        localStorage.setItem("mirage_remember_me", "false");
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }

  // Get current access token
  getAccessToken(): string | null {
    if (!this.tokenData) {
      this.loadTokens();
    }

    if (this.tokenData && this.isTokenValid()) {
      return this.tokenData.accessToken;
    }

    return null;
  }

  // Get stored userId
  getUserId(): number | null {
    if (!this.tokenData) {
      this.loadTokens();
    }

    return this.tokenData?.userId || null;
  }

  // Check if access token is valid (not expired)
  isTokenValid(): boolean {
    if (!this.tokenData) {
      return false;
    }

    return Date.now() < this.tokenData.expiresAt;
  }

  // Check if access token will expire soon (within 5 minutes)
  shouldRefreshToken(): boolean {
    if (!this.tokenData) {
      return false;
    }

    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return this.tokenData.expiresAt <= fiveMinutesFromNow;
  }

  // Update access token after refresh
  updateAccessToken(accessToken: string, expiresIn: number): void {
    if (this.tokenData) {
      this.setTokens(
        accessToken,
        expiresIn,
        this.tokenData.rememberMe,
        this.tokenData.userId
      );
    }
  }

  // Clear all tokens
  clearTokens(): void {
    this.tokenData = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("mirage_remember_me");
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  // Load tokens from storage
  private loadTokens(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      // Try localStorage first (remember me)
      let tokenDataString = localStorage.getItem(TOKEN_KEY);
      let storage = "localStorage";

      // If not in localStorage, try sessionStorage
      if (!tokenDataString) {
        tokenDataString = sessionStorage.getItem(SESSION_TOKEN_KEY);
        storage = "sessionStorage";
      }

      if (tokenDataString) {
        const parsed = JSON.parse(tokenDataString) as TokenData;

        // Check if token has expired
        if (Date.now() < parsed.expiresAt) {
          this.tokenData = parsed;
        } else {
          // Token expired, clear it
          if (storage === "localStorage") {
            localStorage.removeItem(TOKEN_KEY);
          } else {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
          }
        }
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      this.clearTokens();
    }
  }

  // Get token expiry info
  getTokenInfo(): {
    isValid: boolean;
    expiresAt: number | null;
    shouldRefresh: boolean;
    userId: number | null;
  } {
    return {
      isValid: this.isTokenValid(),
      expiresAt: this.tokenData?.expiresAt || null,
      shouldRefresh: this.shouldRefreshToken(),
      userId: this.getUserId(),
    };
  }

  // Check if user chose remember me
  isRememberMeEnabled(): boolean {
    return this.tokenData?.rememberMe || false;
  }

  // Check if we have stored token data (for initialization)
  hasTokenData(): boolean {
    return this.tokenData !== null;
  }

  // Check if there's any stored authentication data (even expired)
  hasStoredAuthData(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    const hasLocalStorage = localStorage.getItem(TOKEN_KEY) !== null;
    const hasSessionStorage = sessionStorage.getItem(SESSION_TOKEN_KEY) !== null;
    const hasRememberMe = localStorage.getItem("mirage_remember_me") === "true";

    return hasLocalStorage || hasSessionStorage || hasRememberMe;
  }
}

export const tokenManager = TokenManager.getInstance();
