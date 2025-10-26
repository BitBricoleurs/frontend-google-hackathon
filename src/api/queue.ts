import { api } from "@/lib/api-client";
import type {
  QueueEntry,
  QueueStats,
  ListQueueEntriesResponse,
  QueueFilters,
  ClaimQueueEntryRequest,
  ClaimQueueEntryResponse,
  UpdateQueueStatusRequest,
  UpdateQueueStatusResponse,
  GetQueueEntryResponse,
} from "@/types/queue";

/**
 * List all queue entries with optional filters
 * Backend: GET /api/v1/queue/
 * @param filters - Optional status and priority filters
 * @returns Array of queue entries
 */
export async function listQueueEntries(filters?: QueueFilters): Promise<QueueEntry[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.priority) params.append("priority", filters.priority);

  const url = `/queue/${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get<ListQueueEntriesResponse>(url);
  return response.data.data;
}

/**
 * Get queue statistics
 * Backend: GET /api/v1/queue/stats
 * @returns Queue statistics (total, by status, average wait time)
 */
export async function getQueueStats(): Promise<QueueStats> {
  const response = await api.get<QueueStats>("/queue/stats");
  return response.data;
}

/**
 * Get a specific queue entry by ID
 * Backend: GET /api/v1/queue/{queueEntryId}
 * @param queueEntryId - Queue entry ID
 * @returns Queue entry details
 */
export async function getQueueEntry(queueEntryId: string): Promise<QueueEntry> {
  const response = await api.get<GetQueueEntryResponse>(`/queue/${queueEntryId}`);
  return response.data.data;
}

/**
 * Claim a queue entry (operator takes the call)
 * Backend: POST /api/v1/queue/{queueEntryId}/claim
 * @param queueEntryId - Queue entry ID to claim
 * @param operatorId - Operator ID claiming the call
 * @returns Updated queue entry
 */
export async function claimQueueEntry(
  queueEntryId: string,
  operatorId: string
): Promise<ClaimQueueEntryResponse["data"]> {
  const payload: ClaimQueueEntryRequest = { operatorId };
  const response = await api.post<ClaimQueueEntryResponse>(`/queue/${queueEntryId}/claim`, payload);
  return response.data.data;
}

/**
 * Update queue entry status
 * Backend: PATCH /api/v1/queue/{queueEntryId}/status
 * @param queueEntryId - Queue entry ID
 * @param status - New status
 * @returns Updated queue entry
 */
export async function updateQueueStatus(
  queueEntryId: string,
  status: UpdateQueueStatusRequest["status"]
): Promise<UpdateQueueStatusResponse["data"]> {
  const payload: UpdateQueueStatusRequest = { status };
  const response = await api.patch<UpdateQueueStatusResponse>(
    `/queue/${queueEntryId}/status`,
    payload
  );
  return response.data.data;
}
