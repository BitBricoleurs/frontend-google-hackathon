"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeSlash, CheckCircle, XCircle } from "@phosphor-icons/react";
import { useResetUserPassword } from "@/api/users";
import type { User } from "@/types/user";

interface ResetPasswordDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, open, onOpenChange }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetPasswordMutation = useResetUserPassword();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setNewPassword("");
      setShowPassword(false);
    }
  }, [open]);

  // Password validation
  const passwordValidation = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    resetPasswordMutation.mutate(
      {
        id: user.id,
        data: { newPassword },
      },
      {
        onSuccess: () => {
          setNewPassword("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password for <span className="font-medium">{user.fullName}</span> (
            {user.employeeId})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Warning message */}
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-300 dark:border-orange-700 p-4">
              <p className="text-sm text-orange-900 dark:text-orange-100 font-medium">
                ⚠️ The user will be able to log in with this new password immediately. Make sure to
                communicate it securely.
              </p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                New Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={resetPasswordMutation.isPending}
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
              {newPassword && (
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={resetPasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isPasswordValid || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
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
