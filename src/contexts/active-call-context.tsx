"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import * as transcriptApi from "@/api/transcript";
import * as handoffApi from "@/api/handoff";
import { toast } from "sonner";
import { QueueAPI } from "@/services/queue-api";
import { useAuth } from "./auth-context";

interface TranscriptMessage {
  index: number;
  timestamp: string | null;
  speaker: string;
  text: string;
  confidence: number | null;
}

interface ActiveCallContextType {
  callId: string | null;
  transcript: TranscriptMessage[];
  isLoading: boolean;
  error: string | null;
  callStatus: string | null;
  callDuration: number | null;
  startedAt: string | null;
  endedAt: string | null;
  patientInfo: object | null;
  fetchTranscript: (callId: string) => Promise<void>;
  clearCall: () => void;
  isConnectedToWebSocket: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isSpeakerOn: boolean;
  setIsSpeakerOn: (speakerOn: boolean) => void;
  isInCall: boolean;
  takeCall: () => void;
}

const ActiveCallContext = createContext<ActiveCallContextType | undefined>(undefined);

interface ActiveCallProviderProps {
  children: React.ReactNode;
}

export function ActiveCallProvider({ children }: ActiveCallProviderProps) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<object | null>(null);
  const [isConnectedToWebSocket, setIsConnectedToWebSocket] = useState(false);

  // Call control states
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isInCall, setIsInCall] = useState(false); // false = see mode, true = in call mode

  const currentCallIdRef = useRef<string | null>(null);

  // Fetch transcript when callId changes from URL params
  useEffect(() => {
    const callIdFromUrl = searchParams.get("callId");
    if (callIdFromUrl && callIdFromUrl !== callId) {
      setCallId(callIdFromUrl);
      fetchTranscript(callIdFromUrl);
    }
  }, [searchParams]);

  const fetchTranscript = async (targetCallId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch formatted transcript with messages
      const data = await transcriptApi.getFormattedTranscript(targetCallId);

      setTranscript(data.messages || []);
      setCallStatus(data.status);
      setCallDuration(data.duration);
      setStartedAt(data.startedAt);
      setEndedAt(data.endedAt);
      setPatientInfo(data.patient);
    } catch (err) {
      console.error("Error fetching transcript:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load call transcript";
      setError(errorMessage);
      toast.error(errorMessage);

      // Clear transcript on error
      setTranscript([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCall = () => {
    setCallId(null);
    setTranscript([]);
    setError(null);
    setCallStatus(null);
    setCallDuration(null);
    setStartedAt(null);
    setEndedAt(null);
    setPatientInfo(null);
    setIsInCall(false);
    setIsMuted(false);
    setIsSpeakerOn(true);
  };

  const takeCall = async () => {
    if (!callId) {
      toast.error("No call ID available");
      return;
    }

    if (!user?.operatorId) {
      toast.error("Operator ID not found. Please log in again.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await handoffApi.takeControl(
        callId,
        user.operatorId,
        "Operator taking control from see mode"
      );

      if (response.success) {
        setIsInCall(true);
        toast.success("You are now in control of the call");
        console.log("✅ Call control taken:", response);
      } else {
        toast.error("Failed to take control of the call");
      }
    } catch (err) {
      console.error("Error taking control of call:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to take control of the call";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket subscription for real-time transcript updates
  useEffect(() => {
    if (!callId) {
      return;
    }

    console.log(`📝 [ACTIVE-CALL] Setting up transcript subscription for call ${callId}`);
    setIsConnectedToWebSocket(true);
    currentCallIdRef.current = callId;

    const unsubscribe = QueueAPI.subscribeToTranscript(callId, (transcriptData: string) => {
      if (!transcriptData) {
        return;
      }

      if (typeof transcriptData === "string") {
        const lines = transcriptData.split("\n").filter((line) => line.trim());
        const messages: TranscriptMessage[] = lines.map((line, index) => {
          const speakerMatch = line.match(/^(.*?):\s*(.*)$/);
          return {
            index,
            timestamp: null,
            speaker: speakerMatch ? speakerMatch[1].trim() : "Unknown",
            text: speakerMatch ? speakerMatch[2].trim() : line.trim(),
            confidence: null,
          };
        });

        setTranscript(messages);
        console.log("✅ [ACTIVE-CALL] Transcript updated with", messages.length, "messages");
      }
    });

    return () => {
      console.log("🧹 [ACTIVE-CALL] Cleaning up transcript subscription");
      unsubscribe();
      setIsConnectedToWebSocket(false);

      if (currentCallIdRef.current === callId) {
        currentCallIdRef.current = null;
      }
    };
  }, [callId]);

  const value: ActiveCallContextType = {
    callId,
    transcript,
    isLoading,
    error,
    callStatus,
    callDuration,
    startedAt,
    endedAt,
    patientInfo,
    fetchTranscript,
    clearCall,
    isConnectedToWebSocket,
    isMuted,
    setIsMuted,
    isSpeakerOn,
    setIsSpeakerOn,
    isInCall,
    takeCall,
  };

  return <ActiveCallContext.Provider value={value}>{children}</ActiveCallContext.Provider>;
}

export function useActiveCall() {
  const context = useContext(ActiveCallContext);
  if (context === undefined) {
    throw new Error("useActiveCall must be used within an ActiveCallProvider");
  }
  return context;
}
