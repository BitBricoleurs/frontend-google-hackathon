"use client";

import { Phone, Robot, Clock, CaretRightIcon } from "@phosphor-icons/react";
import * as ResizablePrimitive from "react-resizable-panels";

export interface QueueCall {
  id: string;
  callerName: string;
  phoneNumber: string;
  waitTime: number; // in seconds
  aiStatus: "connected" | "connecting" | "pending";
  priority?: "high" | "medium" | "low";
}

interface FloatingQueueProps {
  calls?: QueueCall[];
  panelRef?: React.RefObject<ResizablePrimitive.ImperativePanelHandle | null>;
}

export function FloatingQueue({ calls = [], panelRef }: FloatingQueueProps) {
  const handleCollapse = () => {
    if (panelRef?.current) {
      panelRef.current.collapse();
    }
  };
  const formatWaitTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      case "low":
        return "border-green-500 bg-green-500/10";
      default:
        return "border-border bg-card";
    }
  };

  const getAiStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <Robot weight="fill" className="h-4 w-4" />
            <span>Gaia Connected</span>
          </div>
        );
      case "connecting":
        return (
          <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
            <Robot weight="duotone" className="h-4 w-4 animate-pulse" />
            <span>Connecting...</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock weight="duotone" className="h-4 w-4" />
            <span>In Queue</span>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Phone weight="duotone" className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-sm text-foreground">
            Waiting Queue
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1">
            <span className="text-xs font-bold text-primary-foreground">
              {calls.length}
            </span>
          </div>
          <button
            onClick={handleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent transition-colors"
            aria-label="Collapse queue"
          >
            <CaretRightIcon weight="bold" className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Phone
              weight="duotone"
              className="h-12 w-12 text-muted-foreground/50 mb-3"
            />
            <p className="text-sm text-muted-foreground">No calls in queue</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {calls.map((call) => (
              <div
                key={call.id}
                className={`rounded-lg border p-3 transition-all hover:shadow-md ${getPriorityColor(
                  call.priority
                )}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {call.callerName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {call.phoneNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-foreground ml-2">
                    <Clock weight="duotone" className="h-3.5 w-3.5" />
                    <span>{formatWaitTime(call.waitTime)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {getAiStatusIcon(call.aiStatus)}
                  {call.priority && (
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {call.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
