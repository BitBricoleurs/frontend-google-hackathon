"use client";

import { useState } from "react";
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
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// Mock call data
const mockCallData = {
  callerId: "+1 (555) 789-0123",
  callerName: "Unknown Caller",
  duration: "00:03:42",
  location: "Estimated: Downtown District, Grid A-4",
  status: "active",
  priority: "high",
};

// Mock transcript
const mockTranscript = [
  {
    id: 1,
    speaker: "caller",
    text: "Hello? I need help! My father collapsed!",
    timestamp: "00:00:12",
    emotion: "distress",
  },
  {
    id: 2,
    speaker: "ai-agent",
    text: "I understand you need emergency assistance. Can you tell me your exact location?",
    timestamp: "00:00:18",
    emotion: "calm",
  },
  {
    id: 3,
    speaker: "caller",
    text: "We're at 123 Main Street, apartment 4B. He's not breathing!",
    timestamp: "00:00:24",
    emotion: "panic",
  },
  {
    id: 4,
    speaker: "ai-agent",
    text: "Emergency services have been dispatched to 123 Main Street, apartment 4B. Help is on the way. Is your father conscious?",
    timestamp: "00:00:32",
    emotion: "calm",
  },
  {
    id: 5,
    speaker: "caller",
    text: "No, he's not responding! What should I do?",
    timestamp: "00:00:38",
    emotion: "distress",
  },
];

// Mock AI insights
const aiInsights = [
  {
    type: "medical",
    icon: HeartStraightIcon,
    title: "Medical Keywords Detected",
    details: ["collapsed", "not breathing", "not responding"],
    severity: "critical",
  },
  {
    type: "emotion",
    icon: WarningCircleIcon,
    title: "Emotional State Analysis",
    details: ["High distress detected", "Panic indicators present"],
    severity: "high",
  },
  {
    type: "location",
    icon: MapPinIcon,
    title: "Location Confirmed",
    details: ["123 Main Street, Apt 4B", "Coordinates: 40.7128°N, 74.0060°W"],
    severity: "info",
  },
];

export default function ActiveCallPage() {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  return (
    <div className="flex h-full flex-col">
      {/* Call Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-500">
                <PhoneCallIcon className="h-6 w-6 text-white" weight="fill" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">Active Emergency Call</h1>
              <p className="text-sm text-muted-foreground">
                {mockCallData.callerName} • {mockCallData.callerId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ClockIcon className="h-4 w-4" weight="bold" />
              <span>{mockCallData.duration}</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
              HIGH PRIORITY
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                {mockTranscript.map((message) => (
                  <TranscriptMessage key={message.id} message={message} />
                ))}
              </div>

              {/* Call Controls */}
              <div className="border-t border-border bg-card px-6 py-4">
                <div className="flex items-center justify-center gap-4">
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
                </div>
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
                {aiInsights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} />
                ))}

                {/* Caller Info Card */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCircleIcon className="h-5 w-5 text-primary" weight="duotone" />
                    <span className="text-sm font-medium text-foreground">Caller Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="text-foreground font-medium">{mockCallData.callerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground font-medium">Downtown</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Previous Calls:</span>
                      <span className="text-foreground font-medium">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

function TranscriptMessage({ message }: { message: (typeof mockTranscript)[0] }) {
  const isAI = message.speaker === "ai-agent";

  const emotionColors = {
    calm: "text-green-500",
    distress: "text-yellow-500",
    panic: "text-red-500",
  };

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
          <span className="text-xs font-medium text-foreground">{isAI ? "Gaia" : "Caller"}</span>
          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
          {!isAI && (
            <span
              className={cn(
                "text-xs font-medium",
                emotionColors[message.emotion as keyof typeof emotionColors]
              )}
            >
              {message.emotion}
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

function InsightCard({ insight }: { insight: (typeof aiInsights)[0] }) {
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
        {insight.details.map((detail, index) => (
          <li key={index} className="text-xs text-muted-foreground pl-4">
            • {detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
