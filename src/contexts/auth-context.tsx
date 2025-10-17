"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ResponderProfile, LoginRequest } from "@/types/auth";
import * as authApi from "@/api/auth";
import { tokenManager } from "@/lib/token-manager";
import { toast } from "sonner";

interface AuthContextType {
  responder: ResponderProfile | null;
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
  const [responder, setResponder] = useState<ResponderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenManager.getAccessToken();
        if (token) {
          const isValid = await authApi.verifyToken();
          if (isValid) {
            const profile = await authApi.getCurrentResponder();
            setResponder(profile);
          } else {
            tokenManager.clearTokens();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
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

      // Store tokens (using 1 hour expiry as default, adjust as needed)
      const expiresIn = 3600; // 1 hour in seconds
      tokenManager.setTokens(
        response.access_token,
        expiresIn,
        false, // rememberMe - set to true if you want persistent login
        response.responder.id ? parseInt(response.responder.id) : undefined
      );

      // Set responder profile
      setResponder(response.responder);

      toast.success(`Welcome back, ${response.responder.name}!`);

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
      await authApi.logout();

      // Clear tokens and state
      tokenManager.clearTokens();
      setResponder(null);

      toast.success("Logged out successfully");

      // Redirect to login
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    responder,
    isLoading,
    isAuthenticated: !!responder,
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
