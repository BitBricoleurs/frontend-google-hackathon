"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HouseSimple,
  Phone,
  UsersThree,
  LockIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { NavUser } from "./nav-user";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HouseSimple,
  },
  {
    name: "Active Call",
    href: "/active-call",
    icon: Phone,
  },
  {
    name: "Patients",
    href: "/patients",
    icon: UsersThree,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
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

  const userData = {
    name: responder?.name || "Unknown User",
    email: `${responder?.responderId || ""} • ${responder?.role || ""}`,
    initials: getInitials(responder?.name),
  };

  return (
    <aside className="flex h-screen w-[120px] flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
        <img src="/full-logo.png" alt="Urgentis" className="h-8 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-primary/10 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className="h-6 w-6"
                weight={isActive ? "fill" : "regular"}
              />
              <span className="text-xs font-medium text-center">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Panel - Only visible to admins */}
      {responder?.role === "admin" && (
        <footer className="border-t border-sidebar-border p-3">
          <Link
            href="/admin"
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-colors",
              pathname === "/admin" || pathname?.startsWith("/admin/")
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-accent/10"
            )}
          >
            <LockIcon
              className="h-6 w-6"
              weight={
                pathname === "/admin" || pathname?.startsWith("/admin/")
                  ? "fill"
                  : "regular"
              }
            />
            <span className="text-xs font-medium text-center">Admin</span>
          </Link>
        </footer>
      )}
    </aside>
  );
}
