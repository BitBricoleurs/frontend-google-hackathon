"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useUsers } from "@/api/users";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { EditUserDialog } from "@/components/admin/edit-user-dialog";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";
import { ToggleUserStatusDialog } from "@/components/admin/toggle-user-status-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UsersThree,
  MagnifyingGlass,
  PencilSimple,
  Key,
  Prohibit,
  CheckCircle,
  CaretLeft,
  CaretRight,
  ToggleLeft,
  ToggleRight,
} from "@phosphor-icons/react";
import type { User } from "@/types/user";
import type { UserRole } from "@/types/auth";
import { formatDistanceToNow } from "date-fns";

export default function EmployeesPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <EmployeesContent />
    </ProtectedRoute>
  );
}

function EmployeesContent() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(""); // User input
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced value
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null);
  const [togglingStatusUser, setTogglingStatusUser] = useState<User | null>(null);

  const limit = 20;

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to first page on search change
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Build query params
  const queryParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
  };

  const { data, isLoading, error } = useUsers(queryParams);

  const totalPages = data?.pagination.totalPages || 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <UsersThree className="h-6 w-6 text-primary-foreground" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
              <p className="text-sm text-muted-foreground">Manage system users and permissions</p>
            </div>
          </div>
          <CreateUserDialog />
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-card border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  weight="bold"
                />
                <Input
                  placeholder="Search by name or employee ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value as UserRole | "all");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="OPERATOR">Operator</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as "all" | "active" | "inactive");
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg bg-card border border-border overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">Failed to load users</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data && data.data.length > 0 ? (
                  // User rows
                  data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.employeeId}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "destructive" : "default"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" weight="fill" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700">
                            <Prohibit className="h-3 w-3 mr-1" weight="fill" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLoginAt
                          ? formatDistanceToNow(new Date(user.lastLoginAt), {
                              addSuffix: true,
                            })
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            title="Edit user"
                          >
                            <PencilSimple className="h-4 w-4" weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResettingPasswordUser(user)}
                            title="Reset password"
                          >
                            <Key className="h-4 w-4" weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTogglingStatusUser(user)}
                            title={user.isActive ? "Deactivate user" : "Activate user"}
                          >
                            {user.isActive ? (
                              <ToggleRight
                                className="h-4 w-4 text-green-600 hover:text-accent-foreground"
                                weight="bold"
                              />
                            ) : (
                              <ToggleLeft
                                className="h-4 w-4 text-gray-400 hover:text-accent-foreground"
                                weight="bold"
                              />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // Empty state
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <UsersThree
                        className="h-12 w-12 mx-auto mb-4 text-muted-foreground"
                        weight="duotone"
                      />
                      <p className="text-muted-foreground font-medium mb-1">No users found</p>
                      <p className="text-sm text-muted-foreground">
                        {debouncedSearch || roleFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your filters"
                          : "Create your first user to get started"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {data && data.data.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, data.pagination.total)}{" "}
                of {data.pagination.total} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <CaretLeft className="h-4 w-4" weight="bold" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <CaretRight className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}

      {/* Reset Password Dialog */}
      {resettingPasswordUser && (
        <ResetPasswordDialog
          user={resettingPasswordUser}
          open={!!resettingPasswordUser}
          onOpenChange={(open) => !open && setResettingPasswordUser(null)}
        />
      )}

      {/* Toggle Status Dialog */}
      {togglingStatusUser && (
        <ToggleUserStatusDialog
          user={togglingStatusUser}
          open={!!togglingStatusUser}
          onOpenChange={(open) => !open && setTogglingStatusUser(null)}
        />
      )}
    </div>
  );
}
