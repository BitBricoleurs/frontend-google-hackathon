/**
 * Auth Mock Data Fixtures
 *
 * Mock data for authentication tests
 */

import type { User } from '@/types/auth';

/**
 * Mock users for authentication
 */
export const mockUsers = {
  admin: {
    id: '1',
    employeeId: 'ADMIN001',
    fullName: 'John Admin',
    role: 'ADMIN' as const,
    operatorId: null,
    isActive: true,
    lastLoginAt: new Date('2024-10-20T10:30:00Z'),
    createdAt: new Date('2024-01-15T08:00:00Z'),
  },
  operator: {
    id: '2',
    employeeId: 'OPER001',
    fullName: 'Jane Operator',
    role: 'OPERATOR' as const,
    operatorId: 'OP-12345',
    isActive: true,
    lastLoginAt: new Date('2024-10-21T09:15:00Z'),
    createdAt: new Date('2024-02-10T09:00:00Z'),
  },
  inactive: {
    id: '3',
    employeeId: 'INACT001',
    fullName: 'Inactive User',
    role: 'OPERATOR' as const,
    operatorId: 'OP-11111',
    isActive: false,
    lastLoginAt: new Date('2024-09-15T12:00:00Z'),
    createdAt: new Date('2024-01-10T08:00:00Z'),
  },
};

/**
 * Mock credentials for testing
 */
export const mockCredentials = {
  admin: {
    employeeId: 'ADMIN001',
    password: 'AdminPassword@123',
  },
  operator: {
    employeeId: 'OPER001',
    password: 'OperatorPassword@123',
  },
  inactive: {
    employeeId: 'INACT001',
    password: 'InactivePassword@123',
  },
};

/**
 * Mock tokens
 */
export const mockTokens = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  expiredToken: 'mock-expired-token',
  newAccessToken: 'mock-new-access-token-54321',
};

/**
 * Mock error responses
 */
export const mockErrorResponses = {
  invalidCredentials: {
    error: {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid employee ID or password',
    },
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/login',
  },
  accountInactive: {
    error: {
      code: 'ACCOUNT_INACTIVE',
      message: 'Your account has been deactivated. Please contact an administrator.',
    },
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/login',
  },
  unauthorized: {
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    },
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/me',
  },
  tokenExpired: {
    error: {
      code: 'TOKEN_EXPIRED',
      message: 'Access token has expired',
    },
    timestamp: new Date().toISOString(),
    path: '/api/v1/auth/me',
  },
};

/**
 * Validate credentials helper
 */
export function validateCredentials(employeeId: string, password: string): User | null {
  if (employeeId === mockCredentials.admin.employeeId && password === mockCredentials.admin.password) {
    return mockUsers.admin;
  }
  if (employeeId === mockCredentials.operator.employeeId && password === mockCredentials.operator.password) {
    return mockUsers.operator;
  }
  if (employeeId === mockCredentials.inactive.employeeId && password === mockCredentials.inactive.password) {
    return mockUsers.inactive;
  }
  return null;
}

/**
 * Get user by employee ID helper
 */
export function getUserByEmployeeId(employeeId: string): User | null {
  const user = Object.values(mockUsers).find((u) => u.employeeId === employeeId);
  return user || null;
}
