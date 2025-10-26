import { api } from "@/lib/api-client";

/**
 * Transcript API
 * Handles all transcript-related API calls following the OpenAPI spec
 */

// Types based on OpenAPI spec
export interface TranscriptMessage {
  index: number;
  timestamp: string | null;
  speaker: string;
  text: string;
  confidence: number | null;
}

export interface TranscriptData {
  callId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  basicTranscript: string | null;
  structuredTranscript: object | null;
  patient: object | null;
}

export interface FormattedTranscriptData {
  callId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  duration: number | null;
  messages: TranscriptMessage[];
  patient: object | null;
}

export interface TranscriptStats {
  callId: string;
  hasTranscript: boolean;
  hasStructuredTranscript: boolean;
  wordCount: number;
  lineCount: number;
  characterCount: number;
  estimatedReadingTimeMinutes: number;
  duration: number | null;
}

export interface TranscriptResponse {
  success: boolean;
  data: TranscriptData;
}

export interface FormattedTranscriptResponse {
  success: boolean;
  data: FormattedTranscriptData;
}

export interface TranscriptStatsResponse {
  success: boolean;
  data: TranscriptStats;
}

export interface SearchTranscriptsResponse {
  success: boolean;
  data: Array<{
    callId: string;
    status: string;
    startedAt: string;
    endedAt: string | null;
    patient: object | null;
    priority: string | null;
    chiefComplaint: string | null;
    transcriptExcerpt: string;
  }>;
  count: number;
  keyword: string;
}

/**
 * Get basic and structured transcript for a call
 * Backend: GET /api/v1/transcripts/{callId}
 */
export async function getTranscript(callId: string): Promise<TranscriptData> {
  const response = await api.get<TranscriptResponse>(`/transcripts/${callId}`);
  return response.data.data;
}

/**
 * Get formatted transcript with speaker labels and timestamps
 * Backend: GET /api/v1/transcripts/{callId}/formatted
 */
export async function getFormattedTranscript(callId: string): Promise<FormattedTranscriptData> {
  const response = await api.get<FormattedTranscriptResponse>(`/transcripts/${callId}/formatted`);
  return response.data.data;
}

/**
 * Get transcript statistics
 * Backend: GET /api/v1/transcripts/{callId}/stats
 */
export async function getTranscriptStats(callId: string): Promise<TranscriptStats> {
  const response = await api.get<TranscriptStatsResponse>(`/transcripts/${callId}/stats`);
  return response.data.data;
}

/**
 * Retry fetching transcript from ElevenLabs (if initial save failed)
 * Backend: POST /api/v1/transcripts/{callId}/retry
 */
export async function retryTranscriptFetch(
  callId: string
): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>(
    `/transcripts/${callId}/retry`
  );
  return response.data;
}

/**
 * Search transcripts by keyword
 * Backend: GET /api/v1/transcripts/search
 */
export async function searchTranscripts(
  keyword: string,
  limit = 50,
  offset = 0
): Promise<SearchTranscriptsResponse> {
  const response = await api.get<SearchTranscriptsResponse>(
    `/transcripts/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`
  );
  return response.data;
}
