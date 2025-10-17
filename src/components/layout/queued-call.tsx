"use client";

import { useState } from "react";
import {
  RobotIcon,
  ClockIcon,
  PhoneIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface QueuedCallProps {
  id: string;
  fullName: string;
  phoneNumber: string;
  priority: "high" | "medium" | "low";
  waitTime: number; // in seconds
  keywords: string[];
  emotionalState: "calm" | "distress" | "panic" | "anxious";
  aiStatus: "connected" | "connecting" | "pending";
  onTakeCall?: (callId: string) => void;
}

export function QueuedCall({
  id,
  fullName,
  phoneNumber,
  priority,
  waitTime,
  keywords,
  emotionalState,
  aiStatus,
  onTakeCall,
}: QueuedCallProps) {
  const [isHovered, setIsHovered] = useState(false);
  const formatWaitTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-orange-500",
          text: "text-white",
          label: "High",
        };
      case "medium":
        return {
          bg: "bg-yellow-500",
          text: "text-white",
          label: "Medium",
        };
      case "low":
        return {
          bg: "bg-green-500",
          text: "text-white",
          label: "Low",
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-foreground",
          label: "Unknown",
        };
    }
  };

  const getEmotionalStateConfig = (state: string) => {
    switch (state) {
      case "panic":
        return {
          icon: WarningCircleIcon,
          color: "text-orange-500",
          label: "Panicked",
        };
      case "distress":
        return {
          icon: WarningCircleIcon,
          color: "text-orange-500",
          label: "Distressed",
        };
      case "anxious":
        return {
          icon: WarningCircleIcon,
          color: "text-yellow-500",
          label: "Anxious",
        };
      case "calm":
        return {
          icon: WarningCircleIcon,
          color: "text-green-500",
          label: "Calm",
        };
      default:
        return {
          icon: WarningCircleIcon,
          color: "text-muted-foreground",
          label: "Unknown",
        };
    }
  };

  const getAiStatusLabel = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting";
      case "pending":
        return "Collecting Info";
      default:
        return "Unknown";
    }
  };

  const getAiStatusPercentage = (status: string, waitTime: number) => {
    // Mock percentage based on status and wait time
    switch (status) {
      case "connected":
        return 100;
      case "connecting":
        return Math.floor(Math.min(75, (waitTime / 120) * 100));
      case "pending":
        return Math.floor(Math.min(65, (waitTime / 180) * 100));
      default:
        return 0;
    }
  };

  const priorityConfig = getPriorityConfig(priority);
  const emotionConfig = getEmotionalStateConfig(emotionalState);
  const EmotionIcon = emotionConfig.icon;
  const aiStatusLabel = getAiStatusLabel(aiStatus);
  const aiStatusPercentage = getAiStatusPercentage(aiStatus, waitTime);

  const handleTakeCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTakeCall?.(id);
  };

  // Get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="relative rounded-xl border border-border bg-card p-4 transition-all hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header: Avatar, Name, Priority Badge, Time */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-base">
          {getInitials(fullName)}
        </div>

        {/* Name and Priority */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground truncate mb-1">
            {fullName}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                priorityConfig.bg,
                priorityConfig.text
              )}
            >
              {priorityConfig.label}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon weight="regular" className="h-3.5 w-3.5" />
              <span>{formatWaitTime(waitTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Status with Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-sm text-accent">
            <RobotIcon weight="fill" className="h-4 w-4" />
            <span className="font-medium">{aiStatusLabel}</span>
          </div>
          <span className="text-sm font-semibold text-accent">
            {aiStatusPercentage}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${aiStatusPercentage}%` }}
          />
        </div>
      </div>

      {/* Keywords Detected */}
      <div className="mb-3">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">
          Keywords Detected
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {keywords.slice(0, 4).map((keyword, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-3 py-1 text-xs text-red-700 dark:text-red-300"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom: Emotional State and Take Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <EmotionIcon
            weight="fill"
            className={cn("h-4 w-4", emotionConfig.color)}
          />
          <span className={cn("text-sm font-medium", emotionConfig.color)}>
            {emotionConfig.label}
          </span>
        </div>

        {onTakeCall && (
          <button
            onClick={handleTakeCall}
            className={cn(
              "flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-all hover:scale-105",
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <PhoneIcon weight="fill" className="h-4 w-4" />
            Take
          </button>
        )}
      </div>
    </div>
  );
}
