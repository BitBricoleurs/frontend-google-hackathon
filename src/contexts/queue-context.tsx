"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { QueueCall } from "@/components/layout/floating-queue";
import { QueueAPI, QueueStats } from "@/services/queue-api";

interface QueueContextType {
  calls: QueueCall[];
  stats: QueueStats | null;
  isLoading: boolean;
  error: string | null;
  fetchCalls: () => Promise<void>;
  addCall: (call: Omit<QueueCall, "id">) => Promise<void>;
  removeCall: (callId: string) => Promise<void>;
  updateCall: (callId: string, updates: Partial<QueueCall>) => Promise<void>;
  updateWaitTimes: () => void;
  refreshStats: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<QueueCall[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all calls from API
  const fetchCalls = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await QueueAPI.getQueueCalls();
      setCalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch calls");
      console.error("Error fetching calls:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new call via API
  const addCall = useCallback(async (call: Omit<QueueCall, "id">) => {
    setError(null);
    try {
      const newCall = await QueueAPI.addCall(call);
      setCalls((prev) => [...prev, newCall]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add call");
      console.error("Error adding call:", err);
      throw err;
    }
  }, []);

  // Remove a call via API
  const removeCall = useCallback(async (callId: string) => {
    setError(null);
    try {
      await QueueAPI.removeCall(callId);
      setCalls((prev) => prev.filter((call) => call.id !== callId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove call");
      console.error("Error removing call:", err);
      throw err;
    }
  }, []);

  // Update a call via API
  const updateCall = useCallback(
    async (callId: string, updates: Partial<QueueCall>) => {
      setError(null);
      try {
        const updatedCall = await QueueAPI.updateCall(callId, updates);
        setCalls((prev) =>
          prev.map((call) =>
            call.id === callId ? { ...call, ...updatedCall } : call
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update call");
        console.error("Error updating call:", err);
        throw err;
      }
    },
    []
  );

  // Update wait times locally (runs every second)
  const updateWaitTimes = useCallback(() => {
    setCalls((prev) =>
      prev.map((call) => ({
        ...call,
        waitTime: call.waitTime + 1,
      }))
    );
  }, []);

  // Fetch queue statistics
  const refreshStats = useCallback(async () => {
    try {
      const data = await QueueAPI.getQueueStats();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCalls();
    refreshStats();
  }, [fetchCalls, refreshStats]);

  // Set up WebSocket subscription for real-time updates
  useEffect(() => {
    const unsubscribe = QueueAPI.subscribeToQueueUpdates((updatedCalls) => {
      setCalls(updatedCalls);
      refreshStats();
    });

    return () => {
      unsubscribe();
    };
  }, [refreshStats]);

  return (
    <QueueContext.Provider
      value={{
        calls,
        stats,
        isLoading,
        error,
        fetchCalls,
        addCall,
        removeCall,
        updateCall,
        updateWaitTimes,
        refreshStats,
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
