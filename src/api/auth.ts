import { api } from "@/lib/api-client";
import type {
  LoginRequest,
  LoginResponse,
  User,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "@/types/auth";

/**
 * Authenticate a user with their employee ID and password
 * Backend: POST /api/v1/auth/login
 * @param credentials - Employee ID and password
 * @returns Login response with access token (refresh token is set as httpOnly cookie)
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", credentials);
  return response.data;
}

/**
 * Logout the current user from this device
 * Backend: POST /api/v1/auth/logout
 * Revokes the refresh token for this device and clears the cookie
 */
export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

/**
 * Logout the current user from all devices
 * Backend: POST /api/v1/auth/logout-all
 * Revokes all refresh tokens for the user
 */
export async function logoutAll(): Promise<void> {
  await api.post("/auth/logout-all");
}

/**
 * Get current authenticated user profile
 * Backend: GET /api/v1/auth/me
 * @returns Current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/auth/me");
  return response.data;
}

/**
 * Change the current user's password
 * Backend: PATCH /api/v1/auth/change-password
 * @param data - Old password and new password
 * @returns Success message
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const response = await api.patch<ChangePasswordResponse>(
    "/auth/change-password",
    data
  );
  return response.data;
}
