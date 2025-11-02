"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User, LoginRequest } from "@/types/auth";
import * as authApi from "@/api/auth";
import { tokenManager } from "@/lib/token-manager";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenManager.getAccessToken();
        if (token) {
          // Try to get user profile - this validates the token
          const userProfile = await authApi.getCurrentUser();
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Token is invalid or expired, clear it
        tokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);

      // Store access token with expiry from backend (15 minutes = 900 seconds)
      // Refresh token is automatically stored as httpOnly cookie by backend
      tokenManager.setTokens(
        response.accessToken,
        response.expiresIn,
        false, // rememberMe - can be enhanced with a checkbox in login form
        undefined // userId - we'll get this from /auth/me
      );

      // Fetch user profile after successful login
      const userProfile = await authApi.getCurrentUser();
      setUser(userProfile);

      toast.success(`Welcome back, ${userProfile.fullName}!`);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Call backend logout to revoke refresh token
      await authApi.logout();

      // Clear tokens and state
      tokenManager.clearTokens();
      setUser(null);

      toast.success("Logged out successfully");

      // Redirect to login
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout API fails, clear local state
      tokenManager.clearTokens();
      setUser(null);
      toast.error("Logout failed, but local session cleared");
      router.push("/auth/login");
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
