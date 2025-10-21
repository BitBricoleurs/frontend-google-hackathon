"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  IdentificationCardIcon,
  XCircleIcon,
  CircleNotchIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@phosphor-icons/react";

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!employeeId.trim() || !password.trim()) {
      setError("Please enter both employee ID and password");
      return;
    }

    try {
      await login({ employeeId: employeeId.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-card p-8 shadow-lg border border-border">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary">
                <IdentificationCardIcon className="h-8 w-8 text-primary-foreground" weight="fill" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-card-foreground">Emergency Response</h1>
            <p className="mt-2 text-sm text-muted-foreground">AI-Assisted 911/15 Response System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-destructive" weight="fill" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="employeeId"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Employee ID
              </label>
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g., EMP001"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" weight="bold" />
                  ) : (
                    <EyeIcon className="h-5 w-5" weight="bold" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <CircleNotchIcon className="h-5 w-5 animate-spin" weight="bold" />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Test Credentials Info (Remove in production) */}
          <div className="mt-6 rounded-lg bg-muted border border-border p-4">
            <p className="text-xs font-semibold text-foreground mb-2">Test Credentials:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="italic">Use employee IDs from your backend database</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Authorized personnel only. All activities are monitored.
        </p>
      </div>
    </div>
  );
}
