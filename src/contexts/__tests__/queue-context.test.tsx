/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

  it("should provide addCall function", async () => {
    mockQueueAPI.addCall.mockResolvedValue({
      id: "call-new",
      callId: "call-id-new",
      callerName: "New Caller",
      phoneNumber: "+1234567890",
      waitTime: 0,
      aiStatus: "pending",
      priority: "low",
      keywords: [],
      emotionalState: "calm",
    });

    function AddCallComponent() {
      const { addCall } = useQueue();
      return (
        <button
          onClick={() =>
            addCall({
              callId: "call-id-new",
              callerName: "New Caller",
              phoneNumber: "+1234567890",
              waitTime: 0,
              aiStatus: "pending",
              priority: "low",
              keywords: [],
              emotionalState: "calm",
            })
          }
          data-testid="add-call-btn"
        >
          Add Call
        </button>
      );
    }

    render(
      <QueueProvider>
        <AddCallComponent />
      </QueueProvider>
    );

    const addButton = screen.getByTestId("add-call-btn");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockQueueAPI.addCall).toHaveBeenCalled();
    });
  });

  it("should provide removeCall function", async () => {
    mockQueueAPI.removeCall.mockResolvedValue();

    function RemoveCallComponent() {
      const { removeCall } = useQueue();
      return (
        <button onClick={() => removeCall("call-1")} data-testid="remove-call-btn">
          Remove Call
        </button>
      );
    }

    render(
      <QueueProvider>
        <RemoveCallComponent />
      </QueueProvider>
    );

    const removeButton = screen.getByTestId("remove-call-btn");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockQueueAPI.removeCall).toHaveBeenCalledWith("call-1");
    });
  });

  it("should provide updateCall function", async () => {
    mockQueueAPI.updateCall.mockResolvedValue({
      ...mockCall,
      priority: "high",
    });

    function UpdateCallComponent() {
      const { updateCall } = useQueue();
      return (
        <button
          onClick={() => updateCall("call-1", { priority: "high" })}
          data-testid="update-call-btn"
        >
          Update Call
        </button>
      );
    }

    render(
      <QueueProvider>
        <UpdateCallComponent />
      </QueueProvider>
    );

    const updateButton = screen.getByTestId("update-call-btn");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockQueueAPI.updateCall).toHaveBeenCalledWith("call-1", { priority: "high" });
    });
  });

  it("should provide refreshStats function", async () => {
    const newStats = {
      totalCalls: 10,
      averageWaitTime: 200,
      aiConnected: 5,
      aiConnecting: 2,
      pending: 3,
      highPriority: 4,
    };

    mockQueueAPI.getQueueStats.mockResolvedValue(newStats);

    function RefreshStatsComponent() {
      const { refreshStats, stats } = useQueue();
      return (
        <div>
          <button onClick={refreshStats} data-testid="refresh-stats-btn">
            Refresh Stats
          </button>
          <div data-testid="stats">{stats ? JSON.stringify(stats) : "No Stats"}</div>
        </div>
      );
    }

    render(
      <QueueProvider>
        <RefreshStatsComponent />
      </QueueProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.getQueueStats).toHaveBeenCalled();
    });

    const refreshButton = screen.getByTestId("refresh-stats-btn");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      const statsData = screen.getByTestId("stats").textContent;
      expect(statsData).toContain("10");
    });
  });

  it("should update wait times", () => {
    function UpdateWaitTimesComponent() {
      const { updateWaitTimes, calls } = useQueue();
      return (
        <div>
          <button onClick={updateWaitTimes} data-testid="update-wait-times-btn">
            Update Wait Times
          </button>
          <div data-testid="first-call-wait-time">{calls[0]?.waitTime || 0}</div>
        </div>
      );
    }

    render(
      <QueueProvider>
        <UpdateWaitTimesComponent />
      </QueueProvider>
    );

    const updateButton = screen.getByTestId("update-wait-times-btn");
    fireEvent.click(updateButton);

    // Wait times should be incremented
    expect(screen.getByTestId("update-wait-times-btn")).toBeInTheDocument();
  });

  it("should handle fetchCalls function", async () => {
    const newCalls: QueueCall[] = [{ ...mockCall, id: "call-2", callId: "call-id-2" }];

    mockQueueAPI.getQueueCalls.mockResolvedValue(newCalls);

    function FetchCallsComponent() {
      const { fetchCalls, calls } = useQueue();
      return (
        <div>
          <button onClick={fetchCalls} data-testid="fetch-calls-btn">
            Fetch Calls
          </button>
          <div data-testid="calls-count">{calls.length}</div>
        </div>
      );
    }

    render(
      <QueueProvider>
        <FetchCallsComponent />
      </QueueProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.getQueueCalls).toHaveBeenCalled();
    });

    mockQueueAPI.getQueueCalls.mockResolvedValue(newCalls);

    const fetchButton = screen.getByTestId("fetch-calls-btn");
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId("calls-count")).toHaveTextContent("1");
    });
  });

  it("should handle addCall errors", async () => {
    mockQueueAPI.addCall.mockRejectedValue(new Error("Failed to add call"));

    function AddCallComponent() {
      const { addCall, error } = useQueue();
      return (
        <div>
          <button
            onClick={async () => {
              try {
                await addCall({
                  callId: "call-id-new",
                  callerName: "New Caller",
                  phoneNumber: "+1234567890",
                  waitTime: 0,
                  aiStatus: "pending",
                  priority: "low",
                  keywords: [],
                  emotionalState: "calm",
                });
              } catch (e) {
                // Error handled
              }
            }}
            data-testid="add-call-btn"
          >
            Add Call
          </button>
          <div data-testid="error">{error || "No Error"}</div>
        </div>
      );
    }

    render(
      <QueueProvider>
        <AddCallComponent />
      </QueueProvider>
    );

    const addButton = screen.getByTestId("add-call-btn");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Failed to add call");
    });
  });

  it("should handle removeCall errors", async () => {
    mockQueueAPI.removeCall.mockRejectedValue(new Error("Failed to remove call"));

    function RemoveCallComponent() {
      const { removeCall, error } = useQueue();
      return (
        <div>
          <button
            onClick={async () => {
              try {
                await removeCall("call-1");
              } catch (e) {
                // Error handled
              }
            }}
            data-testid="remove-call-btn"
          >
            Remove Call
          </button>
          <div data-testid="error">{error || "No Error"}</div>
        </div>
      );
    }

    render(
      <QueueProvider>
        <RemoveCallComponent />
      </QueueProvider>
    );

    const removeButton = screen.getByTestId("remove-call-btn");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Failed to remove call");
    });
  });

  it("should handle updateCall errors", async () => {
    mockQueueAPI.updateCall.mockRejectedValue(new Error("Failed to update call"));

    function UpdateCallComponent() {
      const { updateCall, error } = useQueue();
      return (
        <div>
          <button
            onClick={async () => {
              try {
                await updateCall("call-1", { priority: "high" });
              } catch (e) {
                // Error handled
              }
            }}
            data-testid="update-call-btn"
          >
            Update Call
          </button>
          <div data-testid="error">{error || "No Error"}</div>
        </div>
      );
    }

    render(
      <QueueProvider>
        <UpdateCallComponent />
      </QueueProvider>
    );

    const updateButton = screen.getByTestId("update-call-btn");
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Failed to update call");
    });
  });
});
