// Responder/Emergency operator authentication
interface LoginRequest {
  responderId: string; // Emergency responder ID
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  responder: ResponderProfile;
}

interface ResponderProfile {
  id: string;
  responderId: string;
  name: string;
  role: "responder" | "supervisor" | "admin";
  department: string;
  shift?: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export type {
  LoginRequest,
  LoginResponse,
  ResponderProfile,
  TokenData,
  RefreshTokenResponse,
};
