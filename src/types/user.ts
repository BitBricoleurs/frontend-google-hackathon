import type { UserRole } from "./auth";

/**
 * User management types for admin operations
 */

/**
 * User entity (same as auth User but re-exported for clarity)
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
 * Filters for listing users
 */
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Create user request (uses auth/register endpoint)
 */
export interface CreateUserRequest {
  employeeId: string;
  fullName: string;
  password: string;
  role: UserRole;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Reset password request (admin action)
 */
export interface ResetPasswordRequest {
  newPassword: string;
}

/**
 * User list query parameters (combines filters and pagination)
 */
export interface UserListParams extends UserFilters, PaginationParams {}
