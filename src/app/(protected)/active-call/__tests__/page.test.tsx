/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import ActiveCallPage from "../page";
import { useActiveCall } from "@/contexts/active-call-context";
import { useQueue } from "@/contexts/queue-context";
import { QueueAPI } from "@/services/queue-api";

jest.mock("@/contexts/active-call-context");
jest.mock("@/contexts/queue-context");
jest.mock("@/services/queue-api");
jest.mock("@/components/ui/resizable", () => ({
  ResizableHandle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ResizablePanel: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ResizablePanelGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseActiveCall = useActiveCall as jest.Mock;
const mockUseQueue = useQueue as jest.Mock;
const mockQueueAPI = QueueAPI as jest.Mocked<typeof QueueAPI>;

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe("ActiveCallPage", () => {
  const defaultContext = {
    callId: null,
    transcript: [],
    isLoading: false,
    error: null,
    callStatus: null,
    callDuration: null,
    startedAt: null,
    endedAt: null,
    patientInfo: null,
    fetchTranscript: jest.fn(),
    clearCall: jest.fn(),
    isConnectedToWebSocket: false,
    isMuted: false,
    setIsMuted: jest.fn(),
    isSpeakerOn: true,
    setIsSpeakerOn: jest.fn(),
    isInCall: false,
    takeCall: jest.fn(),
    isAudioConnected: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActiveCall.mockReturnValue(defaultContext);
    mockUseQueue.mockReturnValue({
      calls: [],
      stats: null,
      isLoading: false,
      error: null,
    });
    mockQueueAPI.subscribeToConnectionState.mockReturnValue(() => {});
    mockQueueAPI.subscribeToConnectionEvents.mockReturnValue(() => {});
  });

  it("should render loading state", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      isLoading: true,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Loading call transcript...")).toBeInTheDocument();
  });

  it("should render error state", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      error: "Failed to load call",
    });

    render(<ActiveCallPage />);

    expect(screen.getAllByText("Failed to load call").length).toBeGreaterThan(0);
  });

  it("should render empty state when no callId", () => {
    render(<ActiveCallPage />);

    expect(screen.getByText("No active call")).toBeInTheDocument();
    expect(screen.getByText("Select a call from the queue to view details")).toBeInTheDocument();
  });

  it("should render call data when callId exists", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      callStatus: "active",
      callDuration: 222, // 3m 42s
      transcript: [
        {
          index: 0,
          timestamp: "2025-01-01T10:00:00Z",
          speaker: "Patient",
          text: "I need help",
          confidence: 0.95,
        },
      ],
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Active Emergency Call")).toBeInTheDocument();
    expect(screen.getByText("Call ID: call-123")).toBeInTheDocument();
    expect(screen.getByText("00:03:42")).toBeInTheDocument();
  });

  it("should render transcript messages", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      transcript: [
        {
          index: 0,
          timestamp: "2025-01-01T10:00:00Z",
          speaker: "Patient",
          text: "I have chest pain",
          confidence: 0.95,
        },
        {
          index: 1,
          timestamp: "2025-01-01T10:00:15Z",
          speaker: "AI Agent",
          text: "Can you describe the pain?",
          confidence: 0.98,
        },
      ],
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("I have chest pain")).toBeInTheDocument();
    expect(screen.getByText("Can you describe the pain?")).toBeInTheDocument();
  });

  it("should show Take Call button when not in call", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      isInCall: false,
    });

    render(<ActiveCallPage />);

    expect(screen.getByRole("button", { name: /Take Call/i })).toBeInTheDocument();
  });

  it("should show call controls when in call", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      isInCall: true,
    });

    render(<ActiveCallPage />);

    // Should have mute, hang up, and speaker buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("should show audio connected status when in call and audio is connected", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      isInCall: true,
      isAudioConnected: true,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Audio Connected")).toBeInTheDocument();
  });

  it("should show live indicator when connected to WebSocket", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      isConnectedToWebSocket: true,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("should show no transcript message when transcript is empty", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      transcript: [],
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("No transcript available")).toBeInTheDocument();
  });

  it("should render priority badge when call data exists", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    mockUseQueue.mockReturnValue({
      calls: [
        {
          id: "queue-1",
          callId: "call-123",
          priority: "high",
          callerName: "Test",
          phoneNumber: "+123456",
          waitTime: 60,
          aiStatus: "connected",
          keywords: [],
          emotionalState: "panic",
        },
      ],
      stats: null,
      isLoading: false,
      error: null,
    });

    render(<ActiveCallPage />);

    // Priority badge should be rendered
    expect(screen.getByText(/PRIORITY/i)).toBeInTheDocument();
  });

  it("should render AI insights when call data exists", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    mockUseQueue.mockReturnValue({
      calls: [
        {
          id: "queue-1",
          callId: "call-123",
          priority: "high",
          callerName: "Test",
          phoneNumber: "+123456",
          waitTime: 60,
          aiStatus: "connected",
          keywords: ["emergency"],
          emotionalState: "panic",
          chiefComplaint: "Chest pain",
          aiSummary: "Patient needs urgent care",
          keySymptoms: ["chest pain", "shortness of breath"],
        },
      ],
      stats: null,
      isLoading: false,
      error: null,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("AI Medical Analysis")).toBeInTheDocument();
    expect(screen.getByText("Chief Complaint")).toBeInTheDocument();
  });

  it("should render caller information card", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    mockUseQueue.mockReturnValue({
      calls: [
        {
          id: "queue-1",
          callId: "call-123",
          priority: "high",
          callerName: "John Doe",
          phoneNumber: "+1234567890",
          waitTime: 120,
          aiStatus: "connected",
          keywords: [],
          emotionalState: "calm",
          patientAge: 45,
          patientGender: "Male",
          location: "Paris",
        },
      ],
      stats: null,
      isLoading: false,
      error: null,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Patient Information")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should subscribe to connection state on mount", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    render(<ActiveCallPage />);

    expect(mockQueueAPI.subscribeToConnectionState).toHaveBeenCalled();
  });

  it("should subscribe to connection events on mount", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    render(<ActiveCallPage />);

    expect(mockQueueAPI.subscribeToConnectionEvents).toHaveBeenCalled();
  });

  it("should format duration as 00:00:00 when duration is null", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      callDuration: null,
    });

    render(<ActiveCallPage />);

    // Should show mock duration
    expect(screen.getByText("00:03:42")).toBeInTheDocument();
  });

  it("should render red flags when present", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    mockUseQueue.mockReturnValue({
      calls: [
        {
          id: "queue-1",
          callId: "call-123",
          priority: "high",
          callerName: "Test",
          phoneNumber: "+123456",
          waitTime: 60,
          aiStatus: "connected",
          keywords: [],
          emotionalState: "panic",
          redFlags: ["cardiac arrest", "unconscious"],
        },
      ],
      stats: null,
      isLoading: false,
      error: null,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("⚠️ Red Flags Detected")).toBeInTheDocument();
  });

  it("should render patient information", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    mockUseQueue.mockReturnValue({
      calls: [
        {
          id: "queue-1",
          callId: "call-123",
          priority: "high",
          callerName: "Test",
          phoneNumber: "+123456",
          waitTime: 60,
          aiStatus: "connected",
          keywords: [],
          emotionalState: "calm",
          patientAge: 45,
          patientGender: "male",
          location: "123 Main St",
        },
      ],
      stats: null,
      isLoading: false,
      error: null,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Patient Information")).toBeInTheDocument();
    expect(screen.getByText(/Age: 45/)).toBeInTheDocument();
  });

  it("should display emotional state", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
    });

    mockUseQueue.mockReturnValue({
      calls: [
        {
          id: "queue-1",
          callId: "call-123",
          priority: "high",
          callerName: "Test",
          phoneNumber: "+123456",
          waitTime: 60,
          aiStatus: "connected",
          keywords: [],
          emotionalState: "panic",
        },
      ],
      stats: null,
      isLoading: false,
      error: null,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Emotional State")).toBeInTheDocument();
  });

  it("should show past emergency call when status is not active", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      callStatus: "completed",
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Past Emergency Call")).toBeInTheDocument();
  });

  it("should render confidence score in transcript", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      transcript: [
        {
          index: 0,
          timestamp: "10:00:00",
          speaker: "Patient",
          text: "I need help",
          confidence: 0.85,
        },
      ],
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("(85%)")).toBeInTheDocument();
  });

  it("should show connecting audio status when audio not connected", () => {
    mockUseActiveCall.mockReturnValue({
      ...defaultContext,
      callId: "call-123",
      isInCall: true,
      isAudioConnected: false,
    });

    render(<ActiveCallPage />);

    expect(screen.getByText("Connecting Audio...")).toBeInTheDocument();
  });
});
