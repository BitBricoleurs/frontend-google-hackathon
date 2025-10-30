import {
  getTranscript,
  getFormattedTranscript,
  getTranscriptStats,
  retryTranscriptFetch,
  searchTranscripts,
} from "../transcript";
import { api } from "@/lib/api-client";
import type {
  TranscriptData,
  FormattedTranscriptData,
  TranscriptStats,
  SearchTranscriptsResponse,
} from "../transcript";

jest.mock("@/lib/api-client");

const mockApi = api as jest.Mocked<typeof api>;

describe("Transcript API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTranscript", () => {
    it("should fetch transcript data successfully", async () => {
      const mockData: TranscriptData = {
        callId: "call-123",
        status: "completed",
        startedAt: "2025-01-01T10:00:00Z",
        endedAt: "2025-01-01T10:15:00Z",
        duration: 900,
        basicTranscript: "Patient: I have a headache\nOperator: How long have you had it?",
        structuredTranscript: { messages: [] },
        patient: { name: "John Doe" },
      };

      mockApi.get.mockResolvedValue({ data: { success: true, data: mockData } } as never);

      const result = await getTranscript("call-123");

      expect(mockApi.get).toHaveBeenCalledWith("/transcripts/call-123");
      expect(result).toEqual(mockData);
    });
  });

  describe("getFormattedTranscript", () => {
    it("should fetch formatted transcript with messages", async () => {
      const mockData: FormattedTranscriptData = {
        callId: "call-456",
        status: "completed",
        startedAt: "2025-01-01T11:00:00Z",
        endedAt: "2025-01-01T11:20:00Z",
        duration: 1200,
        messages: [
          {
            index: 0,
            timestamp: "2025-01-01T11:00:00Z",
            speaker: "Patient",
            text: "I have chest pain",
            confidence: 0.95,
          },
          {
            index: 1,
            timestamp: "2025-01-01T11:00:15Z",
            speaker: "Operator",
            text: "When did it start?",
            confidence: 0.98,
          },
        ],
        patient: { name: "Jane Doe" },
      };

      mockApi.get.mockResolvedValue({ data: { success: true, data: mockData } } as never);

      const result = await getFormattedTranscript("call-456");

      expect(mockApi.get).toHaveBeenCalledWith("/transcripts/call-456/formatted");
      expect(result).toEqual(mockData);
      expect(result.messages).toHaveLength(2);
    });
  });

  describe("getTranscriptStats", () => {
    it("should fetch transcript statistics", async () => {
      const mockStats: TranscriptStats = {
        callId: "call-789",
        hasTranscript: true,
        hasStructuredTranscript: true,
        wordCount: 450,
        lineCount: 25,
        characterCount: 2500,
        estimatedReadingTimeMinutes: 2,
        duration: 900,
      };

      mockApi.get.mockResolvedValue({ data: { success: true, data: mockStats } } as never);

      const result = await getTranscriptStats("call-789");

      expect(mockApi.get).toHaveBeenCalledWith("/transcripts/call-789/stats");
      expect(result).toEqual(mockStats);
    });
  });

  describe("retryTranscriptFetch", () => {
    it("should retry fetching transcript successfully", async () => {
      const mockResponse = {
        success: true,
        message: "Transcript fetch retry initiated",
      };

      mockApi.post.mockResolvedValue({ data: mockResponse } as never);

      const result = await retryTranscriptFetch("call-999");

      expect(mockApi.post).toHaveBeenCalledWith("/transcripts/call-999/retry");
      expect(result).toEqual(mockResponse);
    });

    it("should handle retry failures", async () => {
      const mockError = new Error("Retry failed");
      mockApi.post.mockRejectedValue(mockError);

      await expect(retryTranscriptFetch("call-999")).rejects.toThrow("Retry failed");
    });
  });

  describe("searchTranscripts", () => {
    it("should search transcripts with default pagination", async () => {
      const mockResponse: SearchTranscriptsResponse = {
        success: true,
        data: [
          {
            callId: "call-111",
            status: "completed",
            startedAt: "2025-01-01T09:00:00Z",
            endedAt: "2025-01-01T09:30:00Z",
            patient: { name: "Alice" },
            priority: "P1",
            chiefComplaint: "Chest pain",
            transcriptExcerpt: "...chest pain radiating to left arm...",
          },
        ],
        count: 1,
        keyword: "chest pain",
      };

      mockApi.get.mockResolvedValue({ data: mockResponse } as never);

      const result = await searchTranscripts("chest pain");

      expect(mockApi.get).toHaveBeenCalledWith(
        "/transcripts/search?keyword=chest%20pain&limit=50&offset=0"
      );
      expect(result).toEqual(mockResponse);
      expect(result.count).toBe(1);
    });

    it("should search transcripts with custom pagination", async () => {
      const mockResponse: SearchTranscriptsResponse = {
        success: true,
        data: [],
        count: 0,
        keyword: "headache",
      };

      mockApi.get.mockResolvedValue({ data: mockResponse } as never);

      const result = await searchTranscripts("headache", 10, 20);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/transcripts/search?keyword=headache&limit=10&offset=20"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle special characters in search keyword", async () => {
      const mockResponse: SearchTranscriptsResponse = {
        success: true,
        data: [],
        count: 0,
        keyword: "test & query",
      };

      mockApi.get.mockResolvedValue({ data: mockResponse } as never);

      await searchTranscripts("test & query");

      expect(mockApi.get).toHaveBeenCalledWith(
        "/transcripts/search?keyword=test%20%26%20query&limit=50&offset=0"
      );
    });
  });
});
