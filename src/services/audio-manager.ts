/**
 * AudioManager - Handles WebSocket audio streaming for operator calls
 * Based on the test-elevenlabs-web.html implementation
 */

export type AudioMessageType =
  | "connected"
  | "conversation_initiation_metadata"
  | "audio"
  | "operator_audio"
  | "patient_audio"
  | "user_transcript"
  | "agent_response"
  | "agent_response_correction"
  | "interruption"
  | "ai_terminated"
  | "handoff_context"
  | "transcript"
  | "error";

export interface AudioMessage {
  type: AudioMessageType;
  audio_event?: {
    audio_base_64: string;
  };
  audio_base_64?: string;
  user_transcription_event?: {
    user_transcript: string;
  };
  agent_response_event?: {
    agent_response: string;
  };
  agent_response_correction_event?: {
    corrected_agent_response: string;
  };
  interruption_event?: {
    reason: string;
  };
  message?: string;
}

export class AudioManager {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioQueue: string[] = [];
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private isSpeakerOn: boolean = true;

  // Callbacks
  private onMessageCallback?: (message: AudioMessage) => void;
  private onConnectedCallback?: () => void;
  private onDisconnectedCallback?: () => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    // Empty constructor
  }

  /**
   * Connect to the WebSocket audio stream for a call
   * @param handoffId - The handoff ID returned from the take-control API
   */
  async connect(
    handoffId: string,
    onMessage?: (message: AudioMessage) => void,
    onConnected?: () => void,
    onDisconnected?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    this.onMessageCallback = onMessage;
    this.onConnectedCallback = onConnected;
    this.onDisconnectedCallback = onDisconnected;
    this.onErrorCallback = onError;

    try {
      // Get WebSocket URL from environment or use default
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:8080";
      const fullWsUrl = `${wsUrl}/ws/operator?handoffId=${handoffId}`;

      // Create AudioContext immediately (needed for audio playback)
      if (!this.audioContext) {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        this.audioContext = new AudioContextClass({
          sampleRate: 16000,
        });
      }

      this.ws = new WebSocket(fullWsUrl);

      this.ws.onopen = () => {
        this.onConnectedCallback?.();
        // Start audio capture after connection
        this.startAudioCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: AudioMessage = JSON.parse(event.data);

          // Handle audio playback
          if (message.type === "audio" && message.audio_event?.audio_base_64) {
            this.playAudioResponse(message.audio_event.audio_base_64);
          } else if (message.type === "operator_audio" && message.audio_base_64) {
            this.playAudioResponse(message.audio_base_64);
          } else if (message.type === "patient_audio" && message.audio_base_64) {
            // Patient audio from the handoff
            this.playAudioResponse(message.audio_base_64);
          }

          // Pass message to callback
          this.onMessageCallback?.(message);
        } catch (err) {
          this.onErrorCallback?.(
            `Error parsing message: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }
      };

      this.ws.onerror = () => {
        this.onErrorCallback?.("WebSocket connection error");
      };

      this.ws.onclose = () => {
        this.onDisconnectedCallback?.();
        this.cleanup();
      };
    } catch (error) {
      this.onErrorCallback?.(error instanceof Error ? error.message : "Connection failed");
      throw error;
    }
  }

  /**
   * Request microphone permission (call this before connecting)
   */
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just wanted to get permission
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      this.onErrorCallback?.(error instanceof Error ? error.message : "Microphone access denied");
      return false;
    }
  }

  /**
   * Start capturing audio from the microphone
   */
  private async startAudioCapture(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context with 16kHz sample rate (ElevenLabs standard)
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: 16000,
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      this.audioProcessor.onaudioprocess = (e) => {
        // Only send audio if not muted and WebSocket is open
        if (!this.isMuted && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const audioData = e.inputBuffer.getChannelData(0);

          // Convert Float32Array to Int16Array (PCM 16-bit)
          const pcm16 = new Int16Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            const s = Math.max(-1, Math.min(1, audioData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Convert to base64
          const base64Audio = btoa(
            String.fromCharCode.apply(null, Array.from(new Uint8Array(pcm16.buffer)))
          );

          // Send to backend
          this.ws.send(
            JSON.stringify({
              type: "audio",
              audio_base_64: base64Audio,
            })
          );
        }
      };
    } catch (error) {
      this.onErrorCallback?.(error instanceof Error ? error.message : "Microphone access denied");
    }
  }

  /**
   * Play audio response from the server
   */
  private async playAudioResponse(base64Audio: string): Promise<void> {
    try {
      // Don't play if speaker is off
      if (!this.isSpeakerOn) {
        return;
      }

      // Add to queue
      this.audioQueue.push(base64Audio);

      // If already playing, return
      if (this.isPlaying) {
        return;
      }

      // Start playing
      this.isPlaying = true;
      await this.playNextInQueue();
    } catch {
      this.isPlaying = false;
    }
  }

  /**
   * Play next audio chunk in the queue
   */
  private async playNextInQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    const base64Audio = this.audioQueue.shift()!;

    try {
      if (!this.audioContext) {
        throw new Error("AudioContext not initialized");
      }

      // Decode base64
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM 16-bit to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      // Create AudioBuffer (mono, 16kHz)
      const audioBuffer = this.audioContext.createBuffer(1, float32.length, 16000);
      audioBuffer.getChannelData(0).set(float32);

      // Create source and play
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      // When this chunk ends, play the next one
      source.onended = () => {
        this.playNextInQueue();
      };

      source.start(0);
    } catch {
      // Continue with next chunk even if this one failed
      this.playNextInQueue();
    }
  }

  /**
   * Mute/unmute the microphone
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;

    // Also mute/unmute the media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Enable/disable speaker output
   */
  setSpeakerOn(speakerOn: boolean): void {
    this.isSpeakerOn = speakerOn;

    // Clear audio queue if turning off speaker
    if (!speakerOn) {
      this.audioQueue = [];
      this.isPlaying = false;
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.cleanup();
  }

  /**
   * Cleanup audio resources
   */
  private cleanup(): void {
    // Stop audio processor
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear audio queue
    this.audioQueue = [];
    this.isPlaying = false;
  }
}
