/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { QueueProvider, useQueue } from "../queue-context";
import { QueueAPI } from "@/services/queue-api";
import type { QueueCall } from "@/types/queue";

jest.mock("@/services/queue-api");

const mockQueueAPI = QueueAPI as jest.Mocked<typeof QueueAPI>;

describe("QueueContext", () => {
  const mockCall: QueueCall = {
    id: "call-1",
    callId: "call-id-1",
    callerName: "Test Caller",
    phoneNumber: "+1234567890",
    waitTime: 120,
    aiStatus: "connected",
    priority: "high",
    keywords: ["chest pain"],
    emotionalState: "distress",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueueAPI.getQueueCalls.mockResolvedValue([mockCall]);
    mockQueueAPI.getQueueStats.mockResolvedValue({
      totalCalls: 1,
      averageWaitTime: 120,
      aiConnected: 1,
      aiConnecting: 0,
      pending: 0,
      highPriority: 1,
    });
    mockQueueAPI.subscribeToQueueUpdates.mockReturnValue(() => {});
  });

  function TestComponent() {
    const { calls, stats, isLoading, error } = useQueue();
    return (
      <div>
        <div data-testid="loading">{isLoading ? "Loading" : "Not Loading"}</div>
        <div data-testid="error">{error || "No Error"}</div>
        <div data-testid="calls-count">{calls.length}</div>
        <div data-testid="stats">{stats ? JSON.stringify(stats) : "No Stats"}</div>
      </div>
    );
  }

  it("should throw error when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow("useQueue must be used within a QueueProvider");

    consoleError.mockRestore();
  });

  it("should provide queue context to children", async () => {
    render(
      <QueueProvider>
        <TestComponent />
      </QueueProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
    });

    expect(mockQueueAPI.getQueueCalls).toHaveBeenCalled();
    expect(mockQueueAPI.getQueueStats).toHaveBeenCalled();
    expect(mockQueueAPI.subscribeToQueueUpdates).toHaveBeenCalled();
  });

  it("should handle empty calls list", async () => {
    mockQueueAPI.getQueueCalls.mockResolvedValue([]);
    mockQueueAPI.getQueueStats.mockResolvedValue({
      totalCalls: 0,
      averageWaitTime: 0,
      aiConnected: 0,
      aiConnecting: 0,
      pending: 0,
      highPriority: 0,
    });

    render(
      <QueueProvider>
        <TestComponent />
      </QueueProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("calls-count")).toHaveTextContent("0");
    });
  });

  it("should handle multiple calls", async () => {
    const multipleCalls: QueueCall[] = [
      mockCall,
      { ...mockCall, id: "call-2", callId: "call-id-2" },
      { ...mockCall, id: "call-3", callId: "call-id-3" },
    ];

    mockQueueAPI.getQueueCalls.mockResolvedValue(multipleCalls);

    render(
      <QueueProvider>
        <TestComponent />
      </QueueProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("calls-count")).toHaveTextContent("3");
    });
  });

  it("should handle API errors", async () => {
    mockQueueAPI.getQueueCalls.mockRejectedValue(new Error("API Error"));

    render(
      <QueueProvider>
        <TestComponent />
      </QueueProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("API Error");
    });
  });

  it("should update stats correctly", async () => {
    const stats = {
      totalCalls: 5,
      averageWaitTime: 150,
      aiConnected: 3,
      aiConnecting: 1,
      pending: 1,
      highPriority: 2,
    };

    mockQueueAPI.getQueueStats.mockResolvedValue(stats);

    render(
      <QueueProvider>
        <TestComponent />
      </QueueProvider>
    );

    await waitFor(() => {
      const statsData = screen.getByTestId("stats").textContent;
      expect(statsData).toContain("5");
    });
  });
});
