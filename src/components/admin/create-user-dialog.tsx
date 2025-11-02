"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, EyeSlash, CheckCircle, XCircle } from "@phosphor-icons/react";
import { useCreateUser } from "@/api/users";
import type { UserRole } from "@/types/auth";

interface CreateUserDialogProps {
  children?: React.ReactNode;
}

export function CreateUserDialog({ children }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("OPERATOR");
  const [showPassword, setShowPassword] = useState(false);

  const createUserMutation = useCreateUser();

  // Password validation
  const passwordValidation = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const isFormValid =
    employeeId.trim() !== "" && fullName.trim() !== "" && password !== "" && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    createUserMutation.mutate(
      {
        employeeId: employeeId.trim(),
        fullName: fullName.trim(),
        password,
        role,
      },
      {
        onSuccess: () => {
          // Reset form and close dialog
          setEmployeeId("");
          setFullName("");
          setPassword("");
          setRole("OPERATOR");
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" weight="bold" />
            Create User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. Employee ID must be unique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">
                Employee ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="employeeId"
                placeholder="e.g., EMP001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                disabled={createUserMutation.isPending}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                3-50 characters, uppercase letters and numbers only
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                placeholder="e.g., John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={createUserMutation.isPending}
                maxLength={100}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createUserMutation.isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeSlash className="h-4 w-4" weight="bold" />
                  ) : (
                    <Eye className="h-4 w-4" weight="bold" />
                  )}
                </button>
              </div>
              {password && (
                <div className="space-y-1 text-xs">
                  <PasswordRequirement
                    met={passwordValidation.length}
                    text="At least 8 characters"
                  />
                  <PasswordRequirement
                    met={passwordValidation.uppercase}
                    text="One uppercase letter"
                  />
                  <PasswordRequirement
                    met={passwordValidation.lowercase}
                    text="One lowercase letter"
                  />
                  <PasswordRequirement met={passwordValidation.number} text="One number" />
                </div>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={createUserMutation.isPending}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operator</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Admins have full system access</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {met ? (
        <CheckCircle className="h-3.5 w-3.5 text-primary" weight="fill" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-muted-foreground" weight="fill" />
      )}
      <span className={met ? "text-primary" : "text-muted-foreground"}>{text}</span>
    </div>
  );
}
