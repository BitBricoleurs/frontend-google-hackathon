export type MessageSpeaker = "caller" | "ai-agent" | "operator";
export type MessageEmotion = "calm" | "distress" | "panic" | "neutral";
export type CallStatus = "waiting" | "active" | "ended";
export type CallPriority = "low" | "medium" | "high" | "critical";
export type InsightSeverity = "info" | "high" | "critical";

export interface ChatMessage {
  id: string;
  speaker: MessageSpeaker;
  text: string;
  timestamp: string;
  emotion: MessageEmotion;
  createdAt: Date;
}

export interface CallerInfo {
  id: string;
  name: string;
  phoneNumber: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  previousCalls: number;
  language?: string;
}

export interface AIInsight {
  id: string;
  type: "medical" | "emotion" | "location" | "general";
  title: string;
  details: string[];
  severity: InsightSeverity;
  detectedAt: Date;
}

export interface Call {
  id: string;
  caller: CallerInfo;
  status: CallStatus;
  priority: CallPriority;
  startTime: Date;
  endTime?: Date;
  duration: string;
  transcript: ChatMessage[];
  aiInsights: AIInsight[];
  emotionalState?: string;
  keywords?: string[];
}

export interface ChatState {
  activeCall: Call | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
}
