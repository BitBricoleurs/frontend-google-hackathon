import { api } from "@/lib/api-client";

/**
 * Response from take-control endpoint
 */
export interface TakeControlResponse {
  success: boolean;
  handoffId: string;
  message: string;
  aiTerminated: boolean;
}

/**
 * Request payload for take-control endpoint
 */
export interface TakeControlRequest {
  callId: string;
  operatorId: string;
  reason?: string;
}

/**
 * Operator takes control of an active call
 * Backend: POST /api/v1/handoff/take-control
 * @param callId - ID of the call to take over
 * @param operatorId - ID of the operator taking control
 * @param reason - Optional reason for takeover
 * @returns Handoff response with handoffId and AI termination status
 */
export async function takeControl(
  callId: string,
  operatorId: string,
  reason?: string
): Promise<TakeControlResponse> {
  const payload: TakeControlRequest = {
    callId,
    operatorId,
    reason,
  };

  const response = await api.post<TakeControlResponse>("/handoff/take-control", payload);
  return response.data;
}
