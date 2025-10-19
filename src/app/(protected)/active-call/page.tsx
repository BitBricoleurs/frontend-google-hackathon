"use client";

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
  PlusCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useChat } from "@/contexts/chat-context";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import type { ChatMessage, AIInsight } from "@/types/chat";

export default function ActiveCallPage() {
  return <ActiveCallContent />;
}

function ActiveCallContent() {
  const {
    activeCall,
    isMuted,
    isSpeakerOn,
    toggleMute,
    toggleSpeaker,
    addMessage,
    endCall,
    selectCall,
  } = useChat();

  const scrollRef = useAutoScroll<HTMLDivElement>([activeCall?.transcript]);

  // Demo function to test adding messages
  const addDemoMessage = () => {
    const demoMessages = [
      { text: "I'm feeling better now, thank you!", speaker: "caller" as const, emotion: "calm" as const },
      { text: "That's great to hear. Emergency services should arrive soon.", speaker: "ai-agent" as const, emotion: "calm" as const },
      { text: "Can you stay with him until they arrive?", speaker: "ai-agent" as const, emotion: "calm" as const },
      { text: "Yes, I will stay right here!", speaker: "caller" as const, emotion: "neutral" as const },
    ];

    const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
    addMessage(randomMessage.text, randomMessage.speaker, randomMessage.emotion);
  };

  // If no active call, show call selection interface
  if (!activeCall) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <PhoneCallIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" weight="duotone" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Active Call</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Select a call from the waiting queue to begin
          </p>
          <button
            onClick={() => selectCall("call-002")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Load Demo Call (Fire Emergency)
          </button>
        </div>
      </div>
    );
  }

  const messages = activeCall.transcript;
  const insights = activeCall.aiInsights;

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
              <h1 className="text-xl font-semibold text-card-foreground">
                Active Emergency Call
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeCall.caller.name} • {activeCall.caller.phoneNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ClockIcon className="h-4 w-4" weight="bold" />
              <span>{activeCall.duration}</span>
            </div>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border",
              activeCall.priority === "critical" && "bg-red-500/10 text-red-500 border-red-500/20",
              activeCall.priority === "high" && "bg-orange-500/10 text-orange-500 border-orange-500/20",
              activeCall.priority === "medium" && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
              activeCall.priority === "low" && "bg-blue-500/10 text-blue-500 border-blue-500/20"
            )}>
              {activeCall.priority.toUpperCase()} PRIORITY
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
                    <RecordIcon
                      className="h-5 w-5 text-red-500 animate-pulse"
                      weight="fill"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Live Transcript
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({messages.length} messages)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={addDemoMessage}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                      title="Add demo message (for testing)"
                    >
                      <PlusCircleIcon className="h-4 w-4" weight="fill" />
                      Add Message
                    </button>
                    <div className="flex items-center gap-2">
                      <TranslateIcon
                        className="h-4 w-4 text-muted-foreground"
                        weight="duotone"
                      />
                      <span className="text-xs text-muted-foreground">
                        Auto-translating from Spanish
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript Messages */}
              <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-4">
                {messages.map((message) => (
                  <TranscriptMessage key={message.id} message={message} />
                ))}
              </div>

              {/* Call Controls */}
              <div className="border-t border-border bg-card px-6 py-4">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={toggleMute}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                      isMuted
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <MicrophoneSlashIcon className="h-6 w-6" weight="fill" />
                    ) : (
                      <MicrophoneIcon className="h-6 w-6" weight="fill" />
                    )}
                  </button>

                  <button
                    onClick={endCall}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                    title="End Call"
                  >
                    <PhoneXIcon className="h-8 w-8" weight="fill" />
                  </button>

                  <button
                    onClick={toggleSpeaker}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                      isSpeakerOn
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                    title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
                  >
                    {isSpeakerOn ? (
                      <SpeakerHighIcon className="h-6 w-6" weight="fill" />
                    ) : (
                      <SpeakerSimpleSlashIcon
                        className="h-6 w-6"
                        weight="fill"
                      />
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
                  <BrainIcon
                    className="h-5 w-5 text-primary"
                    weight="duotone"
                  />
                  <span className="text-sm font-medium text-foreground">
                    AI Insights
                  </span>
                </div>
              </div>

              {/* Insights List */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}

                {/* Caller Info Card */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCircleIcon
                      className="h-5 w-5 text-primary"
                      weight="duotone"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Caller Information
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="text-foreground font-medium">
                        {activeCall.caller.phoneNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-foreground font-medium">
                        {activeCall.caller.location || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Previous Calls:
                      </span>
                      <span className="text-foreground font-medium">
                        {activeCall.caller.previousCalls}
                      </span>
                    </div>
                    {activeCall.caller.language && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Language:</span>
                        <span className="text-foreground font-medium">
                          {activeCall.caller.language}
                        </span>
                      </div>
                    )}
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

function TranscriptMessage({
  message,
}: {
  message: ChatMessage;
}) {
  const isAI = message.speaker === "ai-agent";

  const emotionColors = {
    calm: "text-green-500",
    distress: "text-yellow-500",
    panic: "text-red-500",
    neutral: "text-blue-500",
  };

  return (
    <div className={cn("flex gap-3", isAI ? "flex-row" : "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
          isAI
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isAI ? (
          <BrainIcon className="h-5 w-5" weight="fill" />
        ) : (
          <UserCircleIcon className="h-5 w-5" weight="fill" />
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-1",
          isAI ? "items-start" : "items-end",
          "flex-1"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {isAI ? "Gaia" : "Caller"}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp}
          </span>
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
            isAI
              ? "bg-primary/10 text-foreground"
              : "bg-secondary text-secondary-foreground"
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

  // Map insight types to icons
  const insightIcons = {
    medical: HeartStraightIcon,
    emotion: WarningCircleIcon,
    location: MapPinIcon,
    general: BrainIcon,
  };

  const IconComponent = insightIcons[insight.type];

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        severityColors[insight.severity]
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <IconComponent
          className={cn(
            "h-5 w-5",
            severityIconColors[insight.severity]
          )}
          weight="duotone"
        />
        <span className="text-sm font-medium text-foreground">
          {insight.title}
        </span>
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
