/**
 * MSW Users Handlers
 *
 * Mock API handlers for user management endpoints
 */

import { http, HttpResponse } from 'msw';
import {
  mockUsersList,
  mockUserErrors,
  filterUsers,
  paginateUsers,
} from '../data/users.fixtures';
import { mockErrorResponses } from '../data/auth.fixtures';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
} from '@/types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// In-memory store for testing (resets between tests)
let usersStore = [...mockUsersList];

/**
 * User Management API Handlers
 */
export const usersHandlers = [
  /**
   * GET /api/v1/users
   * Get list of users with pagination and filters
   */
  http.get(`${API_BASE_URL}/api/v1/users`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const role = url.searchParams.get('role') as 'ADMIN' | 'OPERATOR' | null;
    const isActive = url.searchParams.get('isActive');
    const search = url.searchParams.get('search');

    // Build filters
    const filters: {
      role?: 'ADMIN' | 'OPERATOR';
      isActive?: boolean;
      search?: string;
    } = {};
    if (role) filters.role = role;
    if (isActive !== null) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    // Filter and paginate
    const filteredUsers = filterUsers(usersStore, filters);
    const paginatedResponse = paginateUsers(filteredUsers, page, limit);

    return HttpResponse.json(paginatedResponse, { status: 200 });
  }),

  /**
   * GET /api/v1/users/:id
   * Get a specific user by ID
   */
  http.get(`${API_BASE_URL}/api/v1/users/:id`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const { id } = params;
    const user = usersStore.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(mockUserErrors.userNotFound, { status: 404 });
    }

    return HttpResponse.json(user, { status: 200 });
  }),

  /**
   * POST /api/v1/auth/register
   * Create a new user (admin only)
   */
  http.post(`${API_BASE_URL}/api/v1/auth/register`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const body = (await request.json()) as CreateUserRequest;
    const { employeeId, fullName, password, role } = body;

    // Check for duplicate employee ID
    const existingUser = usersStore.find((u) => u.employeeId === employeeId);
    if (existingUser) {
      return HttpResponse.json(mockUserErrors.duplicateEmployeeId, { status: 409 });
    }

    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return HttpResponse.json(mockUserErrors.weakPassword, { status: 400 });
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      employeeId,
      fullName,
      role,
      operatorId: role === 'OPERATOR' ? `OP-${Date.now()}` : null,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
    };

    usersStore.push(newUser);

    return HttpResponse.json(newUser, { status: 201 });
  }),

  /**
   * PATCH /api/v1/users/:id
   * Update a user (admin only)
   */
  http.patch(`${API_BASE_URL}/api/v1/users/:id`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json()) as UpdateUserRequest;

    const userIndex = usersStore.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return HttpResponse.json(mockUserErrors.userNotFound, { status: 404 });
    }

    // Update user
    usersStore[userIndex] = {
      ...usersStore[userIndex],
      ...body,
    };

    return HttpResponse.json(usersStore[userIndex], { status: 200 });
  }),

  /**
   * DELETE /api/v1/users/:id
   * Deactivate a user (soft delete)
   */
  http.delete(`${API_BASE_URL}/api/v1/users/:id`, ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const { id } = params;
    const userIndex = usersStore.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return HttpResponse.json(mockUserErrors.userNotFound, { status: 404 });
    }

    // Deactivate user (soft delete)
    usersStore[userIndex].isActive = false;

    return HttpResponse.json(
      { message: 'User deactivated successfully' },
      { status: 200 }
    );
  }),

  /**
   * POST /api/v1/users/:id/reset-password
   * Reset a user's password (admin only)
   */
  http.post(`${API_BASE_URL}/api/v1/users/:id/reset-password`, async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(mockErrorResponses.unauthorized, { status: 401 });
    }

    const { id } = params;
    const body = (await request.json()) as ResetPasswordRequest;
    const { newPassword } = body;

    const user = usersStore.find((u) => u.id === id);

    if (!user) {
      return HttpResponse.json(mockUserErrors.userNotFound, { status: 404 });
    }

    // Validate password strength
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return HttpResponse.json(mockUserErrors.weakPassword, { status: 400 });
    }

    return HttpResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  }),
];

/**
 * Helper to reset users store (for testing)
 */
export function resetUsersStore() {
  usersStore = [...mockUsersList];
}
