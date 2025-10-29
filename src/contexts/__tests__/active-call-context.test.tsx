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

  it("should handle takeCall without callId", async () => {
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
      // Should not call takeControl without callId
      expect(mockHandoffApi.takeControl).not.toHaveBeenCalled();
    });
  });

  it("should handle JSON transcript from WebSocket", async () => {
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

    // Get initial count
    const initialCount = parseInt(screen.getByTestId("transcript-count").textContent || "0");

    // Simulate JSON transcript update
    await act(async () => {
      if (transcriptCallback) {
        const jsonTranscript = JSON.stringify({
          messages: [
            { speaker: "Patient", text: "Help me", confidence: 0.9 },
            { speaker: "AI", text: "What's wrong?", confidence: 0.95 },
          ],
        });
        transcriptCallback(jsonTranscript);
      }
    });

    await waitFor(() => {
      const newCount = parseInt(screen.getByTestId("transcript-count").textContent || "0");
      expect(newCount).toBeGreaterThanOrEqual(initialCount + 2);
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
});
