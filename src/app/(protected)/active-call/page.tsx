"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  PhoneCallIcon,
  PhoneXIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  SpeakerHighIcon,
  SpeakerSimpleSlashIcon,
  WarningCircleIcon,
  HeartStraightIcon,
  MapPinIcon,
  ClockIcon,
  UserCircleIcon,
  BrainIcon,
  TranslateIcon,
  RecordIcon,
  CheckCircleIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useActiveCall } from "@/contexts/active-call-context";
import { useQueue } from "@/contexts/queue-context";
import { QueueAPI } from "@/services/queue-api";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// Mock call data for fallback
const mockCallData = {
  callerId: "+1 (555) 789-0123",
  callerName: "Unknown Caller",
  duration: "00:03:42",
  location: "Estimated: Downtown District, Grid A-4",
  status: "active",
  priority: "high",
};

// Mock AI insights (fallback)
const mockAiInsights = [
  {
    type: "medical",
    icon: HeartStraightIcon,
    title: "Medical Keywords Detected",
    details: ["collapsed", "not breathing", "not responding"],
    severity: "critical" as const,
  },
  {
    type: "emotion",
    icon: WarningCircleIcon,
    title: "Emotional State Analysis",
    details: ["High distress detected", "Panic indicators present"],
    severity: "high" as const,
  },
  {
    type: "location",
    icon: MapPinIcon,
    title: "Location Confirmed",
    details: ["123 Main Street, Apt 4B", "Coordinates: 40.7128°N, 74.0060°W"],
    severity: "info" as const,
  },
];

type AIInsight = (typeof mockAiInsights)[number];

