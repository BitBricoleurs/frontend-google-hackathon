"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HouseSimple,
  Phone,
  UsersThree,
  ChartBar,
  Shield,
  GearSix,
  SquaresFour,
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

const adminMenuItems = [
  {
    name: "Admin Dashboard",
    href: "/admin",
    icon: SquaresFour,
  },
  {
    name: "Employees",
    href: "/admin/employees",
    icon: UsersThree,
  },
  {
    name: "System",
    href: "/admin/system",
    icon: GearSix,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: ChartBar,
  },
  {
    name: "Security",
    href: "/admin/security",
    icon: Shield,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isAdminHovered, setIsAdminHovered] = React.useState(false);

  // Check if we're on an admin page
  const isOnAdminPage = pathname?.startsWith("/admin");
  const isAdminExpanded = isAdminHovered || isOnAdminPage;

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
      {user?.role === "ADMIN" && (
        <footer
          className={cn(
            "border-sidebar-border p-3 relative",
            !isAdminExpanded && "border-t"
          )}
          onMouseEnter={() => setIsAdminHovered(true)}
          onMouseLeave={() => setIsAdminHovered(false)}
        >
          <AnimatePresence>
            {isAdminExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute bottom-full left-0 right-0 pt-3 px-3 space-y-2 bg-transparent border-sidebar-border border-t"
              >
                {adminMenuItems.slice(1).map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname?.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-sidebar-foreground hover:bg-accent/10"
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
              </motion.div>
            )}
          </AnimatePresence>

          <Link
            href="/admin"
            className={cn(
              "w-full flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-colors",
              pathname === "/admin"
                ? "bg-accent text-accent-foreground"
                : "text-sidebar-foreground hover:bg-accent/10"
            )}
          >
            <motion.div
              animate={{ rotate: isAdminExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <SquaresFour
                className="h-6 w-6"
                weight={pathname === "/admin" ? "fill" : "regular"}
              />
            </motion.div>
            <span className="text-xs font-medium text-center">
              {isAdminExpanded ? "Admin Dashboard" : "Admin"}
            </span>
          </Link>
        </footer>
      )}
    </aside>
  );
}
