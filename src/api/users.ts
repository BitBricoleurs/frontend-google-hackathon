import { api } from "@/lib/api-client";
import type {
  User,
  UserListParams,
  PaginatedResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
} from "@/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * List users with filters and pagination
 * GET /api/v1/users
 */
export async function listUsers(
  params: Partial<UserListParams> = {}
): Promise<PaginatedResponse<User>> {
  const { page = 1, limit = 20, ...filters } = params;

  const response = await api.get<PaginatedResponse<User>>("/users", {
    params: {
      page,
      limit,
      ...filters,
    },
  });

  return response.data;
}

/**
 * Get single user by ID
 * GET /api/v1/users/:id
 */
export async function getUser(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

/**
 * Create new user (uses auth/register endpoint)
 * POST /api/v1/auth/register
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await api.post<User>("/auth/register", data);
  return response.data;
}

/**
 * Update user
 * PATCH /api/v1/users/:id
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<User> {
  const response = await api.patch<User>(`/users/${id}`, data);
  return response.data;
}

/**
 * Deactivate user (soft delete)
 * DELETE /api/v1/users/:id
 */
export async function deactivateUser(id: string): Promise<{ message: string; id: string }> {
  const response = await api.delete<{ message: string; id: string }>(`/users/${id}`);
  return response.data;
}

/**
 * Reset user password (admin action)
 * PATCH /api/v1/users/:id/password
 */
export async function resetUserPassword(
  id: string,
  data: ResetPasswordRequest
): Promise<{ message: string; id: string }> {
  const response = await api.patch<{ message: string; id: string }>(
    `/users/${id}/password`,
    data
  );
  return response.data;
}

// ============================================
// TanStack Query Hooks
// ============================================

/**
 * Hook to list users with filters and pagination
 */
export function useUsers(params: Partial<UserListParams> = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => listUsers(params),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get single user
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

/**
 * Hook to create user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });
}

/**
 * Hook to update user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: (updatedUser) => {
      // Invalidate and update cache
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.setQueryData(["users", updatedUser.id], updatedUser);
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });
}

/**
 * Hook to deactivate user
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deactivated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate user");
    },
  });
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResetPasswordRequest }) =>
      resetUserPassword(id, data),
    onSuccess: () => {
      toast.success("Password reset successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });
}
