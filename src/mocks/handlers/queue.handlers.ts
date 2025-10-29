/**
 * MSW Queue Handlers
 *
 * Mock API handlers for queue management endpoints
 */

import { http, HttpResponse } from "msw";
import { mockQueueCalls, calculateQueueStats } from "../data/queue.fixtures";
import { mockErrorResponses } from "../data/auth.fixtures";
import type { QueueCall } from "@/types/queue";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// In-memory store for testing (resets between tests)
let queueStore = [...mockQueueCalls];

/**
 * Queue Management API Handlers
 */
export const queueHandlers = [
  /**
   * GET /api/queue/calls
   * Get all calls in the queue
   */
  http.get(`${API_BASE_URL}/api/queue/calls`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    return HttpResponse.json({ success: true, data: queueStore }, { status: 200 });
  }),

  /**
   * POST /api/queue/calls
   * Add a new call to the queue
   */
  http.post(`${API_BASE_URL}/api/queue/calls`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const body = (await request.json()) as Omit<QueueCall, "id">;

    // Create new call with generated ID
    const newCall: QueueCall = {
      ...body,
      id: `call-${Date.now()}`,
    };

    queueStore.push(newCall);

    return HttpResponse.json({ success: true, data: newCall }, { status: 201 });
  }),

  /**
   * DELETE /api/queue/calls/:callId
   * Remove a call from the queue
   */
  http.delete(`${API_BASE_URL}/api/queue/calls/:callId`, ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const { callId } = params;
    const callIndex = queueStore.findIndex((c) => c.id === callId);

    if (callIndex === -1) {
      return HttpResponse.json(
        {
          error: {
            code: "CALL_NOT_FOUND",
            message: "Call not found in queue",
          },
        },
        { status: 404 }
      );
    }

    // Remove call from queue
    queueStore.splice(callIndex, 1);

    return HttpResponse.json(
      { success: true, message: "Call removed from queue" },
      { status: 200 }
    );
  }),

  /**
   * PATCH /api/queue/calls/:callId
   * Update a call in the queue
   */
  http.patch(`${API_BASE_URL}/api/queue/calls/:callId`, async ({ request, params }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const { callId } = params;
    const body = (await request.json()) as Partial<QueueCall>;

    const callIndex = queueStore.findIndex((c) => c.id === callId);

    if (callIndex === -1) {
      return HttpResponse.json(
        {
          error: {
            code: "CALL_NOT_FOUND",
            message: "Call not found in queue",
          },
        },
        { status: 404 }
      );
    }

    // Update call
    queueStore[callIndex] = {
      ...queueStore[callIndex],
      ...body,
    };

    return HttpResponse.json({ success: true, data: queueStore[callIndex] }, { status: 200 });
  }),

  /**
   * GET /api/queue/stats
   * Get queue statistics
   */
  http.get(`${API_BASE_URL}/api/queue/stats`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const stats = calculateQueueStats(queueStore);

    return HttpResponse.json({ success: true, data: stats }, { status: 200 });
  }),
];

/**
 * Helper to reset queue store (for testing)
 */
export function resetQueueStore() {
  queueStore = [...mockQueueCalls];
}

/**
 * Helper to get queue store (for testing)
 */
export function getQueueStore() {
  return [...queueStore];
}

/**
 * Helper to set queue store (for testing)
 */
export function setQueueStore(calls: QueueCall[]) {
  queueStore = [...calls];
}
