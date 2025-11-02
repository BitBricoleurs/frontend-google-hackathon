import {
  mapPriorityToUI,
  mapPriorityToBackend,
  mapStatusToAIStatus,
  queueEntryToQueueCall,
  type QueueEntry,
} from "../queue";

describe("Queue Type Helpers", () => {
  describe("mapPriorityToUI", () => {
    it("should map P0 to high", () => {
      expect(mapPriorityToUI("P0")).toBe("high");
    });

    it("should map P1 to high", () => {
      expect(mapPriorityToUI("P1")).toBe("high");
    });

    it("should map P2 to medium", () => {
      expect(mapPriorityToUI("P2")).toBe("medium");
    });

    it("should map P3 to low", () => {
      expect(mapPriorityToUI("P3")).toBe("low");
    });

    it("should default to low for unknown priority", () => {
      expect(mapPriorityToUI("UNKNOWN" as never)).toBe("low");
    });
  });

  describe("mapPriorityToBackend", () => {
    it("should map high to P0", () => {
      expect(mapPriorityToBackend("high")).toBe("P0");
    });

    it("should map medium to P2", () => {
      expect(mapPriorityToBackend("medium")).toBe("P2");
    });

    it("should map low to P3", () => {
      expect(mapPriorityToBackend("low")).toBe("P3");
    });

    it("should default to P3 for unknown priority", () => {
      expect(mapPriorityToBackend("unknown" as never)).toBe("P3");
    });
  });

  describe("mapStatusToAIStatus", () => {
    it("should map WAITING to connected", () => {
      expect(mapStatusToAIStatus("WAITING")).toBe("connected");
    });

    it("should map CLAIMED to connected", () => {
      expect(mapStatusToAIStatus("CLAIMED")).toBe("connected");
    });

    it("should map IN_PROGRESS to connected", () => {
      expect(mapStatusToAIStatus("IN_PROGRESS")).toBe("connected");
    });

    it("should map COMPLETED to pending", () => {
      expect(mapStatusToAIStatus("COMPLETED")).toBe("pending");
    });

    it("should map ABANDONED to pending", () => {
      expect(mapStatusToAIStatus("ABANDONED")).toBe("pending");
    });

    it("should default to pending for unknown status", () => {
      expect(mapStatusToAIStatus("UNKNOWN" as never)).toBe("pending");
    });
  });

  describe("queueEntryToQueueCall", () => {
    it("should convert basic queue entry to queue call", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P2",
        chiefComplaint: "Headache",
        status: "WAITING",
        waitingSince: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.id).toBe("queue-123");
      expect(result.callId).toBe("call-456");
      expect(result.priority).toBe("medium");
      expect(result.aiStatus).toBe("connected");
      expect(result.waitTime).toBeGreaterThanOrEqual(299); // ~5 minutes in seconds
      expect(result.waitTime).toBeLessThanOrEqual(301);
    });

    it("should set panic emotional state when red flags present", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P1",
        chiefComplaint: "Chest pain",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
        redFlags: ["chest pain", "difficulty breathing"],
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.emotionalState).toBe("panic");
    });

    it("should set distress emotional state for P0/P1 priority", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P0",
        chiefComplaint: "Severe trauma",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.emotionalState).toBe("distress");
    });

    it("should set anxious emotional state for P2 priority", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P2",
        chiefComplaint: "Moderate pain",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.emotionalState).toBe("anxious");
    });

    it("should set calm emotional state for P3 priority", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P3",
        chiefComplaint: "General inquiry",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.emotionalState).toBe("calm");
    });

    it("should include key symptoms as keywords", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P2",
        chiefComplaint: "Multiple symptoms",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
        keySymptoms: ["fever", "cough", "fatigue"],
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.keywords).toEqual(["fever", "cough", "fatigue"]);
    });

    it("should handle missing optional fields", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P3",
        chiefComplaint: "Simple inquiry",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.callerName).toBe("Unknown Caller");
      expect(result.keywords).toEqual([]);
    });

    it("should use location as caller name when available", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P2",
        chiefComplaint: "Inquiry",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
        location: "San Francisco, CA",
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.callerName).toBe("San Francisco, CA");
    });

    it("should use callId as phone number proxy", () => {
      const mockEntry: QueueEntry = {
        id: "queue-123",
        callId: "call-456",
        priority: "P2",
        chiefComplaint: "Inquiry",
        status: "WAITING",
        waitingSince: new Date().toISOString(),
      };

      const result = queueEntryToQueueCall(mockEntry);

      expect(result.phoneNumber).toBe("call-456");
    });
  });
});
