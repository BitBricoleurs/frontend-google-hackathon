"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Call, ChatMessage, MessageSpeaker, MessageEmotion, AIInsight } from "@/types/chat";
import { mockCalls } from "@/data/mock-calls";

interface ChatContextType {
  // Active call state
  activeCall: Call | null;

  // Call controls
  isMuted: boolean;
  isSpeakerOn: boolean;

  // Call management
  selectCall: (callId: string) => void;
  endCall: () => void;

  // Message management
  addMessage: (text: string, speaker: MessageSpeaker, emotion?: MessageEmotion) => void;
  clearMessages: () => void;

  // AI Insights management
  addInsight: (insight: Omit<AIInsight, "id" | "detectedAt">) => void;

  // Audio controls
  toggleMute: () => void;
  toggleSpeaker: () => void;
  setMuted: (muted: boolean) => void;
  setSpeaker: (on: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  // Get the first active call from mock data as initial state
  const initialCall = mockCalls.find((call) => call.status === "active") || null;

  const [activeCall, setActiveCall] = useState<Call | null>(initialCall);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const messageIdCounter = useRef(1000);
  const insightIdCounter = useRef(1000);

  /**
   * Select and load a call from the waiting queue
   * @param callId - The ID of the call to load
   */
  const selectCall = useCallback((callId: string) => {
    const call = mockCalls.find((c) => c.id === callId);
    if (call) {
      // Update the call status to active
      const updatedCall = { ...call, status: "active" as const };
      setActiveCall(updatedCall);

      // Reset audio controls for new call
      setIsMuted(false);
      setIsSpeakerOn(true);

      console.log("📞 Call selected:", updatedCall);
    } else {
      console.error("❌ Call not found:", callId);
    }
  }, []);

  /**
   * End the current active call
   */
  const endCall = useCallback(() => {
    if (activeCall) {
      console.log("📵 Ending call:", activeCall.id);
      setActiveCall(null);
      setIsMuted(false);
      setIsSpeakerOn(true);
    }
  }, [activeCall]);

  /**
   * Add a new message to the active call's transcript
   * This function should be called when receiving transcript data from the backend
   *
   * @param text - The message text content
   * @param speaker - Who is speaking: "caller", "ai-agent", or "operator"
   * @param emotion - Optional emotion detection: "calm", "distress", "panic", or "neutral"
   */
  const addMessage = useCallback(
    (text: string, speaker: MessageSpeaker, emotion: MessageEmotion = "neutral") => {
      if (!text.trim() || !activeCall) return;

      const now = new Date();

      // Calculate timestamp based on call start time
      const elapsed = now.getTime() - activeCall.startTime.getTime();
      const totalSeconds = Math.floor(elapsed / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const timestamp = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      const newMessage: ChatMessage = {
        id: `msg-${messageIdCounter.current++}`,
        speaker,
        text: text.trim(),
        timestamp,
        emotion,
        createdAt: now,
      };

      setActiveCall((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          transcript: [...prev.transcript, newMessage],
        };
      });

      console.log("💬 Message added:", newMessage);
    },
    [activeCall]
  );

  /**
   * Add a new AI insight to the active call
   * @param insight - The insight to add (without id and detectedAt which are auto-generated)
   */
  const addInsight = useCallback(
    (insight: Omit<AIInsight, "id" | "detectedAt">) => {
      if (!activeCall) return;

      const newInsight: AIInsight = {
        ...insight,
        id: `insight-${insightIdCounter.current++}`,
        detectedAt: new Date(),
      };

      setActiveCall((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          aiInsights: [...prev.aiInsights, newInsight],
        };
      });

      console.log("🧠 AI Insight added:", newInsight);
    },
    [activeCall]
  );

  /**
   * Clear all messages from the active call's transcript
   */
  const clearMessages = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        transcript: [],
      };
    });
    messageIdCounter.current = 1000;
  }, []);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newState = !prev;
      console.log(`🎤 Microphone ${newState ? "MUTED" : "UNMUTED"}`);
      return newState;
    });
  }, []);

  /**
   * Toggle speaker state
   */
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const newState = !prev;
      console.log(`🔊 Speaker ${newState ? "ON" : "OFF"}`);
      return newState;
    });
  }, []);

  /**
   * Set mute state directly
   */
  const setMutedState = useCallback((muted: boolean) => {
    setIsMuted(muted);
    console.log(`🎤 Microphone ${muted ? "MUTED" : "UNMUTED"}`);
  }, []);

  /**
   * Set speaker state directly
   */
  const setSpeakerState = useCallback((on: boolean) => {
    setIsSpeakerOn(on);
    console.log(`🔊 Speaker ${on ? "ON" : "OFF"}`);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        activeCall,
        isMuted,
        isSpeakerOn,
        selectCall,
        endCall,
        addMessage,
        clearMessages,
        addInsight,
        toggleMute,
        toggleSpeaker,
        setMuted: setMutedState,
        setSpeaker: setSpeakerState,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Hook to access the chat context
 * @returns Chat context with active call, controls, and management functions
 * @throws Error if used outside of ChatProvider
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
