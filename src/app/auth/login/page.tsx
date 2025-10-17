"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSearchParams } from "next/navigation";
import {
  IdentificationCardIcon,
  XCircleIcon,
  CircleNotchIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function LoginPage() {
  const [responderId, setResponderId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!responderId.trim() || !password.trim()) {
      setError("Please enter both responder ID and password");
      return;
    }

    try {
      await login({ responderId: responderId.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                <IdentificationCardIcon
                  className="h-8 w-8 text-white"
                  weight="fill"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Emergency Response
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              AI-Assisted 911/15 Response System
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-red-600" weight="fill" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="responderId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Responder ID
              </label>
              <input
                id="responderId"
                type="text"
                value={responderId}
                onChange={(e) => setResponderId(e.target.value)}
                placeholder="e.g., RESP001"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <CircleNotchIcon
                    className="h-5 w-5 animate-spin"
                    weight="bold"
                  />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Mock Credentials Info (Remove in production) */}
          <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Mock Test Credentials:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>
                <span className="font-medium">Responder:</span> RESP001 /
                password123
              </p>
              <p>
                <span className="font-medium">Supervisor:</span> RESP002 /
                password123
              </p>
              <p>
                <span className="font-medium">Admin:</span> ADMIN001 / admin123
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          Authorized personnel only. All activities are monitored.
        </p>
      </div>
    </div>
  );
}
