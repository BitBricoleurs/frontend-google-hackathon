"use client";

import { useRef, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { FloatingQueue } from "@/components/layout/floating-queue";
import { QueueProvider, useQueue } from "@/contexts/queue-context";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ImperativePanelHandle,
} from "@/components/ui/resizable";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { QueryProvider } from "@/contexts/query-context";

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { calls } = useQueue();
  const queuePanelRef = useRef<ImperativePanelHandle>(null);
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);

  const handleExpand = () => {
    if (queuePanelRef.current) {
      queuePanelRef.current.expand();
    }
  };

  const handleTakeCall = (callId: string) => {
    console.log("Taking call:", callId);
    // TODO: Implement navigation to active call page or handle taking the call
    // For example: router.push(`/active-call?callId=${callId}`)
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Fixed Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-hidden bg-background relative">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={75} minSize={40}>
              <div className="h-full overflow-y-auto">{children}</div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              ref={queuePanelRef}
              defaultSize={25}
              minSize={15}
              maxSize={40}
              collapsible
              onCollapse={() => setIsQueueCollapsed(true)}
              onExpand={() => setIsQueueCollapsed(false)}
            >
              <FloatingQueue
                calls={calls}
                panelRef={queuePanelRef}
                onTakeCall={handleTakeCall}
              />
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Expand Button - shown when queue is collapsed */}
          {isQueueCollapsed && (
            <button
              onClick={handleExpand}
              className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              aria-label="Expand queue"
            >
              <CaretLeftIcon weight="bold" className="h-5 w-5" />
            </button>
          )}
        </main>
      </div>
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
      <QueryProvider>
        <QueueProvider>
          <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
        </QueueProvider>
      </QueryProvider>
    </ProtectedRoute>
  );
}
