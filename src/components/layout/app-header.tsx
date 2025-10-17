"use client";

import {
  MagnifyingGlassIcon,
  BellIcon,
  LockIcon,
  DotsThreeVerticalIcon,
  UserIcon,
  CreditCardIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export function AppHeader() {
  const { responder, logout } = useAuth();

  // Get initials from responder name
  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Left Section - Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            weight="bold"
          />
          <input
            type="text"
            placeholder="Search..."
            className={cn(
              "w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              "transition-colors"
            )}
          />
        </div>
      </div>

      {/* Right Side - Actions & User */}
      <div className="flex items-center gap-3">
        {/* Admin Panel Link - Only visible to admins */}
        {responder?.role === "admin" && (
          <Link
            href="/admin"
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <LockIcon className="h-4 w-4" weight="bold" />
            Admin Panel
          </Link>
        )}

        {/* Notification Bell */}
        <button
          className={cn(
            "relative rounded-lg p-2 text-muted-foreground",
            "hover:bg-secondary hover:text-secondary-foreground",
            "transition-colors"
          )}
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" weight="bold" />
          {/* Notification Badge */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        </button>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg hover:bg-secondary hover:text-secondary-foreground px-3 py-2 transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {responder?.name || "Unknown User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {responder?.responderId} • {responder?.role}
                </p>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(responder?.name)}
                </AvatarFallback>
              </Avatar>
              <DotsThreeVerticalIcon
                className="h-4 w-4 text-muted-foreground"
                weight="bold"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(responder?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {responder?.name || "Unknown User"}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {responder?.responderId} • {responder?.role}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" weight="duotone" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon className="mr-2 h-4 w-4" weight="duotone" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon className="mr-2 h-4 w-4" weight="duotone" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <SignOutIcon className="mr-2 h-4 w-4" weight="duotone" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
