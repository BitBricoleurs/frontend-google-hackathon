/**
 * Token Manager Tests
 *
 * Unit tests for TokenManager class that handles token storage,
 * validation, and lifecycle management.
 */

// Skip MSW for this test file (not needed for token manager)
jest.mock("../../mocks/server", () => ({
  server: {
    listen: jest.fn(),
    resetHandlers: jest.fn(),
    close: jest.fn(),
  },
}));

import { TokenManager, tokenManager } from "../token-manager";

describe("TokenManager", () => {
  let manager: TokenManager;

  beforeEach(() => {
    // Get singleton instance
    manager = TokenManager.getInstance();
    // Clear all tokens before each test
    manager.clearTokens();
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = TokenManager.getInstance();
      const instance2 = TokenManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should export a global tokenManager instance", () => {
      expect(tokenManager).toBe(TokenManager.getInstance());
    });
  });

  describe("setTokens - Remember Me (localStorage)", () => {
    it("should store tokens in localStorage when rememberMe is true", () => {
      const accessToken = "test-access-token";
      const expiresIn = 900; // 15 minutes
      const userId = 123;

      manager.setTokens(accessToken, expiresIn, true, userId);

      const stored = localStorage.getItem("auth-tokens");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.accessToken).toBe(accessToken);
      expect(parsed.rememberMe).toBe(true);
      expect(parsed.userId).toBe(userId);
      expect(parsed.expiresAt).toBeGreaterThan(Date.now());

      // Should also set remember me flag
      expect(localStorage.getItem("mirage_remember_me")).toBe("true");

      // Should NOT store in sessionStorage
      expect(sessionStorage.getItem("session-auth-tokens")).toBeNull();
    });

    it("should calculate correct expiry time", () => {
      const expiresIn = 900; // 15 minutes
      const beforeTime = Date.now() + expiresIn * 1000;

      manager.setTokens("token", expiresIn, true);

      const stored = JSON.parse(localStorage.getItem("auth-tokens")!);
      const afterTime = Date.now() + expiresIn * 1000;

      expect(stored.expiresAt).toBeGreaterThanOrEqual(beforeTime);
      expect(stored.expiresAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("setTokens - Session Only (sessionStorage)", () => {
    it("should store tokens in sessionStorage when rememberMe is false", () => {
      const accessToken = "session-token";
      const expiresIn = 900;

      manager.setTokens(accessToken, expiresIn, false);

      const stored = sessionStorage.getItem("session-auth-tokens");
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.accessToken).toBe(accessToken);
      expect(parsed.rememberMe).toBe(false);

      // Should set remember me flag to false
      expect(localStorage.getItem("mirage_remember_me")).toBe("false");

      // Should NOT store in localStorage
      expect(localStorage.getItem("auth-tokens")).toBeNull();
    });

    it("should default to session storage when rememberMe not provided", () => {
      manager.setTokens("token", 900);

      expect(sessionStorage.getItem("session-auth-tokens")).toBeTruthy();
      expect(localStorage.getItem("auth-tokens")).toBeNull();
    });
  });

  describe("setTokens - Storage Switching", () => {
    it("should clear sessionStorage when switching to localStorage", () => {
      // First set in sessionStorage
      manager.setTokens("session-token", 900, false);
      expect(sessionStorage.getItem("session-auth-tokens")).toBeTruthy();

      // Then switch to localStorage
      manager.setTokens("local-token", 900, true);
      expect(localStorage.getItem("auth-tokens")).toBeTruthy();
      expect(sessionStorage.getItem("session-auth-tokens")).toBeNull();
    });

    it("should clear localStorage when switching to sessionStorage", () => {
      // First set in localStorage
      manager.setTokens("local-token", 900, true);
      expect(localStorage.getItem("auth-tokens")).toBeTruthy();

      // Then switch to sessionStorage
      manager.setTokens("session-token", 900, false);
      expect(sessionStorage.getItem("session-auth-tokens")).toBeTruthy();
      expect(localStorage.getItem("auth-tokens")).toBeNull();
    });
  });

  describe("getAccessToken", () => {
    it("should return access token when valid", () => {
      const token = "valid-token";
      manager.setTokens(token, 900, false);

      expect(manager.getAccessToken()).toBe(token);
    });

    it("should return null when no token is set", () => {
      expect(manager.getAccessToken()).toBeNull();
    });

    it("should return null when token is expired", () => {
      const token = "expired-token";
      const expiresIn = -1; // Expired 1 second ago

      manager.setTokens(token, expiresIn, false);

      expect(manager.getAccessToken()).toBeNull();
    });

    it("should load token from localStorage on first access", () => {
      // Manually set token in localStorage (simulating page refresh)
      const tokenData = {
        accessToken: "persisted-token",
        expiresAt: Date.now() + 900000,
        rememberMe: true,
      };
      localStorage.setItem("auth-tokens", JSON.stringify(tokenData));

      // Create new instance (simulates app restart)
      const newManager = TokenManager.getInstance();

      expect(newManager.getAccessToken()).toBe("persisted-token");
    });

    it("should load token from sessionStorage on first access", () => {
      // Manually set token in sessionStorage
      const tokenData = {
        accessToken: "session-token",
        expiresAt: Date.now() + 900000,
        rememberMe: false,
      };
      sessionStorage.setItem("session-auth-tokens", JSON.stringify(tokenData));

      const newManager = TokenManager.getInstance();

      expect(newManager.getAccessToken()).toBe("session-token");
    });
  });

  describe("getUserId", () => {
    it("should return stored userId", () => {
      manager.setTokens("token", 900, false, 456);

      expect(manager.getUserId()).toBe(456);
    });

    it("should return null when no userId is set", () => {
      manager.setTokens("token", 900, false);

      expect(manager.getUserId()).toBeNull();
    });

    it("should return null when no token is set", () => {
      expect(manager.getUserId()).toBeNull();
    });
  });

  describe("isTokenValid", () => {
    it("should return true for valid token", () => {
      manager.setTokens("token", 900, false);

      expect(manager.isTokenValid()).toBe(true);
    });

    it("should return false when no token is set", () => {
      expect(manager.isTokenValid()).toBe(false);
    });

    it("should return false for expired token", () => {
      manager.setTokens("token", -1, false);

      expect(manager.isTokenValid()).toBe(false);
    });

    it("should return true for token expiring in 1 second", () => {
      manager.setTokens("token", 1, false);

      expect(manager.isTokenValid()).toBe(true);
    });
  });

  describe("shouldRefreshToken", () => {
    it("should return false when no token is set", () => {
      expect(manager.shouldRefreshToken()).toBe(false);
    });

    it("should return true when token expires in less than 5 minutes", () => {
      const fourMinutes = 4 * 60; // 4 minutes
      manager.setTokens("token", fourMinutes, false);

      expect(manager.shouldRefreshToken()).toBe(true);
    });

    it("should return false when token expires in more than 5 minutes", () => {
      const sixMinutes = 6 * 60; // 6 minutes
      manager.setTokens("token", sixMinutes, false);

      expect(manager.shouldRefreshToken()).toBe(false);
    });

    it("should return true when token expires exactly in 5 minutes", () => {
      const fiveMinutes = 5 * 60; // 5 minutes
      manager.setTokens("token", fiveMinutes, false);

      expect(manager.shouldRefreshToken()).toBe(true);
    });
  });

  describe("updateAccessToken", () => {
    it("should update access token while preserving rememberMe and userId", () => {
      // Set initial token with rememberMe and userId
      manager.setTokens("old-token", 900, true, 789);

      // Update token
      manager.updateAccessToken("new-token", 1800);

      // Check new token
      expect(manager.getAccessToken()).toBe("new-token");

      // Check rememberMe and userId are preserved
      const stored = JSON.parse(localStorage.getItem("auth-tokens")!);
      expect(stored.rememberMe).toBe(true);
      expect(stored.userId).toBe(789);
    });

    it("should update token in correct storage (localStorage)", () => {
      manager.setTokens("old-token", 900, true);

      manager.updateAccessToken("new-token", 900);

      expect(localStorage.getItem("auth-tokens")).toBeTruthy();
      expect(sessionStorage.getItem("session-auth-tokens")).toBeNull();
    });

    it("should update token in correct storage (sessionStorage)", () => {
      manager.setTokens("old-token", 900, false);

      manager.updateAccessToken("new-token", 900);

      expect(sessionStorage.getItem("session-auth-tokens")).toBeTruthy();
      expect(localStorage.getItem("auth-tokens")).toBeNull();
    });

    it("should not throw error when updating with no existing token", () => {
      expect(() => {
        manager.updateAccessToken("new-token", 900);
      }).not.toThrow();
    });
  });

  describe("clearTokens", () => {
    it("should clear tokens from localStorage", () => {
      manager.setTokens("token", 900, true);
      expect(localStorage.getItem("auth-tokens")).toBeTruthy();

      manager.clearTokens();

      expect(localStorage.getItem("auth-tokens")).toBeNull();
      expect(localStorage.getItem("mirage_remember_me")).toBeNull();
    });

    it("should clear tokens from sessionStorage", () => {
      manager.setTokens("token", 900, false);
      expect(sessionStorage.getItem("session-auth-tokens")).toBeTruthy();

      manager.clearTokens();

      expect(sessionStorage.getItem("session-auth-tokens")).toBeNull();
    });

    it("should clear internal token data", () => {
      manager.setTokens("token", 900, false);
      expect(manager.getAccessToken()).toBe("token");

      manager.clearTokens();

      expect(manager.getAccessToken()).toBeNull();
      expect(manager.isTokenValid()).toBe(false);
      expect(manager.getUserId()).toBeNull();
    });
  });

  describe("getTokenInfo", () => {
    it("should return complete token info for valid token", () => {
      manager.setTokens("token", 240, false, 123); // 4 minutes - should refresh

      const info = manager.getTokenInfo();

      expect(info.isValid).toBe(true);
      expect(info.expiresAt).toBeGreaterThan(Date.now());
      expect(info.shouldRefresh).toBe(true); // 4 min < 5 min threshold
      expect(info.userId).toBe(123);
    });

    it("should return info for token that should not refresh yet", () => {
      manager.setTokens("token", 600, false); // 10 minutes

      const info = manager.getTokenInfo();

      expect(info.isValid).toBe(true);
      expect(info.shouldRefresh).toBe(false);
    });

    it("should return nulls when no token is set", () => {
      const info = manager.getTokenInfo();

      expect(info.isValid).toBe(false);
      expect(info.expiresAt).toBeNull();
      expect(info.shouldRefresh).toBe(false);
      expect(info.userId).toBeNull();
    });
  });

  describe("isRememberMeEnabled", () => {
    it("should return true when rememberMe is enabled", () => {
      manager.setTokens("token", 900, true);

      expect(manager.isRememberMeEnabled()).toBe(true);
    });

    it("should return false when rememberMe is disabled", () => {
      manager.setTokens("token", 900, false);

      expect(manager.isRememberMeEnabled()).toBe(false);
    });

    it("should return false when no token is set", () => {
      expect(manager.isRememberMeEnabled()).toBe(false);
    });
  });

  describe("hasTokenData", () => {
    it("should return true when token data exists", () => {
      manager.setTokens("token", 900, false);

      expect(manager.hasTokenData()).toBe(true);
    });

    it("should return false when no token data exists", () => {
      expect(manager.hasTokenData()).toBe(false);
    });

    it("should return false after clearing tokens", () => {
      manager.setTokens("token", 900, false);
      manager.clearTokens();

      expect(manager.hasTokenData()).toBe(false);
    });
  });

  describe("hasStoredAuthData", () => {
    it("should return true when localStorage has token", () => {
      localStorage.setItem("auth-tokens", JSON.stringify({ accessToken: "test" }));

      expect(manager.hasStoredAuthData()).toBe(true);
    });

    it("should return true when sessionStorage has token", () => {
      sessionStorage.setItem("session-auth-tokens", JSON.stringify({ accessToken: "test" }));

      expect(manager.hasStoredAuthData()).toBe(true);
    });

    it("should return true when remember me flag exists", () => {
      localStorage.setItem("mirage_remember_me", "true");

      expect(manager.hasStoredAuthData()).toBe(true);
    });

    it("should return false when no auth data exists", () => {
      expect(manager.hasStoredAuthData()).toBe(false);
    });
  });

  describe("Token Loading - Expired Tokens", () => {
    it("should not load expired token from localStorage", () => {
      const expiredTokenData = {
        accessToken: "expired-token",
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        rememberMe: true,
      };
      localStorage.setItem("auth-tokens", JSON.stringify(expiredTokenData));

      const newManager = TokenManager.getInstance();

      expect(newManager.getAccessToken()).toBeNull();
      // Expired token should be cleared
      expect(localStorage.getItem("auth-tokens")).toBeNull();
    });

    it("should not load expired token from sessionStorage", () => {
      const expiredTokenData = {
        accessToken: "expired-token",
        expiresAt: Date.now() - 1000,
        rememberMe: false,
      };
      sessionStorage.setItem("session-auth-tokens", JSON.stringify(expiredTokenData));

      const newManager = TokenManager.getInstance();

      expect(newManager.getAccessToken()).toBeNull();
      expect(sessionStorage.getItem("session-auth-tokens")).toBeNull();
    });
  });

  describe("Token Loading - Malformed Data", () => {
    it("should handle malformed JSON in localStorage", () => {
      localStorage.setItem("auth-tokens", "invalid-json{");

      expect(() => {
        const newManager = TokenManager.getInstance();
        newManager.getAccessToken();
      }).not.toThrow();

      // Should clear malformed data
      expect(localStorage.getItem("auth-tokens")).toBeNull();
    });

    it("should handle malformed JSON in sessionStorage", () => {
      sessionStorage.setItem("session-auth-tokens", "invalid-json{");

      expect(() => {
        const newManager = TokenManager.getInstance();
        newManager.getAccessToken();
      }).not.toThrow();

      expect(sessionStorage.getItem("session-auth-tokens")).toBeNull();
    });
  });

  describe("Storage Priority", () => {
    it("should prioritize localStorage over sessionStorage", () => {
      localStorage.setItem(
        "auth-tokens",
        JSON.stringify({
          accessToken: "local-token",
          expiresAt: Date.now() + 900000,
          rememberMe: true,
        })
      );

      sessionStorage.setItem(
        "session-auth-tokens",
        JSON.stringify({
          accessToken: "session-token",
          expiresAt: Date.now() + 900000,
          rememberMe: false,
        })
      );

      const newManager = TokenManager.getInstance();

      expect(newManager.getAccessToken()).toBe("local-token");
    });
  });
});
