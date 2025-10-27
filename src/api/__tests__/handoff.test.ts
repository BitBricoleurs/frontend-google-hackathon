import { takeControl } from "../handoff";
import { api } from "@/lib/api-client";
import type { TakeControlResponse } from "../handoff";

jest.mock("@/lib/api-client");

const mockApi = api as jest.Mocked<typeof api>;

describe("Handoff API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("takeControl", () => {
    it("should successfully take control of a call", async () => {
      const mockResponse: TakeControlResponse = {
        success: true,
        handoffId: "handoff-123",
        message: "Control taken successfully",
        aiTerminated: true,
      };

      mockApi.post.mockResolvedValue({ data: mockResponse } as never);

      const result = await takeControl("call-123", "operator-456", "Emergency intervention");

      expect(mockApi.post).toHaveBeenCalledWith("/handoff/take-control", {
        callId: "call-123",
        operatorId: "operator-456",
        reason: "Emergency intervention",
      });

      expect(result).toEqual(mockResponse);
    });

    it("should take control without optional reason", async () => {
      const mockResponse: TakeControlResponse = {
        success: true,
        handoffId: "handoff-789",
        message: "Control taken successfully",
        aiTerminated: true,
      };

      mockApi.post.mockResolvedValue({ data: mockResponse } as never);

      const result = await takeControl("call-456", "operator-789");

      expect(mockApi.post).toHaveBeenCalledWith("/handoff/take-control", {
        callId: "call-456",
        operatorId: "operator-789",
        reason: undefined,
      });

      expect(result).toEqual(mockResponse);
    });

    it("should handle API errors", async () => {
      const mockError = new Error("Failed to take control");
      mockApi.post.mockRejectedValue(mockError);

      await expect(takeControl("call-123", "operator-456")).rejects.toThrow(
        "Failed to take control"
      );
    });
  });
});
