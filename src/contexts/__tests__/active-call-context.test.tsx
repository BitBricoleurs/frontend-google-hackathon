/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from "@testing-library/react";
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
});
