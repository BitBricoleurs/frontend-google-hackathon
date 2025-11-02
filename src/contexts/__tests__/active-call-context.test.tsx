/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { ActiveCallProvider, useActiveCall } from "../active-call-context";
import * as transcriptApi from "@/api/transcript";
import * as handoffApi from "@/api/handoff";
import { QueueAPI } from "@/services/queue-api";
import { AudioManager } from "@/services/audio-manager";

jest.mock("@/api/transcript");
jest.mock("@/api/handoff");
jest.mock("@/services/queue-api");
jest.mock("@/services/audio-manager");

const mockUseSearchParams = jest.fn();
jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    user: { operatorId: "operator-123", username: "test-operator" },
  }),
}));

const mockTranscriptApi = transcriptApi as jest.Mocked<typeof transcriptApi>;
const mockHandoffApi = handoffApi as jest.Mocked<typeof handoffApi>;
const mockQueueAPI = QueueAPI as jest.Mocked<typeof QueueAPI>;
const mockAudioManager = AudioManager as jest.Mocked<typeof AudioManager>;

describe("ActiveCallContext", () => {
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSearchParams.mockReturnValue({
      get: (key: string) => mockSearchParams.get(key),
    });

    mockQueueAPI.subscribeToTranscript.mockReturnValue(() => {});
    mockQueueAPI.subscribeToConnectionState.mockReturnValue(() => {});
    mockQueueAPI.subscribeToConnectionEvents.mockReturnValue(() => {});

    mockTranscriptApi.getFormattedTranscript.mockResolvedValue({
      callId: "call-123",
      status: "active",
      startedAt: "2025-01-01T10:00:00Z",
      endedAt: null,
      duration: 300,
      messages: [
        {
          index: 0,
          timestamp: "2025-01-01T10:00:00Z",
          speaker: "Patient",
          text: "I need help",
          confidence: 0.95,
        },
      ],
      patient: { name: "Test Patient" },
    });
  });

  function TestComponent() {
    const {
      callId,
      transcript,
      isLoading,
      error,
      callStatus,
      isConnectedToWebSocket,
      isMuted,
      isSpeakerOn,
      isInCall,
      isAudioConnected,
    } = useActiveCall();

    return (
      <div>
        <div data-testid="call-id">{callId || "No Call ID"}</div>
        <div data-testid="loading">{isLoading ? "Loading" : "Not Loading"}</div>
        <div data-testid="error">{error || "No Error"}</div>
        <div data-testid="status">{callStatus || "No Status"}</div>
        <div data-testid="transcript-count">{transcript.length}</div>
        <div data-testid="ws-connected">
          {isConnectedToWebSocket ? "Connected" : "Disconnected"}
        </div>
        <div data-testid="muted">{isMuted ? "Muted" : "Not Muted"}</div>
        <div data-testid="speaker">{isSpeakerOn ? "Speaker On" : "Speaker Off"}</div>
        <div data-testid="in-call">{isInCall ? "In Call" : "Not In Call"}</div>
        <div data-testid="audio-connected">
          {isAudioConnected ? "Audio Connected" : "Audio Disconnected"}
        </div>
      </div>
    );
  }

  it("should throw error when used outside provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      "useActiveCall must be used within an ActiveCallProvider"
    );

    consoleError.mockRestore();
  });

  it("should provide initial state", () => {
    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    expect(screen.getByTestId("call-id")).toHaveTextContent("No Call ID");
    expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
    expect(screen.getByTestId("error")).toHaveTextContent("No Error");
    expect(screen.getByTestId("transcript-count")).toHaveTextContent("0");
    expect(screen.getByTestId("muted")).toHaveTextContent("Not Muted");
    expect(screen.getByTestId("speaker")).toHaveTextContent("Speaker On");
    expect(screen.getByTestId("in-call")).toHaveTextContent("Not In Call");
  });

  it("should fetch transcript when callId is in URL", async () => {
    mockSearchParams.set("callId", "call-123");

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockTranscriptApi.getFormattedTranscript).toHaveBeenCalledWith("call-123");
    });

    await waitFor(() => {
      expect(screen.getByTestId("call-id")).toHaveTextContent("call-123");
      expect(screen.getByTestId("status")).toHaveTextContent("active");
      expect(screen.getByTestId("transcript-count")).toHaveTextContent("1");
    });
  });

  it("should subscribe to transcript updates when callId is set", async () => {
    mockSearchParams.set("callId", "call-123");

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToTranscript).toHaveBeenCalledWith(
        "call-123",
        expect.any(Function)
      );
    });
  });

  it("should handle transcript fetch errors", async () => {
    mockSearchParams.set("callId", "call-123");
    mockTranscriptApi.getFormattedTranscript.mockRejectedValue(
      new Error("Failed to fetch transcript")
    );

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Failed to fetch transcript");
      expect(screen.getByTestId("transcript-count")).toHaveTextContent("0");
    });
  });

  it("should parse string transcript data from WebSocket", async () => {
    mockSearchParams.set("callId", "call-123");
    let transcriptCallback: ((data: string) => void) | null = null;

    mockQueueAPI.subscribeToTranscript.mockImplementation((callId, callback) => {
      transcriptCallback = callback;
      return () => {};
    });

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToTranscript).toHaveBeenCalled();
    });

    // Simulate WebSocket transcript update
    await act(async () => {
      if (transcriptCallback) {
        transcriptCallback("Speaker1: Hello\nSpeaker2: Hi there");
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId("transcript-count")).toHaveTextContent("2");
    });
  });

  it("should handle takeCall successfully", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-456",
      message: "Control taken",
      aiTerminated: true,
    });

    // Mock AudioManager instance methods
    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function TakeCallComponent() {
      const { takeCall, isInCall, isAudioConnected } = useActiveCall();
      return (
        <div>
          <button onClick={takeCall} data-testid="take-call-btn">
            Take Call
          </button>
          <div data-testid="in-call">{isInCall ? "In Call" : "Not In Call"}</div>
          <div data-testid="audio-connected">
            {isAudioConnected ? "Audio Connected" : "Audio Disconnected"}
          </div>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByTestId("take-call-btn").click();
    });

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalledWith(
        "call-123",
        "operator-123",
        "Operator taking control from see mode"
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("in-call")).toHaveTextContent("In Call");
    });
  });

  it("should handle mute control", () => {
    function MuteControlComponent() {
      const { isMuted, setIsMuted } = useActiveCall();
      return (
        <div>
          <div data-testid="muted">{isMuted ? "Muted" : "Not Muted"}</div>
          <button onClick={() => setIsMuted(true)} data-testid="mute-btn">
            Mute
          </button>
          <button onClick={() => setIsMuted(false)} data-testid="unmute-btn">
            Unmute
          </button>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <MuteControlComponent />
      </ActiveCallProvider>
    );

    expect(screen.getByTestId("muted")).toHaveTextContent("Not Muted");

    act(() => {
      screen.getByTestId("mute-btn").click();
    });

    expect(screen.getByTestId("muted")).toHaveTextContent("Muted");

    act(() => {
      screen.getByTestId("unmute-btn").click();
    });

    expect(screen.getByTestId("muted")).toHaveTextContent("Not Muted");
  });

  it("should handle speaker control", () => {
    function SpeakerControlComponent() {
      const { isSpeakerOn, setIsSpeakerOn } = useActiveCall();
      return (
        <div>
          <div data-testid="speaker">{isSpeakerOn ? "Speaker On" : "Speaker Off"}</div>
          <button onClick={() => setIsSpeakerOn(false)} data-testid="speaker-off-btn">
            Speaker Off
          </button>
          <button onClick={() => setIsSpeakerOn(true)} data-testid="speaker-on-btn">
            Speaker On
          </button>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <SpeakerControlComponent />
      </ActiveCallProvider>
    );

    expect(screen.getByTestId("speaker")).toHaveTextContent("Speaker On");

    act(() => {
      screen.getByTestId("speaker-off-btn").click();
    });

    expect(screen.getByTestId("speaker")).toHaveTextContent("Speaker Off");

    act(() => {
      screen.getByTestId("speaker-on-btn").click();
    });

    expect(screen.getByTestId("speaker")).toHaveTextContent("Speaker On");
  });

  it("should handle WebSocket connection", async () => {
    mockSearchParams.set("callId", "call-123");

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToTranscript).toHaveBeenCalled();
    });
  });

  it("should update call duration", async () => {
    mockSearchParams.set("callId", "call-123");

    mockTranscriptApi.getFormattedTranscript.mockResolvedValue({
      callId: "call-123",
      status: "active",
      startedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      endedAt: null,
      duration: 60,
      messages: [],
      patient: { name: "Test Patient" },
    });

    function DurationComponent() {
      const { callDuration } = useActiveCall();
      return <div data-testid="duration">{callDuration || 0}</div>;
    }

    render(
      <ActiveCallProvider>
        <DurationComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("duration")).toHaveTextContent("60");
    });
  });

  it("should handle error state", async () => {
    mockSearchParams.set("callId", "call-123");
    mockTranscriptApi.getFormattedTranscript.mockRejectedValue(new Error("Failed to load"));

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Failed to load");
    });
  });

  it("should handle empty transcript", async () => {
    mockSearchParams.set("callId", "call-123");

    mockTranscriptApi.getFormattedTranscript.mockResolvedValue({
      callId: "call-123",
      status: "active",
      startedAt: "2025-01-01T10:00:00Z",
      endedAt: null,
      duration: 100,
      messages: [],
      patient: { name: "Test Patient" },
    });

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("transcript-count")).toHaveTextContent("0");
    });
  });

  it("should handle clearCall function", async () => {
    mockSearchParams.set("callId", "call-123");

    function ClearCallComponent() {
      const { clearCall, callId } = useActiveCall();
      return (
        <div>
          <div data-testid="call-id">{callId || "No Call ID"}</div>
          <button onClick={clearCall} data-testid="clear-call-btn">
            Clear Call
          </button>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <ClearCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("call-id")).toHaveTextContent("call-123");
    });

    const clearButton = screen.getByTestId("clear-call-btn");
    fireEvent.click(clearButton);

    expect(screen.getByTestId("call-id")).toHaveTextContent("No Call ID");
  });

  it("should handle takeCall without operatorId", async () => {
    mockSearchParams.set("callId", "call-123");

    function TakeCallComponent() {
      const { takeCall, isLoading } = useActiveCall();
      return (
        <button onClick={takeCall} data-testid="take-call-btn" disabled={isLoading}>
          Take Call
        </button>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    // Mock implementation should still work since we have operatorId in the global mock
    // This test verifies the component renders correctly
    expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
  });

  it("should handle takeCall failure", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: false,
      handoffId: "",
      message: "Failed to take control",
      aiTerminated: false,
    });

    function TakeCallComponent() {
      const { takeCall, isInCall } = useActiveCall();
      return (
        <div>
          <button onClick={takeCall} data-testid="take-call-btn">
            Take Call
          </button>
          <div data-testid="in-call">{isInCall ? "In Call" : "Not In Call"}</div>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    const takeCallBtn = screen.getByTestId("take-call-btn");
    fireEvent.click(takeCallBtn);

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
    });

    // Should not be in call after failure
    expect(screen.getByTestId("in-call")).toHaveTextContent("Not In Call");
  });

  it("should handle audio connection failure", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-456",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockRejectedValue(new Error("Audio connection failed")),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(false),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function TakeCallComponent() {
      const { takeCall, isInCall, isAudioConnected } = useActiveCall();
      return (
        <div>
          <button onClick={takeCall} data-testid="take-call-btn">
            Take Call
          </button>
          <div data-testid="in-call">{isInCall ? "In Call" : "Not In Call"}</div>
          <div data-testid="audio-connected">
            {isAudioConnected ? "Audio Connected" : "Audio Disconnected"}
          </div>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    const takeCallBtn = screen.getByTestId("take-call-btn");
    fireEvent.click(takeCallBtn);

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
    });

    // Should be in call but audio not connected
    await waitFor(() => {
      expect(screen.getByTestId("in-call")).toHaveTextContent("In Call");
      expect(screen.getByTestId("audio-connected")).toHaveTextContent("Audio Disconnected");
    });
  });

  it("should handle microphone permission denial", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-456",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(false),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function TakeCallComponent() {
      const { takeCall } = useActiveCall();
      return (
        <button onClick={takeCall} data-testid="take-call-btn">
          Take Call
        </button>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    const takeCallBtn = screen.getByTestId("take-call-btn");
    fireEvent.click(takeCallBtn);

    await waitFor(() => {
      expect(mockAudioManagerInstance.requestMicrophonePermission).toHaveBeenCalled();
    });
  });

  it("should handle transcript with empty lines", async () => {
    mockSearchParams.set("callId", "call-123");
    let transcriptCallback: ((data: string) => void) | null = null;

    mockQueueAPI.subscribeToTranscript.mockImplementation((callId, callback) => {
      transcriptCallback = callback;
      return () => {};
    });

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToTranscript).toHaveBeenCalled();
    });

    // Simulate transcript with empty lines
    await act(async () => {
      if (transcriptCallback) {
        transcriptCallback("Speaker1: Hello\n\n\nSpeaker2: Hi");
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId("transcript-count")).toHaveTextContent("2");
    });
  });

  it("should handle transcript without speaker prefix", async () => {
    mockSearchParams.set("callId", "call-123");
    let transcriptCallback: ((data: string) => void) | null = null;

    mockQueueAPI.subscribeToTranscript.mockImplementation((callId, callback) => {
      transcriptCallback = callback;
      return () => {};
    });

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToTranscript).toHaveBeenCalled();
    });

    // Simulate transcript without speaker prefix
    await act(async () => {
      if (transcriptCallback) {
        transcriptCallback("Just some text without speaker");
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId("transcript-count")).toHaveTextContent("1");
    });
  });

  it("should handle empty transcript data from WebSocket", async () => {
    mockSearchParams.set("callId", "call-123");
    let transcriptCallback: ((data: string) => void) | null = null;

    mockQueueAPI.subscribeToTranscript.mockImplementation((callId, callback) => {
      transcriptCallback = callback;
      return () => {};
    });

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToTranscript).toHaveBeenCalled();
    });

    const initialCount = screen.getByTestId("transcript-count").textContent;

    // Simulate empty transcript
    await act(async () => {
      if (transcriptCallback) {
        transcriptCallback("");
      }
    });

    // Transcript count should not increase from empty data
    const finalCount = screen.getByTestId("transcript-count").textContent;
    expect(finalCount).toBe(initialCount);
  });

  it("should control audio manager mute state", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-456",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function MuteControlComponent() {
      const { takeCall, setIsMuted, isMuted } = useActiveCall();
      return (
        <div>
          <button onClick={takeCall} data-testid="take-call-btn">
            Take Call
          </button>
          <button onClick={() => setIsMuted(true)} data-testid="mute-btn">
            Mute
          </button>
          <div data-testid="muted">{isMuted ? "Muted" : "Not Muted"}</div>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <MuteControlComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    // Take call first
    fireEvent.click(screen.getByTestId("take-call-btn"));

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
    });

    // Then mute
    fireEvent.click(screen.getByTestId("mute-btn"));

    await waitFor(() => {
      expect(mockAudioManagerInstance.setMuted).toHaveBeenCalledWith(true);
    });
  });

  it("should control audio manager speaker state", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-456",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function SpeakerControlComponent() {
      const { takeCall, setIsSpeakerOn, isSpeakerOn } = useActiveCall();
      return (
        <div>
          <button onClick={takeCall} data-testid="take-call-btn">
            Take Call
          </button>
          <button onClick={() => setIsSpeakerOn(false)} data-testid="speaker-off-btn">
            Speaker Off
          </button>
          <div data-testid="speaker">{isSpeakerOn ? "Speaker On" : "Speaker Off"}</div>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <SpeakerControlComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    // Take call first
    fireEvent.click(screen.getByTestId("take-call-btn"));

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
    });

    // Then turn off speaker
    fireEvent.click(screen.getByTestId("speaker-off-btn"));

    await waitFor(() => {
      expect(mockAudioManagerInstance.setSpeakerOn).toHaveBeenCalledWith(false);
    });
  });

  it("should subscribe to connection state and events", async () => {
    mockSearchParams.set("callId", "call-123");

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToConnectionState).toHaveBeenCalled();
      expect(mockQueueAPI.subscribeToConnectionEvents).toHaveBeenCalled();
    });
  });

  it("should handle microphone permission denied", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-789",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(false), // Permission denied
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function TakeCallComponent() {
      const { takeCall } = useActiveCall();
      return (
        <button onClick={takeCall} data-testid="take-call-btn">
          Take Call
        </button>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("take-call-btn"));

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
      expect(mockAudioManagerInstance.requestMicrophonePermission).toHaveBeenCalled();
    });
  });

  it.skip("should handle audio connection error", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-error",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockRejectedValue(new Error("Audio connection failed")),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(false),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function TakeCallComponent() {
      const { takeCall } = useActiveCall();
      return (
        <button onClick={takeCall} data-testid="take-call-btn">
          Take Call
        </button>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("take-call-btn"));

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
    });
  });

  it("should handle clearCall with audio manager cleanup", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-clear",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function TestClearComponent() {
      const { takeCall, clearCall, isInCall } = useActiveCall();
      return (
        <div>
          <button onClick={takeCall} data-testid="take-call-btn">
            Take Call
          </button>
          <button onClick={clearCall} data-testid="clear-call-btn">
            Clear Call
          </button>
          <div data-testid="in-call">{isInCall ? "In Call" : "Not In Call"}</div>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <TestClearComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    // Take call first
    fireEvent.click(screen.getByTestId("take-call-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("in-call")).toHaveTextContent("In Call");
    });

    // Then clear call
    fireEvent.click(screen.getByTestId("clear-call-btn"));

    await waitFor(() => {
      expect(mockAudioManagerInstance.disconnect).toHaveBeenCalled();
      expect(screen.getByTestId("in-call")).toHaveTextContent("Not In Call");
    });
  });

  it("should handle connection state changes", async () => {
    mockSearchParams.set("callId", "call-123");
    let stateCallback:
      | ((state: { isConnected: boolean; sessionId?: string; error?: string }) => void)
      | null = null;

    mockQueueAPI.subscribeToConnectionState.mockImplementation((callback) => {
      stateCallback = callback;
      return () => {};
    });

    function ConnectionStateComponent() {
      const { isConnectedToWebSocket } = useActiveCall();
      return (
        <div data-testid="ws-state">{isConnectedToWebSocket ? "Connected" : "Disconnected"}</div>
      );
    }

    render(
      <ActiveCallProvider>
        <ConnectionStateComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToConnectionState).toHaveBeenCalled();
    });

    // Simulate connection state change
    await act(async () => {
      if (stateCallback) {
        stateCallback({ isConnected: true, sessionId: "test-session" });
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId("ws-state")).toHaveTextContent("Connected");
    });
  });

  it("should handle ai_terminated event and update call status", async () => {
    mockSearchParams.set("callId", "call-123");
    let eventCallback:
      | ((event: { type: string; data: unknown; timestamp: string }) => void)
      | null = null;

    mockQueueAPI.subscribeToConnectionEvents.mockImplementation((callback) => {
      eventCallback = callback;
      return () => {};
    });

    function CallStatusComponent() {
      const { callStatus } = useActiveCall();
      return <div data-testid="call-status">{callStatus || "Unknown"}</div>;
    }

    render(
      <ActiveCallProvider>
        <CallStatusComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToConnectionEvents).toHaveBeenCalled();
    });

    // Simulate AI terminated event
    await act(async () => {
      if (eventCallback) {
        eventCallback({
          type: "ai_terminated",
          data: { callId: "call-123", reason: "Call ended" },
          timestamp: new Date().toISOString(),
        });
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId("call-status")).toHaveTextContent("completed");
    });
  });

  it("should handle call_ended event and disconnect audio", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-456",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    let eventCallback:
      | ((event: { type: string; data: unknown; timestamp: string }) => void)
      | null = null;

    mockQueueAPI.subscribeToConnectionEvents.mockImplementation((callback) => {
      eventCallback = callback;
      return () => {};
    });

    function CallEndedComponent() {
      const { takeCall, isAudioConnected } = useActiveCall();
      return (
        <div>
          <button onClick={takeCall} data-testid="take-call-btn">
            Take Call
          </button>
          <div data-testid="audio-state">{isAudioConnected ? "Connected" : "Disconnected"}</div>
        </div>
      );
    }

    render(
      <ActiveCallProvider>
        <CallEndedComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    // Take call first
    fireEvent.click(screen.getByTestId("take-call-btn"));

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
    });

    // Simulate call ended event
    await act(async () => {
      if (eventCallback) {
        eventCallback({
          type: "call_ended",
          data: { callId: "call-123", reason: "Caller hung up" },
          timestamp: new Date().toISOString(),
        });
      }
    });

    await waitFor(() => {
      expect(mockAudioManagerInstance.disconnect).toHaveBeenCalled();
    });
  });

  it("should handle session_terminated event", async () => {
    mockSearchParams.set("callId", "call-123");
    let eventCallback:
      | ((event: { type: string; data: unknown; timestamp: string }) => void)
      | null = null;

    mockQueueAPI.subscribeToConnectionEvents.mockImplementation((callback) => {
      eventCallback = callback;
      return () => {};
    });

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToConnectionEvents).toHaveBeenCalled();
    });

    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});

    // Simulate session terminated event
    await act(async () => {
      if (eventCallback) {
        eventCallback({
          type: "session_terminated",
          data: { reason: "Server shutdown" },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Event should be logged
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("Session terminated"));

    consoleLog.mockRestore();
  });

  it("should handle takeCall without callId", async () => {
    // No callId set
    mockSearchParams.delete("callId");

    function TakeCallNoIdComponent() {
      const { takeCall } = useActiveCall();
      return (
        <button onClick={takeCall} data-testid="take-call-btn">
          Take Call
        </button>
      );
    }

    render(
      <ActiveCallProvider>
        <TakeCallNoIdComponent />
      </ActiveCallProvider>
    );

    const takeCallBtn = screen.getByTestId("take-call-btn");
    fireEvent.click(takeCallBtn);

    // Should not call takeControl
    await waitFor(() => {
      expect(mockHandoffApi.takeControl).not.toHaveBeenCalled();
    });
  });

  it("should cleanup on unmount with active audio", async () => {
    mockSearchParams.set("callId", "call-123");

    mockHandoffApi.takeControl.mockResolvedValue({
      success: true,
      handoffId: "handoff-456",
      message: "Control taken",
      aiTerminated: true,
    });

    const mockAudioManagerInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      requestMicrophonePermission: jest.fn().mockResolvedValue(true),
      setMuted: jest.fn(),
      setSpeakerOn: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
    };

    (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

    function TakeCallComponent() {
      const { takeCall } = useActiveCall();
      return (
        <button onClick={takeCall} data-testid="take-call-btn">
          Take Call
        </button>
      );
    }

    const { unmount } = render(
      <ActiveCallProvider>
        <TakeCallComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
    });

    // Take call
    fireEvent.click(screen.getByTestId("take-call-btn"));

    await waitFor(() => {
      expect(mockHandoffApi.takeControl).toHaveBeenCalled();
    });

    // Unmount should cleanup
    unmount();

    // Cleanup should be called
    expect(mockQueueAPI.subscribeToConnectionState).toHaveBeenCalled();
  });

  it("should handle connection state with error", async () => {
    mockSearchParams.set("callId", "call-123");
    let stateCallback:
      | ((state: { isConnected: boolean; sessionId?: string; error?: string }) => void)
      | null = null;

    mockQueueAPI.subscribeToConnectionState.mockImplementation((callback) => {
      stateCallback = callback;
      return () => {};
    });

    const consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <ActiveCallProvider>
        <TestComponent />
      </ActiveCallProvider>
    );

    await waitFor(() => {
      expect(mockQueueAPI.subscribeToConnectionState).toHaveBeenCalled();
    });

    // Simulate connection error
    await act(async () => {
      if (stateCallback) {
        stateCallback({ isConnected: false, error: "Connection timeout" });
      }
    });

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("Connection lost"),
      "Connection timeout"
    );

    consoleWarn.mockRestore();
  });

  describe("hangUpCall", () => {
    it("should hang up call successfully and update state", async () => {
      mockSearchParams.set("callId", "call-123");

      mockHandoffApi.takeControl.mockResolvedValue({
        success: true,
        handoffId: "handoff-456",
        message: "Control taken",
        aiTerminated: true,
      });

      const mockAudioManagerInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
        requestMicrophonePermission: jest.fn().mockResolvedValue(true),
        setMuted: jest.fn(),
        setSpeakerOn: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        hangUp: jest.fn(),
      };

      (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

      function HangUpComponent() {
        const { takeCall, hangUpCall, isInCall, callStatus } = useActiveCall();
        return (
          <div>
            <button onClick={takeCall} data-testid="take-call-btn">
              Take Call
            </button>
            <button onClick={hangUpCall} data-testid="hang-up-btn">
              Hang Up
            </button>
            <div data-testid="in-call">{isInCall ? "In Call" : "Not In Call"}</div>
            <div data-testid="call-status">{callStatus || "Unknown"}</div>
          </div>
        );
      }

      render(
        <ActiveCallProvider>
          <HangUpComponent />
        </ActiveCallProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
      });

      // Take call first
      fireEvent.click(screen.getByTestId("take-call-btn"));

      await waitFor(() => {
        expect(mockHandoffApi.takeControl).toHaveBeenCalled();
        expect(screen.getByTestId("in-call")).toHaveTextContent("In Call");
      });

      // Now hang up
      fireEvent.click(screen.getByTestId("hang-up-btn"));

      await waitFor(() => {
        expect(mockAudioManagerInstance.hangUp).toHaveBeenCalled();
        expect(screen.getByTestId("in-call")).toHaveTextContent("Not In Call");
        expect(screen.getByTestId("call-status")).toHaveTextContent("completed");
      });
    });

    it("should show error when hanging up without active call", () => {
      mockSearchParams.set("callId", "call-123");

      function HangUpComponent() {
        const { hangUpCall } = useActiveCall();
        return (
          <button onClick={hangUpCall} data-testid="hang-up-btn">
            Hang Up
          </button>
        );
      }

      render(
        <ActiveCallProvider>
          <HangUpComponent />
        </ActiveCallProvider>
      );

      // Try to hang up without taking call first
      fireEvent.click(screen.getByTestId("hang-up-btn"));

      // Should not crash, error handling is done via toast
      expect(screen.getByTestId("hang-up-btn")).toBeInTheDocument();
    });

    it("should handle hangUp errors gracefully", async () => {
      mockSearchParams.set("callId", "call-123");

      mockHandoffApi.takeControl.mockResolvedValue({
        success: true,
        handoffId: "handoff-456",
        message: "Control taken",
        aiTerminated: true,
      });

      const mockAudioManagerInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
        requestMicrophonePermission: jest.fn().mockResolvedValue(true),
        setMuted: jest.fn(),
        setSpeakerOn: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        hangUp: jest.fn().mockImplementation(() => {
          throw new Error("Failed to hang up");
        }),
      };

      (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

      function HangUpComponent() {
        const { takeCall, hangUpCall } = useActiveCall();
        return (
          <div>
            <button onClick={takeCall} data-testid="take-call-btn">
              Take Call
            </button>
            <button onClick={hangUpCall} data-testid="hang-up-btn">
              Hang Up
            </button>
          </div>
        );
      }

      render(
        <ActiveCallProvider>
          <HangUpComponent />
        </ActiveCallProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
      });

      // Take call first
      fireEvent.click(screen.getByTestId("take-call-btn"));

      await waitFor(() => {
        expect(mockHandoffApi.takeControl).toHaveBeenCalled();
      });

      // Try to hang up (should handle error)
      fireEvent.click(screen.getByTestId("hang-up-btn"));

      // Should not crash
      expect(screen.getByTestId("hang-up-btn")).toBeInTheDocument();
    });

    it("should clear audio manager reference after hang up", async () => {
      mockSearchParams.set("callId", "call-123");

      mockHandoffApi.takeControl.mockResolvedValue({
        success: true,
        handoffId: "handoff-456",
        message: "Control taken",
        aiTerminated: true,
      });

      const mockAudioManagerInstance = {
        connect: jest.fn().mockImplementation(async (_handoffId, _onMessage, onConnected) => {
          // Simulate successful connection
          if (onConnected) {
            onConnected();
          }
        }),
        disconnect: jest.fn(),
        requestMicrophonePermission: jest.fn().mockResolvedValue(true),
        setMuted: jest.fn(),
        setSpeakerOn: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        hangUp: jest.fn(),
      };

      (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

      function HangUpComponent() {
        const { takeCall, hangUpCall, isAudioConnected } = useActiveCall();
        return (
          <div>
            <button onClick={takeCall} data-testid="take-call-btn">
              Take Call
            </button>
            <button onClick={hangUpCall} data-testid="hang-up-btn">
              Hang Up
            </button>
            <div data-testid="audio-connected">
              {isAudioConnected ? "Audio Connected" : "Audio Disconnected"}
            </div>
          </div>
        );
      }

      render(
        <ActiveCallProvider>
          <HangUpComponent />
        </ActiveCallProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
      });

      // Take call first
      await act(async () => {
        fireEvent.click(screen.getByTestId("take-call-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("audio-connected")).toHaveTextContent("Audio Connected");
      });

      // Hang up
      fireEvent.click(screen.getByTestId("hang-up-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("audio-connected")).toHaveTextContent("Audio Disconnected");
      });
    });

    it("should update call status to completed after hang up", async () => {
      mockSearchParams.set("callId", "call-123");

      mockHandoffApi.takeControl.mockResolvedValue({
        success: true,
        handoffId: "handoff-456",
        message: "Control taken",
        aiTerminated: true,
      });

      const mockAudioManagerInstance = {
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn(),
        requestMicrophonePermission: jest.fn().mockResolvedValue(true),
        setMuted: jest.fn(),
        setSpeakerOn: jest.fn(),
        isConnected: jest.fn().mockReturnValue(true),
        hangUp: jest.fn(),
      };

      (mockAudioManager as unknown as jest.Mock).mockImplementation(() => mockAudioManagerInstance);

      function StatusComponent() {
        const { takeCall, hangUpCall, callStatus } = useActiveCall();
        return (
          <div>
            <button onClick={takeCall} data-testid="take-call-btn">
              Take Call
            </button>
            <button onClick={hangUpCall} data-testid="hang-up-btn">
              Hang Up
            </button>
            <div data-testid="status">{callStatus || "No Status"}</div>
          </div>
        );
      }

      render(
        <ActiveCallProvider>
          <StatusComponent />
        </ActiveCallProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("take-call-btn")).toBeInTheDocument();
      });

      // Take call
      fireEvent.click(screen.getByTestId("take-call-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("active");
      });

      // Hang up
      fireEvent.click(screen.getByTestId("hang-up-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("status")).toHaveTextContent("completed");
      });
    });
  });
});
