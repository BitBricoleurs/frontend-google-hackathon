/**
 * Users Mock Data Fixtures
 *
 * Mock data for user management tests
 */

import { User, PaginatedResponse, UpdateUserRequest, ResetPasswordRequest } from "@/types/user";

/**
 * Mock users list with various roles and states
 */
export const mockUsersList: User[] = [
  {
    id: "1",
    employeeId: "ADMIN001",
    fullName: "John Admin",
    role: "ADMIN",
    operatorId: null,
    isActive: true,
    lastLoginAt: new Date("2024-10-20T10:30:00Z"),
    createdAt: new Date("2024-01-15T08:00:00Z"),
  },
  {
    id: "2",
    employeeId: "OPER001",
    fullName: "Jane Operator",
    role: "OPERATOR",
    operatorId: "OP-12345",
    isActive: true,
    lastLoginAt: new Date("2024-10-21T09:15:00Z"),
    createdAt: new Date("2024-02-10T09:00:00Z"),
  },
  {
    id: "3",
    employeeId: "ADMIN002",
    fullName: "Sarah Admin",
    role: "ADMIN",
    operatorId: null,
    isActive: true,
    lastLoginAt: new Date("2024-10-19T14:20:00Z"),
    createdAt: new Date("2024-01-20T10:00:00Z"),
  },
  {
    id: "4",
    employeeId: "OPER002",
    fullName: "Bob Operator",
    role: "OPERATOR",
    operatorId: "OP-67890",
    isActive: true,
    lastLoginAt: new Date("2024-10-21T08:00:00Z"),
    createdAt: new Date("2024-03-05T11:00:00Z"),
  },
  {
    id: "5",
    employeeId: "INACT001",
    fullName: "Inactive User",
    role: "OPERATOR",
    operatorId: "OP-11111",
    isActive: false,
    lastLoginAt: new Date("2024-09-15T12:00:00Z"),
    createdAt: new Date("2024-01-10T08:00:00Z"),
  },
  {
    id: "6",
    employeeId: "OPER003",
    fullName: "Alice Operator",
    role: "OPERATOR",
    operatorId: "OP-22222",
    isActive: true,
    lastLoginAt: new Date("2024-10-20T16:45:00Z"),
    createdAt: new Date("2024-04-12T09:30:00Z"),
  },
  {
    id: "7",
    employeeId: "OPER004",
    fullName: "Charlie Operator",
    role: "OPERATOR",
    operatorId: "OP-33333",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date("2024-10-01T10:00:00Z"),
  },
  {
    id: "8",
    employeeId: "ADMIN003",
    fullName: "Michael Admin",
    role: "ADMIN",
    operatorId: null,
    isActive: false,
    lastLoginAt: new Date("2024-08-20T11:30:00Z"),
    createdAt: new Date("2024-02-01T08:00:00Z"),
  },
];

/**
 * Mock paginated users response (page 1)
 */
export const mockPaginatedUsersPage1: PaginatedResponse<User> = {
  data: mockUsersList.slice(0, 5),
  pagination: {
    page: 1,
    limit: 5,
    total: mockUsersList.length,
    totalPages: Math.ceil(mockUsersList.length / 5),
  },
};

/**
 * Mock paginated users response (page 2)
 */
export const mockPaginatedUsersPage2: PaginatedResponse<User> = {
  data: mockUsersList.slice(5, 8),
  pagination: {
    page: 2,
    limit: 5,
    total: mockUsersList.length,
    totalPages: Math.ceil(mockUsersList.length / 5),
  },
};

/**
 * Mock filtered users (OPERATOR role only)
 */
export const mockOperatorsOnly: PaginatedResponse<User> = {
  data: mockUsersList.filter((u) => u.role === "OPERATOR").slice(0, 5),
  pagination: {
    page: 1,
    limit: 5,
    total: mockUsersList.filter((u) => u.role === "OPERATOR").length,
    totalPages: Math.ceil(mockUsersList.filter((u) => u.role === "OPERATOR").length / 5),
  },
};

/**
 * Mock filtered users (ADMIN role only)
 */
export const mockAdminsOnly: PaginatedResponse<User> = {
  data: mockUsersList.filter((u) => u.role === "ADMIN"),
  pagination: {
    page: 1,
    limit: 5,
    total: mockUsersList.filter((u) => u.role === "ADMIN").length,
    totalPages: 1,
  },
};

