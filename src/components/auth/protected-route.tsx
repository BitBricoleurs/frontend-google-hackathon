"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { ShieldCheckIcon } from "@phosphor-icons/react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "OPERATOR" | "ADMIN"; // Keep "admin" for backward compatibility
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
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
  // Map old "admin" role to new "ADMIN" for backward compatibility
  const hasRequiredRole = !requiredRole || user?.role === requiredRole;
  if (!hasRequiredRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <ShieldCheckIcon
                className="h-10 w-10 text-red-500"
                weight="duotone"
              />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-2">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Your role:{" "}
            <span className="font-medium text-gray-700">{user?.role}</span>
            {requiredRole && (
              <>
                {" • "}Required role:{" "}
                <span className="font-medium text-gray-700">
                  {requiredRole}
                </span>
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
