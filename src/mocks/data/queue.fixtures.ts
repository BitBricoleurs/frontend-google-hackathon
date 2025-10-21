/**
 * Queue Mock Data Fixtures
 *
 * Mock data for queue management tests
 */

import { QueueCall } from "@/components/layout/floating-queue";
import { QueueStats } from "@/services/queue-api";

/**
 * Mock queue calls with various states and priorities
 */
export const mockQueueCalls: QueueCall[] = [
  {
    id: "call-1",
    callerName: "Marie Dubois",
    phoneNumber: "+33 1 23 45 67 89",
    waitTime: 125,
    aiStatus: "connected",
    priority: "high",
    keywords: ["chest pain", "breathing difficulty", "unconscious"],
    emotionalState: "panic",
  },
  {
    id: "call-2",
    callerName: "Jean Martin",
    phoneNumber: "+33 1 98 76 54 32",
    waitTime: 85,
    aiStatus: "connected",
    priority: "medium",
    keywords: ["accident", "bleeding", "leg injury"],
    emotionalState: "distress",
  },
  {
    id: "call-3",
    callerName: "Sophie Bernard",
    phoneNumber: "+33 1 55 44 33 22",
    waitTime: 45,
    aiStatus: "connecting",
    priority: "low",
    keywords: ["fever", "nausea"],
    emotionalState: "anxious",
  },
  {
    id: "call-4",
    callerName: "Pierre Lefebvre",
    phoneNumber: "+33 1 11 22 33 44",
    waitTime: 20,
    aiStatus: "pending",
    priority: "low",
    keywords: ["minor cut", "first aid"],
    emotionalState: "calm",
  },
  {
    id: "call-5",
    callerName: "Isabelle Moreau",
    phoneNumber: "+33 1 66 77 88 99",
    waitTime: 180,
    aiStatus: "connected",
    priority: "high",
    keywords: ["heart attack", "collapsed", "not responding"],
    emotionalState: "panic",
  },
];

/**
 * Empty queue for testing
 */
export const mockEmptyQueue: QueueCall[] = [];

/**
 * Mock single high-priority call
 */
export const mockHighPriorityCall: QueueCall = {
  id: "call-high-1",
  callerName: "Emergency Caller",
  phoneNumber: "+33 1 99 99 99 99",
  waitTime: 300,
  aiStatus: "connecting",
  priority: "high",
  keywords: ["cardiac arrest", "CPR needed", "critical"],
  emotionalState: "panic",
};

/**
 * Mock new call to be added
 */
export const mockNewCall: Omit<QueueCall, "id"> = {
  callerName: "New Caller",
  phoneNumber: "+33 1 12 34 56 78",
  waitTime: 0,
  aiStatus: "pending",
  priority: "medium",
  keywords: ["headache", "dizziness"],
  emotionalState: "anxious",
};

/**
 * Mock created call response (with generated ID)
 */
export const mockCreatedCall: QueueCall = {
  id: "call-new-123",
  ...mockNewCall,
};

/**
 * Mock call updates
 */
export const mockCallUpdates = {
  statusUpdate: {
    aiStatus: "connected" as const,
  },
  priorityUpdate: {
    priority: "high" as const,
  },
  waitTimeUpdate: {
    waitTime: 200,
  },
  fullUpdate: {
    aiStatus: "connected" as const,
    priority: "high" as const,
    waitTime: 150,
    emotionalState: "panic" as const,
  },
};

/**
 * Mock queue statistics
 */
export const mockQueueStats: QueueStats = {
  totalCalls: 5,
  averageWaitTime: 91, // (125+85+45+20+180)/5
  aiConnected: 3,
  aiConnecting: 1,
  pending: 1,
  highPriority: 2,
};

/**
 * Mock empty queue statistics
 */
export const mockEmptyQueueStats: QueueStats = {
  totalCalls: 0,
  averageWaitTime: 0,
  aiConnected: 0,
  aiConnecting: 0,
  pending: 0,
  highPriority: 0,
};

/**
 * Mock WebSocket messages
 */
export const mockWebSocketMessages = {
  queueUpdate: {
    type: "update",
    data: mockQueueCalls,
  },
  newCall: {
    type: "add",
    data: mockCreatedCall,
  },
  removeCall: {
    type: "remove",
    data: "call-1",
  },
  callUpdate: {
    type: "update",
    data: {
      id: "call-1",
      ...mockCallUpdates.statusUpdate,
    },
  },
};

/**
 * Helper to calculate queue statistics
 */
export function calculateQueueStats(calls: QueueCall[]): QueueStats {
  if (calls.length === 0) {
    return mockEmptyQueueStats;
  }

  return {
    totalCalls: calls.length,
    averageWaitTime: Math.floor(calls.reduce((acc, call) => acc + call.waitTime, 0) / calls.length),
    aiConnected: calls.filter((c) => c.aiStatus === "connected").length,
    aiConnecting: calls.filter((c) => c.aiStatus === "connecting").length,
    pending: calls.filter((c) => c.aiStatus === "pending").length,
    highPriority: calls.filter((c) => c.priority === "high").length,
  };
}

/**
 * Helper to simulate call wait time increment
 */
export function incrementWaitTimes(calls: QueueCall[], seconds: number): QueueCall[] {
  return calls.map((call) => ({
    ...call,
    waitTime: call.waitTime + seconds,
  }));
}

/**
 * Helper to filter calls by priority
 */
export function filterByPriority(
  calls: QueueCall[],
  priority: "high" | "medium" | "low"
): QueueCall[] {
  return calls.filter((call) => call.priority === priority);
}

/**
 * Helper to filter calls by AI status
 */
export function filterByAiStatus(
  calls: QueueCall[],
  status: "connected" | "connecting" | "pending"
): QueueCall[] {
  return calls.filter((call) => call.aiStatus === status);
}
