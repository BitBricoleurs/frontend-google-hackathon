interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
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
  RegisterRequest,
  TokenData,
  RefreshTokenResponse,
};
