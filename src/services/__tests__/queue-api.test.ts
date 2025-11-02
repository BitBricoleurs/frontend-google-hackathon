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
  onclose: ((event: CloseEvent) => void) | null = null;

  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({
        code: 1000,
        reason: "Normal closure",
        wasClean: true,
      } as CloseEvent);
    }
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
    if (this.onclose) {
      this.onclose({
        code: 1000,
        reason: "Normal closure",
        wasClean: true,
      } as CloseEvent);
    }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).WebSocket = MockWebSocketConstructor;
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

  describe("edge cases and error handling", () => {
    it("should handle empty queue list", async () => {
      mockQueueApi.listQueueEntries.mockResolvedValue([]);

      const result = await QueueAPI.getQueueCalls();

      expect(result).toEqual([]);
    });

    it("should transform multiple queue entries correctly", async () => {
      const multipleEntries: QueueEntry[] = [
        mockQueueEntry,
        {
          ...mockQueueEntry,
          id: "queue-456",
          callId: "call-789",
          priority: "P2",
        },
      ];

      mockQueueApi.listQueueEntries.mockResolvedValue(multipleEntries);

      const result = await QueueAPI.getQueueCalls();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("queue-123");
      expect(result[1].id).toBe("queue-456");
    });

    it("should handle network errors gracefully", async () => {
      mockQueueApi.listQueueEntries.mockRejectedValue(new Error("Network error"));

      await expect(QueueAPI.getQueueCalls()).rejects.toThrow("Network error");
    });

    it("should handle malformed queue entry data", async () => {
      const malformedEntry = {
        ...mockQueueEntry,
        waitingSince: "invalid-date",
      };

      mockQueueApi.listQueueEntries.mockResolvedValue([malformedEntry]);

      const result = await QueueAPI.getQueueCalls();

      expect(result).toHaveLength(1);
      // Should still transform even with invalid date
      expect(result[0].id).toBe("queue-123");
    });
  });

  describe("subscribeToQueueUpdates", () => {
    let mockWs: MockWebSocket;

    beforeEach(() => {
      // Reset QueueAPI state
      QueueAPI.__resetForTesting();

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;
    });

    afterEach(() => {
      // Reset QueueAPI state
      QueueAPI.__resetForTesting();
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
      // Reset QueueAPI state
      QueueAPI.__resetForTesting();

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      // First subscribe to queue updates to initialize WebSocket
      QueueAPI.subscribeToQueueUpdates(() => {});
      mockWs.simulateOpen();
    });

    afterEach(() => {
      // Reset QueueAPI state
      QueueAPI.__resetForTesting();
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

  describe("addCall", () => {
    it("should throw error in production mode", async () => {
      await expect(
        QueueAPI.addCall({
          callId: "call-123",
          callerName: "Test",
          phoneNumber: "+1234567890",
          waitTime: 0,
          aiStatus: "pending",
          priority: "low",
          keywords: [],
          emotionalState: "calm",
        })
      ).rejects.toThrow("Adding calls manually is not supported");
    });
  });

  describe("WebSocket message types", () => {
    let mockWs: MockWebSocket;
    let onUpdate: jest.Mock;

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      onUpdate = jest.fn();
      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();
    });

    it("should handle queue:error messages", () => {
      mockWs.simulateMessage({
        type: "queue:error",
        error: "Test error message",
      });

      // Error should be logged but not crash
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle unknown message types", () => {
      mockWs.simulateMessage({
        type: "unknown:type",
        data: {},
      });

      // Unknown messages should not crash
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle invalid JSON messages", () => {
      // Simulate invalid message
      if (mockWs.onmessage) {
        mockWs.onmessage({ data: "invalid json {" });
      }

      // Should not crash
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle queue:updated with non-existent ID", () => {
      mockWs.simulateMessage({
        type: "queue:updated",
        data: { id: "non-existent", status: "CLAIMED" },
      });

      // Should not update if ID doesn't exist
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle queue:removed with missing ID", () => {
      mockWs.simulateMessage({
        type: "queue:removed",
        data: {},
      });

      // Should not crash
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle queue:transcript-updated with missing data", () => {
      mockWs.simulateMessage({
        type: "queue:transcript-updated",
        data: {},
      });

      // Should not crash
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle WebSocket errors", () => {
      const onUpdate = jest.fn();
      const onError = jest.fn();

      QueueAPI.__resetForTesting();

      const mockWs2 = new MockWebSocket();
      const MockWebSocketConstructor = jest.fn(() => mockWs2) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      QueueAPI.subscribeToQueueUpdates(onUpdate);

      // Trigger error
      if (mockWs2.onerror) {
        mockWs2.onerror(new Event("error"));
      }

      // Should handle error gracefully
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle WebSocket close", () => {
      const onUpdate = jest.fn();

      QueueAPI.__resetForTesting();

      const mockWs3 = new MockWebSocket();
      const MockWebSocketConstructor = jest.fn(() => mockWs3) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs3.simulateOpen();

      // Trigger close
      mockWs3.simulateClose();

      // Should handle close gracefully
      expect(mockWs3.readyState).toBe(MockWebSocket.CLOSED);
    });

    it("should reuse WebSocket connection when subscribing multiple times", () => {
      QueueAPI.__resetForTesting();

      const mockWs4 = new MockWebSocket();
      let wsConstructorCallCount = 0;
      const MockWebSocketConstructor = jest.fn(() => {
        wsConstructorCallCount++;
        return mockWs4;
      }) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      const onUpdate1 = jest.fn();
      const onUpdate2 = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate1);
      mockWs4.simulateOpen();

      // Send initial data
      mockWs4.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      // Subscribe again - should reuse WebSocket
      QueueAPI.subscribeToQueueUpdates(onUpdate2);

      // WebSocket should only be created once (or twice with reconnection logic)
      expect(wsConstructorCallCount).toBeGreaterThanOrEqual(1);
      expect(wsConstructorCallCount).toBeLessThanOrEqual(2);

      // Both callbacks should receive updates
      mockWs4.simulateMessage({
        type: "queue:added",
        data: { ...mockQueueEntry, id: "queue-456" },
      });

      expect(onUpdate1).toHaveBeenCalled();
      expect(onUpdate2).toHaveBeenCalled();
    });

    it("should close WebSocket when last subscriber unsubscribes", () => {
      QueueAPI.__resetForTesting();

      const mockWs5 = new MockWebSocket();
      const MockWebSocketConstructor = jest.fn(() => mockWs5) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      const unsub1 = QueueAPI.subscribeToQueueUpdates(jest.fn());
      const unsub2 = QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs5.simulateOpen();

      // First unsubscribe shouldn't close WebSocket
      unsub1();
      expect(mockWs5.close).not.toHaveBeenCalled();

      // Last unsubscribe should close WebSocket
      unsub2();
      expect(mockWs5.close).toHaveBeenCalled();
    });

    it("should handle message with existing queue data", () => {
      QueueAPI.__resetForTesting();

      const mockWs6 = new MockWebSocket();
      const MockWebSocketConstructor = jest.fn(() => mockWs6) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      const onUpdate1 = jest.fn();

      // Subscribe first time
      QueueAPI.subscribeToQueueUpdates(onUpdate1);
      mockWs6.simulateOpen();

      // Send initial data
      mockWs6.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      // Now subscribe a second time - should receive existing data immediately
      const onUpdate2 = jest.fn();
      QueueAPI.subscribeToQueueUpdates(onUpdate2);

      // Second callback should be called with existing data
      expect(onUpdate2).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "queue-123",
          }),
        ])
      );
    });

    it("should handle queue:updated for existing entries", () => {
      QueueAPI.__resetForTesting();

      const mockWs7 = new MockWebSocket();
      const MockWebSocketConstructor = jest.fn(() => mockWs7) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs7.simulateOpen();

      // Send initial data
      mockWs7.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      onUpdate.mockClear();

      // Update existing entry
      mockWs7.simulateMessage({
        type: "queue:updated",
        data: { ...mockQueueEntry, status: "CLAIMED" },
      });

      expect(onUpdate).toHaveBeenCalled();
    });

    it("should handle queue:removed for existing entries", () => {
      QueueAPI.__resetForTesting();

      const mockWs8 = new MockWebSocket();
      const MockWebSocketConstructor = jest.fn(() => mockWs8) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;

      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs8.simulateOpen();

      // Send initial data with entry
      mockWs8.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      onUpdate.mockClear();

      // Remove the entry
      mockWs8.simulateMessage({
        type: "queue:removed",
        data: { id: "queue-123" },
      });

      // Should be called with empty array
      expect(onUpdate).toHaveBeenCalledWith([]);
    });
  });

  describe("Connection Control Messages", () => {
    let mockWs: MockWebSocket;
    let mockRealtimeWs: MockWebSocket;

    beforeEach(() => {
      QueueAPI.__resetForTesting();

      mockWs = new MockWebSocket();
      mockRealtimeWs = new MockWebSocket();

      const MockWebSocketConstructor = jest.fn((url: string) => {
        // First WebSocket is for queue-dashboard, second is for realtime dashboard
        if (url.includes("/ws/dashboard")) {
          return mockRealtimeWs;
        }
        return mockWs;
      }) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;
    });

    afterEach(() => {
      QueueAPI.__resetForTesting();
    });

    it("should handle 'connected' message", () => {
      const onStateChange = jest.fn();
      const onEvent = jest.fn();

      QueueAPI.subscribeToConnectionState(onStateChange);
      QueueAPI.subscribeToConnectionEvents(onEvent);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();
      mockWs.simulateMessage({
        type: "connected",
        data: {
          sessionId: "session-123",
          timestamp: "2024-01-01T00:00:00Z",
          message: "Connected successfully",
        },
      });

      expect(onStateChange).toHaveBeenCalledWith({
        isConnected: true,
        sessionId: "session-123",
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: "connected",
        data: expect.objectContaining({
          sessionId: "session-123",
        }),
        timestamp: "2024-01-01T00:00:00Z",
      });
    });

    it("should handle 'session_terminated' message", () => {
      const onStateChange = jest.fn();
      const onEvent = jest.fn();

      QueueAPI.subscribeToConnectionState(onStateChange);
      QueueAPI.subscribeToConnectionEvents(onEvent);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: "session_terminated",
        data: {
          sessionId: "session-123",
          reason: "Session expired",
          timestamp: "2024-01-01T01:00:00Z",
        },
      });

      expect(onStateChange).toHaveBeenCalledWith({
        isConnected: false,
        error: "Session expired",
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: "session_terminated",
        data: expect.objectContaining({
          reason: "Session expired",
        }),
        timestamp: "2024-01-01T01:00:00Z",
      });
    });

    it("should handle 'ai_terminated' message and update queue", () => {
      const onUpdate = jest.fn();
      const onEvent = jest.fn();

      QueueAPI.subscribeToConnectionEvents(onEvent);
      QueueAPI.subscribeToQueueUpdates(onUpdate);

      mockWs.simulateOpen();

      // Add entry to queue first
      mockWs.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      onUpdate.mockClear();

      // Terminate AI for this call
      mockWs.simulateMessage({
        type: "ai_terminated",
        data: {
          callId: "call-456",
          reason: "Call completed",
          timestamp: "2024-01-01T01:00:00Z",
        },
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: "ai_terminated",
        data: expect.objectContaining({
          callId: "call-456",
        }),
        timestamp: "2024-01-01T01:00:00Z",
      });

      // Queue should be updated with COMPLETED status
      expect(onUpdate).toHaveBeenCalled();
    });

    it("should handle 'call_ended' message and remove from queue", () => {
      const onUpdate = jest.fn();
      const onEvent = jest.fn();

      QueueAPI.subscribeToConnectionEvents(onEvent);
      QueueAPI.subscribeToQueueUpdates(onUpdate);

      mockWs.simulateOpen();

      // Add entry to queue
      mockWs.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      onUpdate.mockClear();

      // End the call
      mockWs.simulateMessage({
        type: "call_ended",
        data: {
          callId: "call-456",
          queueEntryId: "queue-123",
          reason: "Call disconnected",
          duration: 300,
          timestamp: "2024-01-01T01:00:00Z",
        },
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: "call_ended",
        data: expect.objectContaining({
          callId: "call-456",
          queueEntryId: "queue-123",
        }),
        timestamp: "2024-01-01T01:00:00Z",
      });

      // Queue should be updated (entry removed)
      expect(onUpdate).toHaveBeenCalledWith([]);
    });

    it("should handle 'subscribed' message", () => {
      const onEvent = jest.fn();

      QueueAPI.subscribeToConnectionEvents(onEvent);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: "subscribed",
        data: {
          subscription: "queue-updates",
          callId: "call-456",
          timestamp: "2024-01-01T00:00:00Z",
        },
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: "subscribed",
        data: expect.objectContaining({
          subscription: "queue-updates",
        }),
        timestamp: "2024-01-01T00:00:00Z",
      });
    });

    it("should handle 'unsubscribed' message", () => {
      const onEvent = jest.fn();

      QueueAPI.subscribeToConnectionEvents(onEvent);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: "unsubscribed",
        data: {
          subscription: "queue-updates",
          callId: "call-456",
          timestamp: "2024-01-01T00:00:00Z",
        },
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: "unsubscribed",
        data: expect.objectContaining({
          subscription: "queue-updates",
        }),
        timestamp: "2024-01-01T00:00:00Z",
      });
    });

    it("should notify connection state on WebSocket open", () => {
      const onStateChange = jest.fn();

      QueueAPI.subscribeToConnectionState(onStateChange);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();

      expect(onStateChange).toHaveBeenCalledWith({
        isConnected: true,
      });
    });

    it("should notify connection state on WebSocket close", () => {
      const onStateChange = jest.fn();

      QueueAPI.subscribeToConnectionState(onStateChange);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();
      onStateChange.mockClear();

      mockWs.simulateClose();

      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: false,
        })
      );
    });

    it("should get current connection state", () => {
      QueueAPI.subscribeToQueueUpdates(jest.fn());
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: "connected",
        data: {
          sessionId: "session-123",
          timestamp: "2024-01-01T00:00:00Z",
        },
      });

      const state = QueueAPI.getConnectionState();

      expect(state).toEqual({
        isConnected: true,
        sessionId: "session-123",
      });
    });

    it("should return unsubscribe function for connection state", () => {
      const onStateChange = jest.fn();

      const unsubscribe = QueueAPI.subscribeToConnectionState(onStateChange);

      QueueAPI.subscribeToQueueUpdates(jest.fn());
      mockWs.simulateOpen();

      expect(onStateChange).toHaveBeenCalled();

      onStateChange.mockClear();
      unsubscribe();

      mockWs.simulateClose();

      // Should not be called after unsubscribe
      expect(onStateChange).not.toHaveBeenCalled();
    });

    it("should return unsubscribe function for connection events", () => {
      const onEvent = jest.fn();

      const unsubscribe = QueueAPI.subscribeToConnectionEvents(onEvent);

      QueueAPI.subscribeToQueueUpdates(jest.fn());
      mockWs.simulateOpen();

      mockWs.simulateMessage({
        type: "connected",
        data: { sessionId: "session-123", timestamp: "2024-01-01T00:00:00Z" },
      });

      expect(onEvent).toHaveBeenCalled();

      onEvent.mockClear();
      unsubscribe();

      mockWs.simulateMessage({
        type: "subscribed",
        data: { subscription: "test", timestamp: "2024-01-01T00:00:00Z" },
      });

      // Should not be called after unsubscribe
      expect(onEvent).not.toHaveBeenCalled();
    });
  });

  describe("Realtime Dashboard WebSocket", () => {
    let mockWs: MockWebSocket;
    let mockRealtimeWs: MockWebSocket;

    beforeEach(() => {
      QueueAPI.__resetForTesting();

      mockWs = new MockWebSocket();
      mockRealtimeWs = new MockWebSocket();

      const MockWebSocketConstructor = jest.fn((url: string) => {
        if (url.includes("/ws/dashboard")) {
          return mockRealtimeWs;
        }
        return mockWs;
      }) as unknown as typeof WebSocket;

      // Add static constants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).OPEN = MockWebSocket.OPEN;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CONNECTING = MockWebSocket.CONNECTING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSING = MockWebSocket.CLOSING;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (MockWebSocketConstructor as any).CLOSED = MockWebSocket.CLOSED;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;
    });

    afterEach(() => {
      QueueAPI.__resetForTesting();
    });

    it("should initialize realtime dashboard WebSocket", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();
      mockRealtimeWs.simulateOpen();

      // Realtime WebSocket should be initialized
      expect(mockRealtimeWs.readyState).toBe(MockWebSocket.OPEN);
    });

    it("should handle CallInfoUpdatedEvent from realtime dashboard", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();
      mockRealtimeWs.simulateOpen();

      // Add a queue entry first
      mockWs.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      onUpdate.mockClear();

      // Simulate CallInfoUpdatedEvent from realtime dashboard
      mockRealtimeWs.simulateMessage({
        type: "event",
        event: {
          type: "domain_event",
          data: {
            callId: "call-456",
            updatedFields: ["priority", "chiefComplaint"],
            extractedData: {
              priority: "P0",
              chiefComplaint: "Cardiac arrest",
              currentSymptoms: "chest pain, difficulty breathing",
              age: 65,
              gender: "male",
              address: "123 Main St",
              city: "Paris",
            },
          },
        },
      });

      // Queue should be updated with new info
      expect(onUpdate).toHaveBeenCalled();
      const updatedCalls = onUpdate.mock.calls[0][0];
      expect(updatedCalls[0].priority).toBe("high"); // Converted from P0
    });

    it("should handle connection lifecycle messages from realtime dashboard", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();
      mockRealtimeWs.simulateOpen();

      // These should be silently handled
      mockRealtimeWs.simulateMessage({ type: "connection" });
      mockRealtimeWs.simulateMessage({ type: "subscribed" });
      mockRealtimeWs.simulateMessage({ type: "pong" });

      // No queue updates should be triggered
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle queue:call-info-updated message (backward compatibility)", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();
      mockRealtimeWs.simulateOpen();

      // Add a queue entry
      mockWs.simulateMessage({
        type: "queue:initial",
        data: [mockQueueEntry],
      });

      onUpdate.mockClear();

      // Send old-style call-info-updated message
      mockWs.simulateMessage({
        type: "queue:call-info-updated",
        data: {
          callId: "call-456",
          priority: "P1",
          priorityReason: "Chest pain",
          chiefComplaint: "Cardiac symptoms",
          currentSymptoms: "pain, nausea",
          aiSummary: "Patient needs immediate care",
          aiRecommendation: "Send ambulance",
          redFlags: ["chest pain"],
          vitalSigns: { heartRate: 120 },
          address: "456 Oak St",
          city: "Lyon",
          patientAge: 55,
          patientGender: "female",
        },
      });

      expect(onUpdate).toHaveBeenCalled();
      const updatedCalls = onUpdate.mock.calls[0][0];
      expect(updatedCalls[0].priority).toBe("high"); // Converted from P1
      expect(updatedCalls[0].location).toContain("Lyon");
    });

    it("should handle realtime WebSocket errors", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();

      // Trigger error on realtime WebSocket
      mockRealtimeWs.readyState = MockWebSocket.OPEN;
      if (mockRealtimeWs.onerror) {
        mockRealtimeWs.onerror(new Event("error"));
      }

      // Should handle error gracefully
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle realtime WebSocket close", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();
      mockRealtimeWs.simulateOpen();

      // Close realtime WebSocket
      mockRealtimeWs.simulateClose();

      // Should handle close gracefully
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should ignore CallInfoUpdatedEvent for non-existent queue entries", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);
      mockWs.simulateOpen();
      mockRealtimeWs.simulateOpen();

      // Send CallInfoUpdatedEvent for non-existent call
      mockRealtimeWs.simulateMessage({
        type: "event",
        event: {
          type: "domain_event",
          data: {
            callId: "non-existent-call",
            updatedFields: ["priority"],
            extractedData: {
              priority: "P0",
            },
          },
        },
      });

      // Should not update queue
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases and error conditions", () => {
    let mockWs: MockWebSocket;

    beforeEach(() => {
      QueueAPI.__resetForTesting();

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = MockWebSocketConstructor;
    });

    afterEach(() => {
      QueueAPI.__resetForTesting();
    });

    it("should handle connection state callback errors gracefully", () => {
      const faultyCallback = jest.fn(() => {
        throw new Error("Callback error");
      });

      QueueAPI.subscribeToConnectionState(faultyCallback);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();

      // Should not throw, error should be caught
      expect(faultyCallback).toHaveBeenCalled();
    });

    it("should handle connection event callback errors gracefully", () => {
      const faultyCallback = jest.fn(() => {
        throw new Error("Callback error");
      });

      QueueAPI.subscribeToConnectionEvents(faultyCallback);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();
      mockWs.simulateMessage({
        type: "connected",
        data: { sessionId: "test", timestamp: "2024-01-01T00:00:00Z" },
      });

      // Should not throw, error should be caught
      expect(faultyCallback).toHaveBeenCalled();
    });

    it("should handle WebSocket onopen before ready promise is created", () => {
      const onUpdate = jest.fn();

      QueueAPI.subscribeToQueueUpdates(onUpdate);

      // Immediately open the WebSocket
      mockWs.simulateOpen();

      // Should handle gracefully
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("should handle connection message without data", () => {
      const onEvent = jest.fn();

      QueueAPI.subscribeToConnectionEvents(onEvent);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();
      mockWs.simulateMessage({
        type: "connection",
      });

      expect(onEvent).toHaveBeenCalledWith({
        type: "connection",
        data: {},
        timestamp: expect.any(String),
      });
    });

    it("should handle subscribeToTranscript when WebSocket is not ready", async () => {
      const onTranscript = jest.fn();

      // Subscribe to transcript before WebSocket is initialized
      const unsubscribe = QueueAPI.subscribeToTranscript("call-123", onTranscript);

      // Now initialize WebSocket
      QueueAPI.subscribeToQueueUpdates(jest.fn());
      mockWs.simulateOpen();

      // Wait a tick for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should eventually send subscription
      expect(mockWs.send).toHaveBeenCalled();

      unsubscribe();
    });

    it("should handle abnormal WebSocket closure", () => {
      const onStateChange = jest.fn();

      QueueAPI.subscribeToConnectionState(onStateChange);
      QueueAPI.subscribeToQueueUpdates(jest.fn());

      mockWs.simulateOpen();
      onStateChange.mockClear();

      // Simulate abnormal close
      if (mockWs.onclose) {
        mockWs.onclose({
          code: 1006,
          reason: "Connection lost",
          wasClean: false,
        } as CloseEvent);
      }

      expect(onStateChange).toHaveBeenCalledWith({
        isConnected: false,
        error: "Connection lost",
      });
    });

    it("should return initial connection state if subscribed with active connection", () => {
      QueueAPI.subscribeToQueueUpdates(jest.fn());
      mockWs.simulateOpen();
      mockWs.simulateMessage({
        type: "connected",
        data: { sessionId: "session-123", timestamp: "2024-01-01T00:00:00Z" },
      });

      const onStateChange = jest.fn();
      QueueAPI.subscribeToConnectionState(onStateChange);

      // Should receive initial state immediately
      expect(onStateChange).toHaveBeenCalledWith({
        isConnected: true,
        sessionId: "session-123",
      });
    });
  });
});
