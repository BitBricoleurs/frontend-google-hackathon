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
});
