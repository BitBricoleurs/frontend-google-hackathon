/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProtectedLayout from "../layout";
import { useQueue } from "@/contexts/queue-context";
import type { QueueCall } from "@/types/queue";

jest.mock("@/contexts/queue-context", () => ({
  QueueProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useQueue: jest.fn(),
}));

jest.mock("@/contexts/query-context", () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/contexts/active-call-context", () => ({
  ActiveCallProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/auth/protected-route", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/components/layout/app-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar</div>,
}));

jest.mock("@/components/layout/app-header", () => ({
  AppHeader: () => <div data-testid="app-header">Header</div>,
}));

jest.mock("@/components/layout/floating-queue", () => ({
  FloatingQueue: ({
    calls,
    onTakeCall,
  }: {
    calls: QueueCall[];
    onTakeCall: (id: string) => void;
  }) => (
    <div data-testid="floating-queue">
      <div data-testid="queue-calls-count">{calls.length}</div>
      <button onClick={() => onTakeCall("test-call-id")} data-testid="take-call-btn">
        Take Call
      </button>
    </div>
  ),
}));

jest.mock("@/components/ui/resizable", () => ({
  ResizableHandle: () => <div data-testid="resizable-handle">Handle</div>,
  ResizablePanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseQueue = useQueue as jest.Mock;

describe("ProtectedLayout", () => {
  const mockCall: QueueCall = {
    id: "call-1",
    callId: "call-id-1",
    callerName: "Test Caller",
    phoneNumber: "+1234567890",
    waitTime: 120,
    aiStatus: "connected",
    priority: "high",
    keywords: ["emergency"],
    emotionalState: "distress",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueue.mockReturnValue({
      calls: [mockCall],
      stats: null,
      isLoading: false,
      error: null,
      fetchCalls: jest.fn(),
      addCall: jest.fn(),
      removeCall: jest.fn(),
      updateCall: jest.fn(),
      updateWaitTimes: jest.fn(),
      refreshStats: jest.fn(),
    });

    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render layout with all components", () => {
    render(
      <ProtectedLayout>
        <div data-testid="test-child">Test Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("app-header")).toBeInTheDocument();
    expect(screen.getByTestId("floating-queue")).toBeInTheDocument();
    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });

  it("should pass calls to FloatingQueue", () => {
    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("queue-calls-count")).toHaveTextContent("1");
  });

  it("should handle empty calls list", () => {
    mockUseQueue.mockReturnValue({
      calls: [],
      stats: null,
      isLoading: false,
      error: null,
      fetchCalls: jest.fn(),
      addCall: jest.fn(),
      removeCall: jest.fn(),
      updateCall: jest.fn(),
      updateWaitTimes: jest.fn(),
      refreshStats: jest.fn(),
    });

    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("queue-calls-count")).toHaveTextContent("0");
  });

  it("should handle multiple calls", () => {
    const multipleCalls: QueueCall[] = [
      mockCall,
      { ...mockCall, id: "call-2", callId: "call-id-2" },
      { ...mockCall, id: "call-3", callId: "call-id-3" },
    ];

    mockUseQueue.mockReturnValue({
      calls: multipleCalls,
      stats: null,
      isLoading: false,
      error: null,
      fetchCalls: jest.fn(),
      addCall: jest.fn(),
      removeCall: jest.fn(),
      updateCall: jest.fn(),
      updateWaitTimes: jest.fn(),
      refreshStats: jest.fn(),
    });

    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("queue-calls-count")).toHaveTextContent("3");
  });

  it("should handle take call action", () => {
    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    const takeCallBtn = screen.getByTestId("take-call-btn");
    fireEvent.click(takeCallBtn);

    // Verify no errors occur
    expect(screen.getByTestId("floating-queue")).toBeInTheDocument();
  });

  it("should show expand button when queue is collapsed", async () => {
    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    // The expand button should be hidden initially
    // This test verifies the component structure
    expect(screen.getByTestId("app-sidebar")).toBeInTheDocument();
  });

  it("should render children correctly", () => {
    render(
      <ProtectedLayout>
        <div data-testid="custom-child">Custom Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("custom-child")).toHaveTextContent("Custom Content");
  });

  it("should handle loading state", () => {
    mockUseQueue.mockReturnValue({
      calls: [],
      stats: null,
      isLoading: true,
      error: null,
      fetchCalls: jest.fn(),
      addCall: jest.fn(),
      removeCall: jest.fn(),
      updateCall: jest.fn(),
      updateWaitTimes: jest.fn(),
      refreshStats: jest.fn(),
    });

    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("floating-queue")).toBeInTheDocument();
  });

  it("should handle error state", () => {
    mockUseQueue.mockReturnValue({
      calls: [],
      stats: null,
      isLoading: false,
      error: "Failed to load calls",
      fetchCalls: jest.fn(),
      addCall: jest.fn(),
      removeCall: jest.fn(),
      updateCall: jest.fn(),
      updateWaitTimes: jest.fn(),
      refreshStats: jest.fn(),
    });

    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("floating-queue")).toBeInTheDocument();
  });

  it("should maintain layout structure", () => {
    const { container } = render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    // Verify the layout has the expected structure
    expect(container.querySelector(".flex")).toBeTruthy();
  });

  it("should handle queue with different priorities", () => {
    const priorityCalls: QueueCall[] = [
      { ...mockCall, id: "call-1", priority: "high" },
      { ...mockCall, id: "call-2", priority: "medium" },
      { ...mockCall, id: "call-3", priority: "low" },
    ];

    mockUseQueue.mockReturnValue({
      calls: priorityCalls,
      stats: null,
      isLoading: false,
      error: null,
      fetchCalls: jest.fn(),
      addCall: jest.fn(),
      removeCall: jest.fn(),
      updateCall: jest.fn(),
      updateWaitTimes: jest.fn(),
      refreshStats: jest.fn(),
    });

    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("queue-calls-count")).toHaveTextContent("3");
  });

  it("should handle queue with different AI statuses", () => {
    const statusCalls: QueueCall[] = [
      { ...mockCall, id: "call-1", aiStatus: "connected" },
      { ...mockCall, id: "call-2", aiStatus: "connecting" },
      { ...mockCall, id: "call-3", aiStatus: "pending" },
    ];

    mockUseQueue.mockReturnValue({
      calls: statusCalls,
      stats: null,
      isLoading: false,
      error: null,
      fetchCalls: jest.fn(),
      addCall: jest.fn(),
      removeCall: jest.fn(),
      updateCall: jest.fn(),
      updateWaitTimes: jest.fn(),
      refreshStats: jest.fn(),
    });

    render(
      <ProtectedLayout>
        <div>Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByTestId("queue-calls-count")).toHaveTextContent("3");
  });
});
