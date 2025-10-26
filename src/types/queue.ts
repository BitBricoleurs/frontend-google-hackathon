/**
 * Queue management types matching backend API
 * API Base: /api/v1/queue
 */

/**
 * Priority levels as defined in backend
 */
export type QueuePriority = "P0" | "P1" | "P2" | "P3";

/**
 * Queue entry status
 */
export type QueueStatus = "WAITING" | "CLAIMED" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

/**
 * Queue entry from backend API
 * Represents a call waiting in the queue
 */
export interface QueueEntry {
  id: string;
  callId: string;
  priority: QueuePriority;
  chiefComplaint: string;
  patientAge?: number;
  patientGender?: string;
  location?: string;
  aiSummary?: string;
  aiRecommendation?: string;
  keySymptoms?: string[];
  redFlags?: string[];
  status: QueueStatus;
  waitingSince: string; // ISO date string
  claimedBy?: string;
  claimedAt?: string; // ISO date string
  call?: Record<string, unknown>; // Full call object (if populated)
}

/**
 * Queue statistics response
 * GET /api/v1/queue/stats
 */
export interface QueueStats {
  success: boolean;
  data: {
    total: number;
    byStatus: {
      waiting: number;
      claimed: number;
      inProgress: number;
      completed: number;
      abandoned: number;
    };
    avgWaitTimeSeconds: number;
  };
}

/**
 * List queue entries response
 * GET /api/v1/queue/
 */
export interface ListQueueEntriesResponse {
  success: boolean;
  data: QueueEntry[];
}

/**
 * Query parameters for listing queue entries
 */
export interface QueueFilters {
  status?: QueueStatus;
  priority?: QueuePriority;
}

/**
 * Claim queue entry request
 * POST /api/v1/queue/{queueEntryId}/claim
 */
export interface ClaimQueueEntryRequest {
  operatorId: string;
}

/**
 * Claim queue entry response
 */
export interface ClaimQueueEntryResponse {
  success: boolean;
  data: {
    id: string;
    callId: string;
    status: QueueStatus;
    claimedBy: string;
    claimedAt: string;
  };
  message: string;
}

/**
 * Update queue status request
 * PATCH /api/v1/queue/{queueEntryId}/status
 */
export interface UpdateQueueStatusRequest {
  status: QueueStatus;
}

/**
 * Update queue status response
 */
export interface UpdateQueueStatusResponse {
  success: boolean;
  data: {
    id: string;
    status: QueueStatus;
  };
  message: string;
}

/**
 * Get queue entry response
 * GET /api/v1/queue/{queueEntryId}
 */
export interface GetQueueEntryResponse {
  success: boolean;
  data: QueueEntry;
}

/**
 * Frontend-specific queue call type (for UI components)
 * Maps backend QueueEntry to UI-friendly format
 */
export interface QueueCall {
  id: string;
  callerName: string;
  phoneNumber: string;
  waitTime: number; // in seconds
  aiStatus: "connected" | "connecting" | "pending";
  priority: "high" | "medium" | "low";
  keywords: string[];
  emotionalState: "calm" | "distress" | "panic" | "anxious";
}

/**
 * Helper to map backend priority to frontend priority
 */
export function mapPriorityToUI(priority: QueuePriority): QueueCall["priority"] {
  switch (priority) {
    case "P0":
    case "P1":
      return "high";
    case "P2":
      return "medium";
    case "P3":
      return "low";
    default:
      return "low";
  }
}

/**
 * Helper to map frontend priority to backend priority
 */
export function mapPriorityToBackend(priority: QueueCall["priority"]): QueuePriority {
  switch (priority) {
    case "high":
      return "P0";
    case "medium":
      return "P2";
    case "low":
      return "P3";
    default:
      return "P3";
  }
}

/**
 * Helper to map backend status to frontend AI status
 */
export function mapStatusToAIStatus(status: QueueStatus): QueueCall["aiStatus"] {
  switch (status) {
    case "WAITING":
      return "connected";
    case "CLAIMED":
    case "IN_PROGRESS":
      return "connected";
    case "COMPLETED":
    case "ABANDONED":
      return "pending";
    default:
      return "pending";
  }
}

/**
 * Helper to convert QueueEntry to QueueCall for UI
 */
export function queueEntryToQueueCall(entry: QueueEntry): QueueCall {
  const now = new Date();
  const waitingSince = new Date(entry.waitingSince);
  const waitTime = Math.floor((now.getTime() - waitingSince.getTime()) / 1000);

  // Extract emotional state from keywords or AI summary (heuristic)
  const emotionalState: QueueCall["emotionalState"] =
    entry.redFlags && entry.redFlags.length > 0
      ? "panic"
      : entry.priority === "P0" || entry.priority === "P1"
        ? "distress"
        : entry.priority === "P2"
          ? "anxious"
          : "calm";

  return {
    id: entry.id,
    callerName: entry.location || "Unknown Caller",
    phoneNumber: entry.callId, // Using callId as phone number proxy
    waitTime,
    aiStatus: mapStatusToAIStatus(entry.status),
    priority: mapPriorityToUI(entry.priority),
    keywords: entry.keySymptoms || [],
    emotionalState,
  };
}
