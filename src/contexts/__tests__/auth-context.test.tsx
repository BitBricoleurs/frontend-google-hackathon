/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth-context";
import * as authApi from "@/api/auth";
import { tokenManager } from "@/lib/token-manager";
import { toast } from "sonner";
import type { User } from "@/types/auth";

// Mock dependencies
jest.mock("@/api/auth");
jest.mock("@/lib/token-manager");
jest.mock("sonner");
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockTokenManager = tokenManager as jest.Mocked<typeof tokenManager>;
const mockToast = toast as jest.Mocked<typeof toast>;

const mockUser: User = {
  id: "user-123",
  fullName: "John Doe",
  email: "john@example.com",
  role: "OPERATOR",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

// Test component to access auth context
function TestComponent() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="loading">{auth.isLoading ? "Loading" : "Not Loading"}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? "Yes" : "No"}</div>
      <div data-testid="user">{auth.user ? auth.user.fullName : "No User"}</div>
      <button onClick={() => auth.login({ email: "test@example.com", password: "password" })}>
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenManager.getAccessToken.mockReturnValue(null);
    mockTokenManager.setTokens.mockImplementation(() => {});
    mockTokenManager.clearTokens.mockImplementation(() => {});
  });

  describe("AuthProvider initialization", () => {
    it("should initialize with no user when no token exists", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent("No");
      expect(screen.getByTestId("user")).toHaveTextContent("No User");
    });

    it("should initialize with user when valid token exists", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent("Yes");
      expect(screen.getByTestId("user")).toHaveTextContent("John Doe");
    });

    it("should clear tokens when token is invalid", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("invalid-token");
      mockAuthApi.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent("No");
    });
  });

  describe("login", () => {
    it("should successfully login user", async () => {
      mockAuthApi.login.mockResolvedValue({
        accessToken: "new-token",
        expiresIn: 900,
      });
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });

      await act(async () => {
        getByText("Login").click();
      });

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password",
        });
      });

      expect(mockTokenManager.setTokens).toHaveBeenCalledWith("new-token", 900, false, undefined);
      expect(mockAuthApi.getCurrentUser).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith("Welcome back, John Doe!");
    });

    it("should handle login errors", async () => {
      mockAuthApi.login.mockRejectedValue(new Error("Invalid credentials"));

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });

      await act(async () => {
        getByText("Login").click();
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Invalid credentials");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent("No");
    });

    it("should set loading state during login", async () => {
      mockAuthApi.login.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ accessToken: "token", expiresIn: 900 }), 100)
          )
      );
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });

      act(() => {
        getByText("Login").click();
      });

      // Should show loading during login
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
      });

      // Should stop loading after login
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });
    });

    it("should handle non-Error login failures", async () => {
      mockAuthApi.login.mockRejectedValue("String error");

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });

      await act(async () => {
        getByText("Login").click();
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Login failed");
      });
    });
  });

  describe("logout", () => {
    it("should successfully logout user", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthApi.logout.mockResolvedValue();

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("John Doe");
      });

      await act(async () => {
        getByText("Logout").click();
      });

      await waitFor(() => {
        expect(mockAuthApi.logout).toHaveBeenCalled();
      });

      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith("Logged out successfully");
      expect(screen.getByTestId("authenticated")).toHaveTextContent("No");
    });

    it("should clear local state even if logout API fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthApi.logout.mockRejectedValue(new Error("Logout failed"));

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("John Doe");
      });

      await act(async () => {
        getByText("Logout").click();
      });

      await waitFor(() => {
        expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      });

      expect(mockToast.error).toHaveBeenCalledWith("Logout failed, but local session cleared");
      expect(screen.getByTestId("authenticated")).toHaveTextContent("No");
    });

    it("should set loading state during logout", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthApi.logout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("John Doe");
      });

      act(() => {
        getByText("Logout").click();
      });

      // Should show loading during logout
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
      });

      // Should stop loading after logout
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });
    });
  });

  describe("useAuth hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });

    it("should return auth context values", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent("Yes");
      expect(screen.getByTestId("user")).toHaveTextContent("John Doe");
    });
  });

  describe("isAuthenticated property", () => {
    it("should be false when user is null", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("No");
      });
    });

    it("should be true when user exists", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-token");
      mockAuthApi.getCurrentUser.mockResolvedValue(mockUser);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("Yes");
      });
    });
  });
});
