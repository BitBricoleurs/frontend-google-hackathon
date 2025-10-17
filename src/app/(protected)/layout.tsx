"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { FloatingQueue } from "@/components/layout/floating-queue";
import { QueueProvider, useQueue } from "@/contexts/queue-context";

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { calls } = useQueue();

  return (
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

      {/* Floating Queue - visible on all pages */}
      <FloatingQueue calls={calls} />
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <QueueProvider>
        <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
      </QueueProvider>
    </ProtectedRoute>
  );
}
