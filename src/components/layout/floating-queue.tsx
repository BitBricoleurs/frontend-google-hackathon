"use client";

import { Phone, CaretRightIcon, ClockIcon } from "@phosphor-icons/react";
import * as ResizablePrimitive from "react-resizable-panels";
import { QueuedCall } from "./queued-call";

export interface QueueCall {
  id: string;
  callerName: string;
  phoneNumber: string;
  waitTime: number; // in seconds
  aiStatus: "connected" | "connecting" | "pending";
  priority: "high" | "medium" | "low";
  keywords: string[];
  emotionalState: "calm" | "distress" | "panic" | "anxious";
}

interface FloatingQueueProps {
  calls?: QueueCall[];
  panelRef?: React.RefObject<ResizablePrimitive.ImperativePanelHandle | null>;
  onTakeCall?: (callId: string) => void;
}

export function FloatingQueue({
  calls = [],
  panelRef,
  onTakeCall,
}: FloatingQueueProps) {
  const handleCollapse = () => {
    if (panelRef?.current) {
      panelRef.current.collapse();
    }
  };

  const calculateAverageWaitTime = () => {
    if (calls.length === 0) return "0m 0s";

    const totalWaitTime = calls.reduce((sum, call) => sum + call.waitTime, 0);
    const averageSeconds = Math.floor(totalWaitTime / calls.length);
    const minutes = Math.floor(averageSeconds / 60);
    const seconds = averageSeconds % 60;

    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between mb-1">
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
              <CaretRightIcon
                weight="bold"
                className="h-4 w-4 text-foreground"
              />
            </button>
          </div>
        </div>
        {calls.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ClockIcon weight="regular" className="h-3.5 w-3.5" />
            <span>Avg. wait time: {calculateAverageWaitTime()}</span>
          </div>
        )}
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
              <QueuedCall
                key={call.id}
                id={call.id}
                fullName={call.callerName}
                phoneNumber={call.phoneNumber}
                priority={call.priority}
                waitTime={call.waitTime}
                keywords={call.keywords}
                emotionalState={call.emotionalState}
                aiStatus={call.aiStatus}
                onTakeCall={onTakeCall}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
