import type { Call, ChatMessage, AIInsight } from "@/types/chat";

// Helper to create timestamps
const createTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `00:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// Mock Call 1 - High Priority Medical Emergency
const call1Transcript: ChatMessage[] = [
  {
    id: "1-1",
    speaker: "caller",
    text: "Hello? I need help! My father collapsed!",
    timestamp: createTimestamp(12),
    emotion: "distress",
    createdAt: new Date(Date.now() - 230000),
  },
  {
    id: "1-2",
    speaker: "ai-agent",
    text: "I understand you need emergency assistance. Can you tell me your exact location?",
    timestamp: createTimestamp(18),
    emotion: "calm",
    createdAt: new Date(Date.now() - 224000),
  },
  {
    id: "1-3",
    speaker: "caller",
    text: "We're at 123 Main Street, apartment 4B. He's not breathing!",
    timestamp: createTimestamp(24),
    emotion: "panic",
    createdAt: new Date(Date.now() - 218000),
  },
  {
    id: "1-4",
    speaker: "ai-agent",
    text: "Emergency services have been dispatched to 123 Main Street, apartment 4B. Help is on the way. Is your father conscious?",
    timestamp: createTimestamp(32),
    emotion: "calm",
    createdAt: new Date(Date.now() - 210000),
  },
  {
    id: "1-5",
    speaker: "caller",
    text: "No, he's not responding! What should I do?",
    timestamp: createTimestamp(38),
    emotion: "distress",
    createdAt: new Date(Date.now() - 204000),
  },
];

const call1Insights: AIInsight[] = [
  {
    id: "i1-1",
    type: "medical",
    title: "Medical Keywords Detected",
    details: ["collapsed", "not breathing", "not responding"],
    severity: "critical",
    detectedAt: new Date(Date.now() - 218000),
  },
  {
    id: "i1-2",
    type: "emotion",
    title: "Emotional State Analysis",
    details: ["High distress detected", "Panic indicators present"],
    severity: "high",
    detectedAt: new Date(Date.now() - 220000),
  },
  {
    id: "i1-3",
    type: "location",
    title: "Location Confirmed",
    details: ["123 Main Street, Apt 4B", "Coordinates: 40.7128°N, 74.0060°W"],
    severity: "info",
    detectedAt: new Date(Date.now() - 218000),
  },
];

// Mock Call 2 - Fire Emergency
const call2Transcript: ChatMessage[] = [
  {
    id: "2-1",
    speaker: "caller",
    text: "There's a fire in my apartment! I can see smoke!",
    timestamp: createTimestamp(8),
    emotion: "panic",
    createdAt: new Date(Date.now() - 180000),
  },
  {
    id: "2-2",
    speaker: "ai-agent",
    text: "Stay calm. Have you evacuated the building? Are you in a safe location?",
    timestamp: createTimestamp(14),
    emotion: "calm",
    createdAt: new Date(Date.now() - 174000),
  },
  {
    id: "2-3",
    speaker: "caller",
    text: "I'm in the hallway but there's smoke coming from under my neighbor's door!",
    timestamp: createTimestamp(22),
    emotion: "distress",
    createdAt: new Date(Date.now() - 166000),
  },
  {
    id: "2-4",
    speaker: "ai-agent",
    text: "Fire department is on the way to 456 Oak Avenue. Please evacuate the building immediately. Do not use the elevator.",
    timestamp: createTimestamp(30),
    emotion: "calm",
    createdAt: new Date(Date.now() - 158000),
  },
];

const call2Insights: AIInsight[] = [
  {
    id: "i2-1",
    type: "medical",
    title: "Fire Emergency Detected",
    details: ["fire", "smoke", "apartment building"],
    severity: "critical",
    detectedAt: new Date(Date.now() - 180000),
  },
  {
    id: "i2-2",
    type: "emotion",
    title: "Emotional State Analysis",
    details: ["Extreme panic detected", "Immediate danger"],
    severity: "critical",
    detectedAt: new Date(Date.now() - 174000),
  },
  {
    id: "i2-3",
    type: "location",
    title: "Location Confirmed",
    details: ["456 Oak Avenue", "Coordinates: 40.7489°N, 73.9680°W"],
    severity: "info",
    detectedAt: new Date(Date.now() - 166000),
  },
];

// Mock Call 3 - Car Accident
const call3Transcript: ChatMessage[] = [
  {
    id: "3-1",
    speaker: "caller",
    text: "I just witnessed a car accident on Highway 101!",
    timestamp: createTimestamp(5),
    emotion: "distress",
    createdAt: new Date(Date.now() - 150000),
  },
  {
    id: "3-2",
    speaker: "ai-agent",
    text: "Thank you for calling. Can you tell me the exact location and how many vehicles are involved?",
    timestamp: createTimestamp(11),
    emotion: "calm",
    createdAt: new Date(Date.now() - 144000),
  },
  {
    id: "3-3",
    speaker: "caller",
    text: "It's near exit 42, two cars collided. People are getting out of the cars.",
    timestamp: createTimestamp(18),
    emotion: "neutral",
    createdAt: new Date(Date.now() - 137000),
  },
  {
    id: "3-4",
    speaker: "ai-agent",
    text: "Emergency services are being dispatched to Highway 101 near exit 42. Are there any visible injuries?",
    timestamp: createTimestamp(26),
    emotion: "calm",
    createdAt: new Date(Date.now() - 129000),
  },
  {
    id: "3-5",
    speaker: "caller",
    text: "One person is holding their arm, but everyone is standing.",
    timestamp: createTimestamp(32),
    emotion: "calm",
    createdAt: new Date(Date.now() - 123000),
  },
];

const call3Insights: AIInsight[] = [
  {
    id: "i3-1",
    type: "medical",
    title: "Traffic Accident Keywords",
    details: ["car accident", "highway", "collision", "injuries"],
    severity: "high",
    detectedAt: new Date(Date.now() - 150000),
  },
  {
    id: "i3-2",
    type: "emotion",
    title: "Emotional State Analysis",
    details: ["Caller stabilizing", "Witness reporting"],
    severity: "info",
    detectedAt: new Date(Date.now() - 137000),
  },
  {
    id: "i3-3",
    type: "location",
    title: "Location Confirmed",
    details: ["Highway 101, Exit 42", "Coordinates: 37.7749°N, 122.4194°W"],
    severity: "info",
    detectedAt: new Date(Date.now() - 137000),
  },
];

// Mock Call 4 - Domestic Disturbance (waiting in queue)
const call4Transcript: ChatMessage[] = [];

const call4Insights: AIInsight[] = [];

// Mock Call 5 - Medical Emergency (waiting in queue)
const call5Transcript: ChatMessage[] = [];

const call5Insights: AIInsight[] = [];

// Mock Calls Database
export const mockCalls: Call[] = [
  {
    id: "call-001",
    caller: {
      id: "caller-001",
      name: "Unknown Caller",
      phoneNumber: "+1 (555) 789-0123",
      location: "123 Main Street, Apt 4B",
      coordinates: { lat: 40.7128, lng: -74.006 },
      previousCalls: 0,
      language: "Spanish",
    },
    status: "active",
    priority: "high",
    startTime: new Date(Date.now() - 240000),
    duration: "00:04:00",
    transcript: call1Transcript,
    aiInsights: call1Insights,
    emotionalState: "High Distress",
    keywords: ["collapsed", "not breathing", "emergency"],
  },
  {
    id: "call-002",
    caller: {
      id: "caller-002",
      name: "Sarah Martinez",
      phoneNumber: "+1 (555) 234-5678",
      location: "456 Oak Avenue",
      coordinates: { lat: 40.7489, lng: -73.968 },
      previousCalls: 1,
      language: "English",
    },
    status: "waiting",
    priority: "critical",
    startTime: new Date(Date.now() - 190000),
    duration: "00:03:10",
    transcript: call2Transcript,
    aiInsights: call2Insights,
    emotionalState: "Panic",
    keywords: ["fire", "smoke", "building"],
  },
  {
    id: "call-003",
    caller: {
      id: "caller-003",
      name: "John Doe",
      phoneNumber: "+1 (555) 876-5432",
      location: "Highway 101, Exit 42",
      coordinates: { lat: 37.7749, lng: -122.4194 },
      previousCalls: 0,
      language: "English",
    },
    status: "waiting",
    priority: "high",
    startTime: new Date(Date.now() - 160000),
    duration: "00:02:40",
    transcript: call3Transcript,
    aiInsights: call3Insights,
    emotionalState: "Stable",
    keywords: ["accident", "highway", "collision"],
  },
  {
    id: "call-004",
    caller: {
      id: "caller-004",
      name: "Emily Chen",
      phoneNumber: "+1 (555) 345-6789",
      location: "789 Pine Street",
      coordinates: { lat: 40.7589, lng: -73.9851 },
      previousCalls: 2,
      language: "English",
    },
    status: "waiting",
    priority: "medium",
    startTime: new Date(Date.now() - 120000),
    duration: "00:02:00",
    transcript: call4Transcript,
    aiInsights: call4Insights,
    emotionalState: "Concerned",
    keywords: ["noise", "disturbance", "neighbor"],
  },
  {
    id: "call-005",
    caller: {
      id: "caller-005",
      name: "Robert Johnson",
      phoneNumber: "+1 (555) 987-6543",
      location: "321 Elm Drive",
      coordinates: { lat: 40.7282, lng: -73.9942 },
      previousCalls: 0,
      language: "English",
    },
    status: "waiting",
    priority: "high",
    startTime: new Date(Date.now() - 90000),
    duration: "00:01:30",
    transcript: call5Transcript,
    aiInsights: call5Insights,
    emotionalState: "Distressed",
    keywords: ["chest pain", "difficulty breathing"],
  },
];

// Helper function to get calls by status
export const getCallsByStatus = (status: "waiting" | "active" | "ended") => {
  return mockCalls.filter((call) => call.status === status);
};

// Helper function to get a specific call by ID
export const getCallById = (callId: string) => {
  return mockCalls.find((call) => call.id === callId);
};

// Helper function to get waiting queue sorted by priority
export const getWaitingQueue = () => {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return mockCalls
    .filter((call) => call.status === "waiting")
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};
