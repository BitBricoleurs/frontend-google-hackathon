// Authentication types matching backend API

/**
 * User role types as defined in the backend
 */
export type UserRole = "OPERATOR" | "ADMIN";

/**
 * User entity matching backend User model
 */
export interface User {
  id: string;
  employeeId: string;
  fullName: string;
  role: UserRole;
  operatorId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  employeeId: string;
  password: string;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // in seconds
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // in seconds
}

/**
 * Change password request payload
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * Change password response
 */
export interface ChangePasswordResponse {
  message: string;
}

/**
 * Backend error response format
 */
export interface AuthErrorResponse {
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
  path: string;
}

// Legacy type alias for backward compatibility
// TODO: Remove once all components are updated
export type ResponderProfile = User;
