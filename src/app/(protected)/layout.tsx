"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Fixed Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
