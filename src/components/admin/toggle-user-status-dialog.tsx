"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Prohibit, Warning } from "@phosphor-icons/react";
import { useUpdateUser } from "@/api/users";
import type { User } from "@/types/user";

interface ToggleUserStatusDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToggleUserStatusDialog({
  user,
  open,
  onOpenChange,
}: ToggleUserStatusDialogProps) {
  const updateUserMutation = useUpdateUser();

  const isActivating = !user.isActive;
  const actionText = isActivating ? "Activate" : "Deactivate";
  const actionColor = isActivating ? "default" : "destructive";

  const handleConfirm = async () => {
    updateUserMutation.mutate(
      {
        id: user.id,
        data: {
          isActive: !user.isActive,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isActivating ? (
              <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
            ) : (
              <Prohibit className="h-5 w-5 text-destructive" weight="fill" />
            )}
            {actionText} User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to {actionText.toLowerCase()} this user account?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* User Info */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Employee ID:</span>
              <span className="text-sm font-medium">{user.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Full Name:</span>
              <span className="text-sm font-medium">{user.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Role:</span>
              <span className="text-sm font-medium">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Status:</span>
              <span className="text-sm font-medium">
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Warning/Info message */}
          {isActivating ? (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-1">
                  <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                    Activating this user will:
                  </p>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 list-disc list-inside">
                    <li>Allow them to log in to the system</li>
                    <li>Restore their access to all assigned resources</li>
                    <li>Enable them to perform their role duties</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-300 dark:border-orange-700 p-4">
              <div className="flex items-start gap-3">
                <Warning className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" weight="fill" />
                <div className="space-y-1">
                  <p className="text-sm text-orange-900 dark:text-orange-100 font-medium">
                    Deactivating this user will:
                  </p>
                  <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1 list-disc list-inside">
                    <li>Immediately prevent them from logging in</li>
                    <li>Revoke access to all system resources</li>
                    <li>Preserve their data for future reactivation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={actionColor}
            onClick={handleConfirm}
            disabled={updateUserMutation.isPending}
            className={isActivating ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {updateUserMutation.isPending
              ? `${actionText.slice(0, -1)}ing...`
              : actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
