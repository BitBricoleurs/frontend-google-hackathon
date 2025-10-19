"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "responder" | "supervisor" | "admin";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { responder, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-sm text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, return null (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  const hasRequiredRole = !requiredRole || responder?.role === requiredRole;

  // Allow supervisor to access admin routes if needed (optional)
  const supervisorCanAccessAdmin = requiredRole === "admin" && responder?.role === "supervisor";

  if (!hasRequiredRole && !supervisorCanAccessAdmin) {
    // Show unauthorized message inline
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Your role: <span className="font-medium text-gray-700">{responder?.role}</span>
            {requiredRole && (
              <>
                {" • "}Required role: <span className="font-medium text-gray-700">{requiredRole}</span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => router.back()}
              className="block w-full rounded-lg bg-gray-100 px-4 py-3 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
