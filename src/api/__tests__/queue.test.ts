import {
  listQueueEntries,
  getQueueStats,
  getQueueEntry,
  claimQueueEntry,
  updateQueueStatus,
} from "../queue";
import { api } from "@/lib/api-client";
import type { QueueEntry, QueueStats } from "@/types/queue";

jest.mock("@/lib/api-client");

const mockApi = api as jest.Mocked<typeof api>;

describe("Queue API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockQueueEntry: QueueEntry = {
    id: "queue-123",
    callId: "call-456",
    priority: "P1",
    chiefComplaint: "Chest pain",
    patientAge: 45,
    patientGender: "M",
    location: "New York",
    aiSummary: "Patient experiencing chest pain",
    aiRecommendation: "Urgent evaluation needed",
    keySymptoms: ["chest pain", "shortness of breath"],
    redFlags: ["chest pain"],
    status: "WAITING",
    waitingSince: "2025-01-01T10:00:00Z",
  };

  describe("listQueueEntries", () => {
    it("should fetch all queue entries without filters", async () => {
      const mockEntries = [mockQueueEntry];

      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockEntries },
      } as never);

      const result = await listQueueEntries();

      expect(mockApi.get).toHaveBeenCalledWith("/queue/");
      expect(result).toEqual(mockEntries);
    });

    it("should fetch queue entries with status filter", async () => {
      const mockEntries = [mockQueueEntry];

      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockEntries },
      } as never);

      const result = await listQueueEntries({ status: "WAITING" });

      expect(mockApi.get).toHaveBeenCalledWith("/queue/?status=WAITING");
      expect(result).toEqual(mockEntries);
    });

    it("should fetch queue entries with priority filter", async () => {
      const mockEntries = [mockQueueEntry];

      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockEntries },
      } as never);

      const result = await listQueueEntries({ priority: "P1" });

      expect(mockApi.get).toHaveBeenCalledWith("/queue/?priority=P1");
      expect(result).toEqual(mockEntries);
    });

    it("should fetch queue entries with both status and priority filters", async () => {
      const mockEntries = [mockQueueEntry];

      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockEntries },
      } as never);

      const result = await listQueueEntries({ status: "WAITING", priority: "P1" });

      expect(mockApi.get).toHaveBeenCalledWith("/queue/?status=WAITING&priority=P1");
      expect(result).toEqual(mockEntries);
    });
  });

  describe("getQueueStats", () => {
    it("should fetch queue statistics", async () => {
      const mockStats: QueueStats = {
        success: true,
        data: {
          total: 25,
          byStatus: {
            waiting: 10,
            claimed: 5,
            inProgress: 8,
            completed: 2,
            abandoned: 0,
          },
          avgWaitTimeSeconds: 180,
        },
      };

      mockApi.get.mockResolvedValue({ data: mockStats } as never);

      const result = await getQueueStats();

      expect(mockApi.get).toHaveBeenCalledWith("/queue/stats");
      expect(result).toEqual(mockStats);
    });
  });

  describe("getQueueEntry", () => {
    it("should fetch a specific queue entry by ID", async () => {
      mockApi.get.mockResolvedValue({
        data: { success: true, data: mockQueueEntry },
      } as never);

      const result = await getQueueEntry("queue-123");

      expect(mockApi.get).toHaveBeenCalledWith("/queue/queue-123");
      expect(result).toEqual(mockQueueEntry);
    });

    it("should handle errors when queue entry not found", async () => {
      mockApi.get.mockRejectedValue(new Error("Queue entry not found"));

      await expect(getQueueEntry("invalid-id")).rejects.toThrow("Queue entry not found");
    });
  });

  describe("claimQueueEntry", () => {
    it("should claim a queue entry successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          id: "queue-123",
          callId: "call-456",
          status: "CLAIMED" as const,
          claimedBy: "operator-789",
          claimedAt: "2025-01-01T10:05:00Z",
        },
        message: "Queue entry claimed successfully",
      };

      mockApi.post.mockResolvedValue({ data: mockResponse } as never);

      const result = await claimQueueEntry("queue-123", "operator-789");

      expect(mockApi.post).toHaveBeenCalledWith("/queue/queue-123/claim", {
        operatorId: "operator-789",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle claim conflicts", async () => {
      mockApi.post.mockRejectedValue(new Error("Queue entry already claimed"));

      await expect(claimQueueEntry("queue-123", "operator-789")).rejects.toThrow(
        "Queue entry already claimed"
      );
    });
  });

  describe("updateQueueStatus", () => {
    it("should update queue entry status to IN_PROGRESS", async () => {
      const mockResponse = {
        success: true,
        data: {
          id: "queue-123",
          status: "IN_PROGRESS" as const,
        },
        message: "Status updated successfully",
      };

      mockApi.patch.mockResolvedValue({ data: mockResponse } as never);

      const result = await updateQueueStatus("queue-123", "IN_PROGRESS");

      expect(mockApi.patch).toHaveBeenCalledWith("/queue/queue-123/status", {
        status: "IN_PROGRESS",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should update queue entry status to COMPLETED", async () => {
      const mockResponse = {
        success: true,
        data: {
          id: "queue-123",
          status: "COMPLETED" as const,
        },
        message: "Status updated successfully",
      };

      mockApi.patch.mockResolvedValue({ data: mockResponse } as never);

      const result = await updateQueueStatus("queue-123", "COMPLETED");

      expect(mockApi.patch).toHaveBeenCalledWith("/queue/queue-123/status", {
        status: "COMPLETED",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle invalid status transitions", async () => {
      mockApi.patch.mockRejectedValue(new Error("Invalid status transition"));

      await expect(updateQueueStatus("queue-123", "COMPLETED")).rejects.toThrow(
        "Invalid status transition"
      );
    });
  });
});
