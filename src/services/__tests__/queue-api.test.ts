/**
 * @jest-environment jsdom
 */
import { QueueAPI } from "../queue-api";
import * as queueApi from "@/api/queue";
import { tokenManager } from "@/lib/token-manager";
import type { QueueEntry } from "@/types/queue";

// Mock the API module
jest.mock("@/api/queue");
jest.mock("@/lib/token-manager");

const mockQueueApi = queueApi as jest.Mocked<typeof queueApi>;
const mockTokenManager = tokenManager as jest.Mocked<typeof tokenManager>;

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onclose: (() => void) | null = null;

  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  });

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
}

describe("QueueAPI", () => {
  const mockQueueEntry: QueueEntry = {
    id: "queue-123",
    callId: "call-456",
    priority: "P1",
    chiefComplaint: "Chest pain",
    patientAge: 45,
    status: "WAITING",
    waitingSince: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock WebSocket with static constants
    const MockWebSocketConstructor = MockWebSocket as unknown as typeof WebSocket;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

    (global as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocketConstructor;
    mockTokenManager.getAccessToken.mockReturnValue("test-token");
  });

  describe("getQueueCalls", () => {
    it("should fetch and transform queue entries", async () => {
      mockQueueApi.listQueueEntries.mockResolvedValue([mockQueueEntry]);

      const result = await QueueAPI.getQueueCalls();

      expect(mockQueueApi.listQueueEntries).toHaveBeenCalledWith({ status: "WAITING" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("queue-123");
      expect(result[0].callId).toBe("call-456");
    });

    it("should handle API errors", async () => {
      mockQueueApi.listQueueEntries.mockRejectedValue(new Error("API Error"));

      await expect(QueueAPI.getQueueCalls()).rejects.toThrow("API Error");
    });
  });

  describe("removeCall", () => {
    it("should update queue status to COMPLETED", async () => {
      mockQueueApi.updateQueueStatus.mockResolvedValue({
        id: "queue-123",
        status: "COMPLETED",
      });

      await QueueAPI.removeCall("queue-123");

      expect(mockQueueApi.updateQueueStatus).toHaveBeenCalledWith("queue-123", "COMPLETED");
    });

    it("should handle errors when removing call", async () => {
      mockQueueApi.updateQueueStatus.mockRejectedValue(new Error("Failed to update"));

      await expect(QueueAPI.removeCall("queue-123")).rejects.toThrow("Failed to update");
    });
  });

  describe("claimCall", () => {
    it("should claim a call and return transformed data", async () => {
      mockQueueApi.claimQueueEntry.mockResolvedValue({
        id: "queue-123",
        callId: "call-456",
        status: "CLAIMED",
        claimedBy: "operator-789",
        claimedAt: new Date().toISOString(),
      });

      mockQueueApi.getQueueEntry.mockResolvedValue({
        ...mockQueueEntry,
        status: "CLAIMED",
        claimedBy: "operator-789",
      });

      const result = await QueueAPI.claimCall("queue-123", "operator-789");

      expect(mockQueueApi.claimQueueEntry).toHaveBeenCalledWith("queue-123", "operator-789");
      expect(mockQueueApi.getQueueEntry).toHaveBeenCalledWith("queue-123");
      expect(result.id).toBe("queue-123");
    });

    it("should handle claim errors", async () => {
      mockQueueApi.claimQueueEntry.mockRejectedValue(new Error("Already claimed"));

      await expect(QueueAPI.claimCall("queue-123", "operator-789")).rejects.toThrow(
        "Already claimed"
      );
    });
  });

  describe("updateCallStatus", () => {
    it("should update call status", async () => {
      mockQueueApi.updateQueueStatus.mockResolvedValue({
        id: "queue-123",
        status: "IN_PROGRESS",
      });

      await QueueAPI.updateCallStatus("queue-123", "IN_PROGRESS");

      expect(mockQueueApi.updateQueueStatus).toHaveBeenCalledWith("queue-123", "IN_PROGRESS");
    });

    it("should handle update errors", async () => {
      mockQueueApi.updateQueueStatus.mockRejectedValue(new Error("Update failed"));

      await expect(QueueAPI.updateCallStatus("queue-123", "COMPLETED")).rejects.toThrow(
        "Update failed"
      );
    });
  });

  describe("updateCall", () => {
    it("should fetch current queue entry state", async () => {
      mockQueueApi.getQueueEntry.mockResolvedValue(mockQueueEntry);

      const result = await QueueAPI.updateCall("queue-123", { priority: "high" });

      expect(mockQueueApi.getQueueEntry).toHaveBeenCalledWith("queue-123");
      expect(result.id).toBe("queue-123");
    });

    it("should handle fetch errors", async () => {
      mockQueueApi.getQueueEntry.mockRejectedValue(new Error("Not found"));

      await expect(QueueAPI.updateCall("queue-123", {})).rejects.toThrow("Not found");
    });
  });

  describe("getQueueStats", () => {
    it("should fetch and transform queue stats", async () => {
      mockQueueApi.getQueueStats.mockResolvedValue({
        success: true,
        data: {
          total: 10,
          byStatus: {
            waiting: 5,
            claimed: 2,
            inProgress: 2,
            completed: 1,
            abandoned: 0,
          },
          avgWaitTimeSeconds: 120,
        },
      });

      const result = await QueueAPI.getQueueStats();

      expect(result.totalCalls).toBe(10);
      expect(result.averageWaitTime).toBe(120);
      expect(result.aiConnected).toBe(2);
      expect(result.aiConnecting).toBe(2);
      expect(result.pending).toBe(5);
    });

    it("should handle stats fetch errors", async () => {
      mockQueueApi.getQueueStats.mockRejectedValue(new Error("Stats unavailable"));

      await expect(QueueAPI.getQueueStats()).rejects.toThrow("Stats unavailable");
    });
  });

  describe("subscribeToQueueUpdates", () => {
    let mockWs: MockWebSocket;

    beforeEach(() => {
      mockWs = new MockWebSocket();
      const MockWebSocketConstructor = jest.fn(() => mockWs) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      (global as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocketConstructor;
    });

    it("should create WebSocket connection with token", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);

      expect(global.WebSocket).toHaveBeenCalled();
    });

    it("should handle initial queue data", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      expect(onUpdate).toHaveBeenCalled();
      const calls = onUpdate.mock.calls[0][0];
      expect(calls).toHaveLength(1);
      expect(calls[0].id).toBe("queue-123");
    });

    it("should handle queue:added events", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();

      // First send initial data
      mockWs.simulateMessage({
        type: "queue:initial",
        data: [],
      });

      // Then add a new entry
      mockWs.simulateMessage({
        type: "queue:added",
        data: mockQueueEntry,
      });

      expect(onUpdate).toHaveBeenCalledTimes(2);
    });

    it("should handle queue:updated events", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();

      // Send initial data
      mockWs.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      // Update the entry
      mockWs.simulateMessage({
        type: "queue:updated",
        data: { ...mockQueueEntry, status: "CLAIMED" },
      });

      expect(onUpdate).toHaveBeenCalledTimes(2);
    });

    it("should handle queue:removed events", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();

      // Send initial data
      mockWs.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      // Remove the entry
      mockWs.simulateMessage({
        type: "queue:removed",
        data: { id: "queue-123" },
      });

      expect(onUpdate).toHaveBeenCalledTimes(2);
      const calls = onUpdate.mock.calls[1][0];
      expect(calls).toHaveLength(0);
    });

    it("should handle queue:pong heartbeat", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();

      mockWs.simulateMessage({ type: "queue:pong" });

      // Pong should not trigger update
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should return cleanup function", () => {
      const onUpdate = jest.fn();

      const unsubscribe = QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();

      unsubscribe();

      expect(mockWs.close).toHaveBeenCalled();
    });

    it("should fallback to polling when no token", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      const onUpdate = jest.fn();

      mockQueueApi.listQueueEntries.mockResolvedValue([mockQueueEntry]);

      const unsubscribe = QueueAPI.subscribeToQueueUpdates(onUpdate);

      // Wait for first poll
      await new Promise((resolve) => setTimeout(resolve, 100));

      unsubscribe();
    });
  });

  describe("subscribeToTranscript", () => {
    let mockWs: MockWebSocket;

    beforeEach(() => {
      mockWs = new MockWebSocket();
      (global as { WebSocket: typeof MockWebSocket }).WebSocket = jest.fn(
        () => mockWs
      ) as unknown as typeof WebSocket;

      // First subscribe to queue updates to initialize WebSocket
      QueueAPI.subscribeToQueueUpdates(() => {});
      mockWs.simulateOpen();
    });

    it("should send subscription message when WebSocket is ready", () => {
      const onTranscriptUpdate = jest.fn();

      QueueAPI.subscribeToTranscript("call-123", onTranscriptUpdate);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "queue:subscribe-transcript",
          callId: "call-123",
        })
      );
    });

    it("should handle transcript updates", () => {
      const onTranscriptUpdate = jest.fn();

      QueueAPI.subscribeToTranscript("call-123", onTranscriptUpdate);

      mockWs.simulateMessage({
        type: "queue:transcript-updated",
        data: {
          callId: "call-123",
          transcript: "Patient: I have chest pain",
        },
      });

      expect(onTranscriptUpdate).toHaveBeenCalledWith("Patient: I have chest pain");
    });

    it("should return unsubscribe function", () => {
      const onTranscriptUpdate = jest.fn();

      const unsubscribe = QueueAPI.subscribeToTranscript("call-123", onTranscriptUpdate);

      unsubscribe();

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "queue:unsubscribe-transcript",
          callId: "call-123",
        })
      );
    });

    it("should not call callback for wrong callId", () => {
      const onTranscriptUpdate = jest.fn();

      QueueAPI.subscribeToTranscript("call-123", onTranscriptUpdate);

      mockWs.simulateMessage({
        type: "queue:transcript-updated",
        data: {
          callId: "call-456",
          transcript: "Different call",
        },
      });

      expect(onTranscriptUpdate).not.toHaveBeenCalled();
    });
  });
});
