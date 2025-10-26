"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import * as transcriptApi from "@/api/transcript";
import { toast } from "sonner";

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
}

const ActiveCallContext = createContext<ActiveCallContextType | undefined>(undefined);

interface ActiveCallProviderProps {
  children: React.ReactNode;
}

export function ActiveCallProvider({ children }: ActiveCallProviderProps) {
  const searchParams = useSearchParams();
  const [callId, setCallId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [patientInfo, setPatientInfo] = useState<object | null>(null);

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
  };

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
