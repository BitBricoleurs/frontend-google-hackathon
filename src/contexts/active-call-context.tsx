"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import * as transcriptApi from "@/api/transcript";
import * as handoffApi from "@/api/handoff";
import { toast } from "sonner";
import { QueueAPI } from "@/services/queue-api";
import { useAuth } from "./auth-context";
import { AudioManager } from "@/services/audio-manager";

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
  takeCall: () => Promise<void>;
  hangUpCall: () => void;
  isAudioConnected: boolean;
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
  const [isAudioConnected, setIsAudioConnected] = useState(false);

  const currentCallIdRef = useRef<string | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);

  // Fetch transcript when callId changes from URL params
  useEffect(() => {
    const callIdFromUrl = searchParams.get("callId");
    if (callIdFromUrl && callIdFromUrl !== callId) {
      setCallId(callIdFromUrl);
      fetchTranscript(callIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Wrapper functions for mute/speaker that also control the audio manager
  const handleSetMuted = (muted: boolean) => {
    setIsMuted(muted);
    if (audioManagerRef.current) {
      audioManagerRef.current.setMuted(muted);
    }
  };

  const handleSetSpeakerOn = (speakerOn: boolean) => {
    setIsSpeakerOn(speakerOn);
    if (audioManagerRef.current) {
      audioManagerRef.current.setSpeakerOn(speakerOn);
    }
  };

  const clearCall = () => {
    // Disconnect audio if connected
    if (audioManagerRef.current) {
      audioManagerRef.current.disconnect();
      audioManagerRef.current = null;
    }

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
    setIsAudioConnected(false);
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

        // Connect audio stream using the handoffId
        try {
          const audioManager = new AudioManager();
          audioManagerRef.current = audioManager;

          // Request microphone permission first (before WebSocket connection)
          const hasPermission = await audioManager.requestMicrophonePermission();

          if (!hasPermission) {
            toast.error("Microphone permission denied. You won't be able to speak to the caller.");
            // Continue anyway - they can still listen
          }

          await audioManager.connect(
            response.handoffId, // Use handoffId instead of callId
            () => {
              // Handle audio messages - no logging needed
            },
            () => {
              // On connected
              setIsAudioConnected(true);
              toast.success("Audio connected - You can now speak with the caller");
            },
            () => {
              // On disconnected
              setIsAudioConnected(false);
            },
            (error) => {
              // On error
              toast.error(`Audio error: ${error}`);
            }
          );
        } catch {
          toast.error("Failed to connect audio stream");
        }
      } else {
        toast.error("Failed to take control of the call");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to take control of the call";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const hangUpCall = () => {
    if (!audioManagerRef.current) {
      toast.error("No active call to hang up");
      return;
    }

    try {
      // Send hang up message via WebSocket
      audioManagerRef.current.hangUp();

      // Update UI state
      setIsInCall(false);
      setIsAudioConnected(false);
      setCallStatus("completed");

      toast.success("Call ended");

      // Clear the audio manager reference
      audioManagerRef.current = null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to hang up call";
      toast.error(errorMessage);
    }
  };

  // WebSocket connection state monitoring
  useEffect(() => {
    console.log("🔌 [ACTIVE-CALL] Setting up connection state monitoring");

    const unsubscribeState = QueueAPI.subscribeToConnectionState((state) => {
      console.log("🔌 [ACTIVE-CALL] Connection state changed:", state);
      setIsConnectedToWebSocket(state.isConnected);

      if (!state.isConnected && state.error) {
        console.warn("⚠️ [ACTIVE-CALL] Connection lost:", state.error);
      }
    });

    const unsubscribeEvents = QueueAPI.subscribeToConnectionEvents((event) => {
      console.log("📡 [ACTIVE-CALL] Connection event:", event.type);

      switch (event.type) {
        case "ai_terminated":
          if ((event.data as { callId?: string })?.callId === callId) {
            console.log("🤖 [ACTIVE-CALL] AI terminated for current call");
            toast.info("AI conversation has ended");
            setCallStatus("completed");
          }
          break;

        case "call_ended":
          if ((event.data as { callId?: string })?.callId === callId) {
            const reason = (event.data as { reason?: string })?.reason;
            console.log("📞 [ACTIVE-CALL] Call ended for current call:", reason);
            toast.info(`Call ended: ${reason}`);
            setCallStatus("ended");
            // Auto-disconnect audio if in call
            if (audioManagerRef.current) {
              audioManagerRef.current.disconnect();
              audioManagerRef.current = null;
              setIsAudioConnected(false);
            }
          }
          break;

        case "session_terminated":
          console.log("🔴 [ACTIVE-CALL] Session terminated");
          const terminateReason = (event.data as { reason?: string })?.reason;
          toast.error(`Session terminated: ${terminateReason}`);
          break;
      }
    });

    return () => {
      console.log("🧹 [ACTIVE-CALL] Cleaning up connection monitoring");
      unsubscribeState();
      unsubscribeEvents();
    };
  }, [callId]);

  // WebSocket subscription for real-time transcript updates
  useEffect(() => {
    if (!callId) {
      return;
    }

    console.log(`📝 [ACTIVE-CALL] Setting up transcript subscription for call ${callId}`);
    currentCallIdRef.current = callId;

    const unsubscribe = QueueAPI.subscribeToTranscript(callId, (transcriptData: string) => {
      if (!transcriptData) {
        return;
      }

      if (typeof transcriptData === "string") {
        const lines = transcriptData.split("\n").filter((line) => line.trim());
        const messages: TranscriptMessage[] = lines.map((line, index) => {
          const colonIndex = line.indexOf(":");
          const hasSpeaker = colonIndex !== -1;
          return {
            index,
            timestamp: null,
            speaker: hasSpeaker ? line.slice(0, colonIndex).trim() : "Unknown",
            text: hasSpeaker ? line.slice(colonIndex + 1).trim() : line.trim(),
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
    setIsMuted: handleSetMuted,
    isSpeakerOn,
    setIsSpeakerOn: handleSetSpeakerOn,
    isInCall,
    takeCall,
    hangUpCall,
    isAudioConnected,
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
