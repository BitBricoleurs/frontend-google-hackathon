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
  callId: string; // The actual call ID for fetching transcript
  callerName: string;
  phoneNumber: string;
  waitTime: number; // in seconds
  aiStatus: "connected" | "connecting" | "pending";
  priority: "high" | "medium" | "low";
  keywords: string[];
  emotionalState: "calm" | "distress" | "panic" | "anxious";

  // AI Insights from backend (matching QueueEntry fields)
  chiefComplaint?: string; // Main complaint/reason for call
  aiSummary?: string; // AI-generated summary of the call
  aiRecommendation?: string; // AI recommendation for handling
  keySymptoms?: string[]; // Key symptoms detected by AI
  redFlags?: string[]; // Critical red flags identified
  patientAge?: number; // Patient age if provided
  patientGender?: string; // Patient gender if provided
  location?: string; // Patient location if provided
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
    callId: entry.callId, // The actual call ID for transcript fetching
    callerName: entry.location || "Unknown Caller",
    phoneNumber: entry.callId, // Using callId as phone number proxy
    waitTime,
    aiStatus: mapStatusToAIStatus(entry.status),
    priority: mapPriorityToUI(entry.priority),
    keywords: entry.keySymptoms || [],
    emotionalState,

    // Include AI insights from backend
    chiefComplaint: entry.chiefComplaint,
    aiSummary: entry.aiSummary,
    aiRecommendation: entry.aiRecommendation,
    keySymptoms: entry.keySymptoms,
    redFlags: entry.redFlags,
    patientAge: entry.patientAge,
    patientGender: entry.patientGender,
    location: entry.location,
  };
}

/**
 * WebSocket Connection Control Message Types
 * These messages manage the lifecycle and state of WebSocket connections
 */

/**
 * Connection control message types
 */
export type ConnectionMessageType =
  | "connection"
  | "connected"
  | "session_terminated"
  | "ai_terminated"
  | "call_ended"
  | "subscribed"
  | "unsubscribed";

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage {
  type: string;
  data?: unknown;
  error?: string;
}

/**
 * Connection message - initial connection request from client
 */
export interface ConnectionMessage extends WebSocketMessage {
  type: "connection";
  data?: {
    clientId?: string;
    timestamp?: string;
  };
}

/**
 * Connected message - confirmation from server that connection is established
 */
export interface ConnectedMessage extends WebSocketMessage {
  type: "connected";
  data: {
    sessionId: string;
    timestamp: string;
    message?: string;
  };
}

/**
 * Session terminated message - server indicates session has ended
 */
export interface SessionTerminatedMessage extends WebSocketMessage {
  type: "session_terminated";
  data: {
    sessionId: string;
    reason: string;
    timestamp: string;
  };
}

/**
 * AI terminated message - AI conversation has ended
 */
export interface AITerminatedMessage extends WebSocketMessage {
  type: "ai_terminated";
  data: {
    callId: string;
    reason: string;
    timestamp: string;
  };
}

/**
 * Call ended message - call has been completed or disconnected
 */
export interface CallEndedMessage extends WebSocketMessage {
  type: "call_ended";
  data: {
    callId: string;
    queueEntryId?: string;
    reason: string;
    duration?: number;
    timestamp: string;
  };
}

/**
 * Subscribed message - confirmation that subscription was successful
 */
export interface SubscribedMessage extends WebSocketMessage {
  type: "subscribed";
  data: {
    subscription: string;
    callId?: string;
    timestamp: string;
  };
}

/**
 * Unsubscribed message - confirmation that unsubscription was successful
 */
export interface UnsubscribedMessage extends WebSocketMessage {
  type: "unsubscribed";
  data: {
    subscription: string;
    callId?: string;
    timestamp: string;
  };
}

/**
 * Union type for all connection control messages
 */
export type ConnectionControlMessage =
  | ConnectionMessage
  | ConnectedMessage
  | SessionTerminatedMessage
  | AITerminatedMessage
  | CallEndedMessage
  | SubscribedMessage
  | UnsubscribedMessage;