function formatDuration(seconds: number | null): string {
  if (!seconds) return "00:00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ActiveCallPage() {
  const {
    callId,
    transcript,
    isLoading,
    error,
    callStatus,
    callDuration,
    isConnectedToWebSocket,
    isMuted,
    setIsMuted,
    isSpeakerOn,
    setIsSpeakerOn,
    isInCall,
    takeCall,
    isAudioConnected,
  } = useActiveCall();

  const { calls } = useQueue();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // State for WebSocket connection monitoring
  const [wsConnectionState, setWsConnectionState] = useState({
    isConnected: false,
    sessionId: null as string | null,
    error: null as string | null,
  });

  // State for connection events
  const [connectionEvents, setConnectionEvents] = useState<
    Array<{ type: string; data: unknown; timestamp: string }>
  >([]);

  // Find current call data from queue
  const currentCallData = useMemo(() => {
    return calls.find((call) => call.callId === callId);
  }, [calls, callId]);

  // Subscribe to WebSocket connection state
  useEffect(() => {
    const unsubscribe = QueueAPI.subscribeToConnectionState((state) => {
      setWsConnectionState({
        isConnected: state.isConnected,
        sessionId: state.sessionId || null,
        error: state.error || null,
      });
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to connection events
  useEffect(() => {
    const unsubscribe = QueueAPI.subscribeToConnectionEvents((event) => {
      setConnectionEvents((prev) => [event, ...prev].slice(0, 10)); // Keep last 10 events
    });

    return () => unsubscribe();
  }, []);

  // Generate AI insights from current call data
  const aiInsights = useMemo((): AIInsight[] => {
    if (!currentCallData) return mockAiInsights;

    const insights: AIInsight[] = [];

    // Priority/Urgency insight
    const priorityConfig = {
      high: { severity: "critical" as const, color: "red" },
      medium: { severity: "high" as const, color: "yellow" },
      low: { severity: "info" as const, color: "blue" },
    };

    const priorityInfo = priorityConfig[currentCallData.priority];
    insights.push({
      type: "priority",
      icon: WarningCircleIcon,
      title: `${currentCallData.priority.toUpperCase()} Priority Call`,
      details: [
        `Urgency Level: ${currentCallData.priority}`,
        `Emotional State: ${currentCallData.emotionalState}`,
        `Wait Time: ${Math.floor(currentCallData.waitTime / 60)} minutes`,
      ],
      severity: priorityInfo.severity,
    });

    // Medical keywords insight
    if (currentCallData.keywords && currentCallData.keywords.length > 0) {
      insights.push({
        type: "medical",
        icon: HeartStraightIcon,
        title: "Key Symptoms Detected",
        details: currentCallData.keywords,
        severity: currentCallData.priority === "high" ? ("critical" as const) : ("high" as const),
      });
    }

    // Emotional state insight
    const emotionalStateMap = {
      panic: { severity: "critical" as const, description: "Extreme distress detected" },
      distress: { severity: "high" as const, description: "High stress levels" },
      anxious: { severity: "high" as const, description: "Moderate anxiety present" },
      calm: { severity: "info" as const, description: "Caller is relatively calm" },
    };

    const emotionalInfo = emotionalStateMap[currentCallData.emotionalState];
    insights.push({
      type: "emotion",
      icon: currentCallData.emotionalState === "panic" ? WarningCircleIcon : InfoIcon,
      title: "Emotional State Analysis",
      details: [
        emotionalInfo.description,
        `AI Status: ${currentCallData.aiStatus}`,
        currentCallData.emotionalState === "panic" ? "Immediate attention required" : "",
      ].filter(Boolean),
      severity: emotionalInfo.severity,
    });

    // Location info if available
    if (currentCallData.callerName) {
      insights.push({
        type: "location",
        icon: MapPinIcon,
        title: "Caller Information",
        details: [
          `Name: ${currentCallData.callerName}`,
          `Phone: ${currentCallData.phoneNumber}`,
          `Call ID: ${currentCallData.callId}`,
        ],
        severity: "info" as const,
      });
    }

    return insights;
  }, [currentCallData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (transcriptEndRef.current && transcript.length > 0) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading call transcript...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <WarningCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" weight="duotone" />
          <p className="text-foreground font-medium mb-2">Failed to load call</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no callId
  if (!callId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <PhoneCallIcon
            className="h-12 w-12 text-muted-foreground mx-auto mb-4"
            weight="duotone"
          />
          <p className="text-foreground font-medium mb-2">No active call</p>
          <p className="text-muted-foreground text-sm">
            Select a call from the queue to view details
          </p>
        </div>
      </div>
    );
  }

  const displayDuration = callDuration ? formatDuration(callDuration) : mockCallData.duration;
  const displayStatus = callStatus || mockCallData.status;

  return (
    <div className="flex h-full flex-col">
      {/* Call Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center">
              {displayStatus === "active" && (
                <div className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75" />
              )}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
                <PhoneCallIcon className="h-6 w-6 text-white" weight="fill" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">
                {displayStatus === "active" ? "Active" : "Past"} Emergency Call
              </h1>
              <p className="text-sm text-muted-foreground">Call ID: {callId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Status Indicator */}
            {isInCall && (
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border",
                  isAudioConnected
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isAudioConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                  )}
                />
                <span>{isAudioConnected ? "Audio Connected" : "Connecting Audio..."}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ClockIcon className="h-4 w-4" weight="bold" />
              <span>{displayDuration}</span>
            </div>
            {/* Dynamic Priority Badge from WebSocket data */}
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border uppercase",
                currentCallData?.priority === "high"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : currentCallData?.priority === "medium"
                    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
              )}
            >
              {currentCallData?.priority || "HIGH"} PRIORITY
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={66} minSize={30}>
              {/* Left Column - Call Transcript */}
              <div className="flex h-full flex-col ">
                {/* Transcript Header */}
                <div className="border-b border-border bg-card px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RecordIcon className="h-5 w-5 text-red-500 animate-pulse" weight="fill" />
                      <span className="text-sm font-medium text-foreground">Live Transcript</span>
                      {isConnectedToWebSocket && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TranslateIcon className="h-4 w-4 text-muted-foreground" weight="duotone" />
                      <span className="text-xs text-muted-foreground">
                        Auto-translating from Spanish
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transcript Messages */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                  {transcript.length > 0 ? (
                    <>
                      {transcript.map((message) => (
                        <TranscriptMessage key={message.index} message={message} />
                      ))}
                      <div ref={transcriptEndRef} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No transcript available</p>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={34} minSize={20}>
              {/* Right Column - AI Insights */}
              <div className="flex h-full flex-col bg-muted/30">
                {/* AI Header */}
                <div className="border-b border-border bg-card px-6 py-3">
                  <div className="flex items-center gap-2">
                    <BrainIcon className="h-5 w-5 text-primary" weight="duotone" />
                    <span className="text-sm font-medium text-foreground">AI Insights</span>
                  </div>
                </div>

                {/* Insights List */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* WebSocket Connection Status */}
                  <div className="rounded-lg border border-border bg-card p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            wsConnectionState.isConnected
                              ? "bg-green-500 animate-pulse"
                              : "bg-red-500"
                          )}
                        />
                        <span className="text-xs text-muted-foreground">
                          {wsConnectionState.isConnected
                            ? "Real-time Updates Active"
                            : "Disconnected"}
                        </span>
                      </div>
                      {wsConnectionState.sessionId && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {wsConnectionState.sessionId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>

                  {aiInsights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                  ))}

                  {/* Caller Info Card - Real Data from WebSocket */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserCircleIcon className="h-5 w-5 text-primary" weight="duotone" />
                      <span className="text-sm font-medium text-foreground">
                        Caller Information
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="text-foreground font-medium">
                          {currentCallData?.callerName || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground font-medium font-mono text-xs">
                          {currentCallData?.phoneNumber || mockCallData.callerId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Status:</span>
                        <span
                          className={cn(
                            "text-foreground font-medium capitalize",
                            currentCallData?.aiStatus === "connected" && "text-green-500",
                            currentCallData?.aiStatus === "connecting" && "text-yellow-500",
                            currentCallData?.aiStatus === "pending" && "text-gray-500"
                          )}
                        >
                          {currentCallData?.aiStatus || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wait Time:</span>
                        <span className="text-foreground font-medium">
                          {currentCallData
                            ? `${Math.floor(currentCallData.waitTime / 60)}m ${currentCallData.waitTime % 60}s`
                            : "0m 0s"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connection Events Log (for debugging) */}
                  {connectionEvents.length > 0 && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircleIcon className="h-5 w-5 text-primary" weight="duotone" />
                        <span className="text-sm font-medium text-foreground">Recent Events</span>
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {connectionEvents.slice(0, 5).map((event, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-muted-foreground flex items-center gap-2 p-1"
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                event.type.includes("terminated") || event.type.includes("ended")
                                  ? "bg-red-500"
                                  : event.type.includes("connected") ||
                                      event.type.includes("subscribed")
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                              )}
                            />
                            <span className="font-mono">{event.type}</span>
                            <span className="text-muted-foreground/50">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Call Controls - Full Width Bottom Bar */}
        <div className="border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {isInCall ? (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    isMuted
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {isMuted ? (
                    <MicrophoneSlashIcon className="h-6 w-6" weight="fill" />
                  ) : (
                    <MicrophoneIcon className="h-6 w-6" weight="fill" />
                  )}
                </button>

                <button className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg">
                  <PhoneXIcon className="h-8 w-8" weight="fill" />
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                    isSpeakerOn
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {isSpeakerOn ? (
                    <SpeakerHighIcon className="h-6 w-6" weight="fill" />
                  ) : (
                    <SpeakerSimpleSlashIcon className="h-6 w-6" weight="fill" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={takeCall}
                disabled={isLoading}
                className={cn(
                  "group relative flex items-center justify-center gap-3 h-12 px-4 m-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white transition-all duration-150 font-bold text-md cursor-pointer",
                  isLoading ? "opacity-75" : "hover:from-green-600 hover:to-green-700"
                )}
              >
                <div className="absolute inset-0 rounded-xl bg-white opacity-0  transition-opacityduration-150" />
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white" />
                    <span className="relative">Taking Control...</span>
                  </>
                ) : (
                  <>
                    <PhoneCallIcon className="h-7 w-7" weight="fill" />
                    <span className="relative">Take Call</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TranscriptMessageType {
  index: number;
  timestamp: string | null;
  speaker: string;
  text: string;
  confidence: number | null;
}

function TranscriptMessage({ message }: { message: TranscriptMessageType }) {
  const isAI =
    message.speaker.toLowerCase().includes("agent") || message.speaker.toLowerCase().includes("ai");

  return (
    <div className={cn("flex gap-3", isAI ? "flex-row" : "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
          isAI ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}
      >
        {isAI ? (
          <BrainIcon className="h-5 w-5" weight="fill" />
        ) : (
          <UserCircleIcon className="h-5 w-5" weight="fill" />
        )}
      </div>

      <div className={cn("flex flex-col gap-1", isAI ? "items-start" : "items-end", "flex-1")}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {isAI ? "AI Agent" : message.speaker}
          </span>
          {message.timestamp && (
            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
          )}
          {message.confidence !== null && (
            <span className="text-xs text-muted-foreground">
              ({Math.round(message.confidence * 100)}%)
            </span>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg px-4 py-2 max-w-[80%]",
            isAI ? "bg-primary/10 text-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const severityColors = {
    critical: "border-red-500/20 bg-red-500/5",
    high: "border-yellow-500/20 bg-yellow-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
  };

  const severityIconColors = {
    critical: "text-red-500",
    high: "text-yellow-500",
    info: "text-blue-500",
  };

  const IconIcon = insight.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        severityColors[insight.severity as keyof typeof severityColors]
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <IconIcon
          className={cn(
            "h-5 w-5",
            severityIconColors[insight.severity as keyof typeof severityIconColors]
          )}
          weight="duotone"
        />
        <span className="text-sm font-medium text-foreground">{insight.title}</span>
      </div>
      <ul className="space-y-1">
        {insight.details.map((detail: string, index: number) => (
          <li key={index} className="text-xs text-muted-foreground pl-4">
            • {detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