/**
 * Mock filtered users (active only)
 */
export const mockActiveUsersOnly: PaginatedResponse<User> = {
  data: mockUsersList.filter((u) => u.isActive).slice(0, 5),
  pagination: {
    page: 1,
    limit: 5,
    total: mockUsersList.filter((u) => u.isActive).length,
    totalPages: Math.ceil(mockUsersList.filter((u) => u.isActive).length / 5),
  },
};

/**
 * Mock search results
 */
export const mockSearchResults: PaginatedResponse<User> = {
  data: mockUsersList.filter((u) => u.fullName.toLowerCase().includes("admin")),
  pagination: {
    page: 1,
    limit: 5,
    total: mockUsersList.filter((u) => u.fullName.toLowerCase().includes("admin")).length,
    totalPages: 1,
  },
};

/**
 * Mock create user requests
 */
export const mockCreateUserRequests = {
  validOperator: {
    employeeId: "OPER999",
    fullName: "New Operator",
    password: "Password@123",
    role: "OPERATOR" as const,
  },
  validAdmin: {
    employeeId: "ADMIN999",
    fullName: "New Admin",
    password: "AdminPass@456",
    role: "ADMIN" as const,
  },
  duplicateEmployeeId: {
    employeeId: "ADMIN001", // Already exists
    fullName: "Duplicate User",
    password: "Password@123",
    role: "OPERATOR" as const,
  },
  weakPassword: {
    employeeId: "WEAK001",
    fullName: "Weak Password User",
    password: "weak",
    role: "OPERATOR" as const,
  },
};

/**
 * Mock created user responses
 */
export const mockCreatedUsers: Record<string, User> = {
  operator: {
    id: "999",
    employeeId: "OPER999",
    fullName: "New Operator",
    role: "OPERATOR",
    operatorId: "OP-99999",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
  },
  admin: {
    id: "1000",
    employeeId: "ADMIN999",
    fullName: "New Admin",
    role: "ADMIN",
    operatorId: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
  },
};

/**
 * Mock update user requests
 */
export const mockUpdateUserRequests: Record<string, UpdateUserRequest> = {
  changeName: {
    fullName: "Updated Name",
  },
  changeRole: {
    role: "ADMIN",
  },
  deactivate: {
    isActive: false,
  },
  activate: {
    isActive: true,
  },
  fullUpdate: {
    fullName: "Completely Updated",
    role: "ADMIN",
    isActive: true,
  },
};

/**
 * Mock reset password requests
 */
export const mockResetPasswordRequests: Record<string, ResetPasswordRequest> = {
  valid: {
    newPassword: "NewSecure@Password123",
  },
  weak: {
    newPassword: "weak",
  },
};

/**
 * Mock error responses
 */
export const mockUserErrors = {
  duplicateEmployeeId: {
    error: {
      code: "DUPLICATE_EMPLOYEE_ID",
      message: "Employee ID already exists",
    },
    timestamp: new Date().toISOString(),
    path: "/api/auth/register",
  },
  weakPassword: {
    error: {
      code: "WEAK_PASSWORD",
      message:
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
    },
    timestamp: new Date().toISOString(),
    path: "/api/auth/register",
  },
  userNotFound: {
    error: {
      code: "USER_NOT_FOUND",
      message: "User not found",
    },
    timestamp: new Date().toISOString(),
    path: "/api/users/:id",
  },
  unauthorized: {
    error: {
      code: "UNAUTHORIZED",
      message: "You do not have permission to perform this action",
    },
    timestamp: new Date().toISOString(),
    path: "/api/users",
  },
};

/**
 * Helper to filter users based on criteria
 */
export function filterUsers(
  users: User[],
  filters: {
    role?: "ADMIN" | "OPERATOR";
    isActive?: boolean;
    search?: string;
  }
): User[] {
  return users.filter((user) => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.isActive !== undefined && user.isActive !== filters.isActive) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = user.fullName.toLowerCase().includes(searchLower);
      const matchesId = user.employeeId.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesId) return false;
    }
    return true;
  });
}

/**
 * Helper to paginate users
 */
export function paginateUsers(users: User[], page: number, limit: number): PaginatedResponse<User> {
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = users.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
    },
  };
}
