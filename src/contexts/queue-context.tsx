"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Call } from "@/types/chat";
import { getWaitingQueue } from "@/data/mock-calls";

interface QueueContextType {
  calls: Call[];
  isLoading: boolean;
  error: string | null;
  refreshQueue: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh queue from mock data
  const refreshQueue = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      // Get waiting calls sorted by priority
      const waitingCalls = getWaitingQueue();
      setCalls(waitingCalls);
      console.log("📋 Queue refreshed:", waitingCalls.length, "waiting calls");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queue");
      console.error("Error fetching queue:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  // Auto-refresh queue every 30 seconds (simulates real-time updates)
  useEffect(() => {
    const interval = setInterval(refreshQueue, 30000);
    return () => clearInterval(interval);
  }, [refreshQueue]);

  return (
    <QueueContext.Provider
      value={{
        calls,
        isLoading,
        error,
        refreshQueue,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}
