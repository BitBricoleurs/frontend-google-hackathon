/**
 * MSW Auth Handlers
 *
 * Mock API handlers for authentication endpoints
 */

import { http, HttpResponse } from "msw";
import {
  mockUsers,
  mockTokens,
  mockErrorResponses,
  validateCredentials,
} from "../data/auth.fixtures";
import type { LoginRequest, ChangePasswordRequest } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Auth API Handlers
 */
export const authHandlers = [
  /**
   * POST /api/v1/auth/login
   * Login with employee ID and password
   */
  http.post(`${API_BASE_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    const { employeeId, password } = body;

    // Validate credentials
    const user = validateCredentials(employeeId, password);

    if (!user) {
      return HttpResponse.json(mockErrorResponses.invalidCredentials, { status: 401 });
    }

    // Check if account is active
    if (!user.isActive) {
      return HttpResponse.json(mockErrorResponses.accountInactive, { status: 403 });
    }

    // Return successful login response
    return HttpResponse.json(
      {
        accessToken: mockTokens.accessToken,
        tokenType: "Bearer",
        expiresIn: 900, // 15 minutes
      },
      { status: 200 }
    );
  }),

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  http.get(`${API_BASE_URL}/api/v1/auth/me`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    // Check for authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Check for expired token
    if (token === mockTokens.expiredToken) {
      return HttpResponse.json(mockErrorResponses.tokenExpired, { status: 401 });
    }

    // Return default admin user for valid token
    return HttpResponse.json(mockUsers.admin, { status: 200 });
  }),

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token cookie
   */
  http.post(`${API_BASE_URL}/api/v1/auth/refresh`, ({ request }) => {
    const cookieHeader = request.headers.get("Cookie");

    // Check for refresh token in cookies
    if (!cookieHeader || !cookieHeader.includes("refreshToken=")) {
      return HttpResponse.json(
        { error: { code: "NO_REFRESH_TOKEN", message: "No refresh token found" } },
        { status: 401 }
      );
    }

    // Return new access token
    return HttpResponse.json(
      {
        accessToken: mockTokens.newAccessToken,
        tokenType: "Bearer",
        expiresIn: 900,
      },
      { status: 200 }
    );
  }),

  /**
   * POST /api/v1/auth/logout
   * Logout from current device
   */
  http.post(`${API_BASE_URL}/api/v1/auth/logout`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    // Successful logout
    return HttpResponse.json({ message: "Logged out successfully" }, { status: 200 });
  }),

  /**
   * POST /api/v1/auth/logout-all
   * Logout from all devices
   */
  http.post(`${API_BASE_URL}/api/v1/auth/logout-all`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    // Successful logout from all devices
    return HttpResponse.json(
      { message: "Logged out from all devices successfully" },
      { status: 200 }
    );
  }),

  /**
   * PATCH /api/v1/auth/change-password
   * Change user password
   */
  http.patch(`${API_BASE_URL}/api/v1/auth/change-password`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const body = (await request.json()) as ChangePasswordRequest;
    const { oldPassword, newPassword } = body;

    // Validate current password (mock validation)
    if (oldPassword !== "OldPassword@123") {
      return HttpResponse.json(
        {
          error: {
            code: "INVALID_PASSWORD",
            message: "Current password is incorrect",
          },
        },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return HttpResponse.json(
        {
          error: {
            code: "WEAK_PASSWORD",
            message: "Password must be at least 8 characters",
          },
        },
        { status: 400 }
      );
    }

    // Successful password change
    return HttpResponse.json({ message: "Password changed successfully" }, { status: 200 });
  }),
];
