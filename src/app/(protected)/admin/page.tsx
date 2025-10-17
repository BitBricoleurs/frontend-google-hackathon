"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import {
  Lock as LockIcon,
  ArrowLeft as ArrowLeftIcon,
  UsersFour as UsersFourIcon,
  CheckCircle as CheckCircleIcon,
  Cpu as CpuIcon,
  Phone as PhoneIcon,
  Gear as GearIcon,
  ChartBar as ChartBarIcon,
  ShieldCheck as ShieldCheckIcon,
  CaretRight as CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { responder, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive">
                <LockIcon className="h-6 w-6 text-destructive-foreground" weight="fill" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-card-foreground">
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">System Administration</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" weight="bold" />
                Back to Dashboard
              </Link>

              <div className="text-right">
                <p className="text-sm font-medium text-card-foreground">
                  {responder?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {responder?.responderId} •{" "}
                  <span className="text-destructive font-semibold">
                    {responder?.role}
                  </span>
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90 transition-opacity"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Total Responders"
            value="48"
            change="+3 this week"
            icon="users"
            color="blue"
          />
          <AdminStatCard
            title="System Status"
            value="Healthy"
            change="99.9% uptime"
            icon="check"
            color="green"
          />
          <AdminStatCard
            title="AI Agents Active"
            value="12"
            change="8 idle"
            icon="cpu"
            color="purple"
          />
          <AdminStatCard
            title="Total Calls Today"
            value="342"
            change="+15% vs yesterday"
            icon="phone"
            color="orange"
          />
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Management */}
          <AdminSection
            title="User Management"
            description="Manage responder accounts and permissions"
            icon="users"
            actions={[
              "Add new responder",
              "Edit user roles",
              "Deactivate accounts",
              "View activity logs",
            ]}
          />

          {/* System Configuration */}
          <AdminSection
            title="System Configuration"
            description="Configure AI agents and system settings"
            icon="settings"
            actions={[
              "AI agent settings",
              "Call routing rules",
              "Alert thresholds",
              "Integration settings",
            ]}
          />

          {/* Analytics & Reports */}
          <AdminSection
            title="Analytics & Reports"
            description="View detailed analytics and generate reports"
            icon="chart"
            actions={[
              "Performance metrics",
              "Response time analysis",
              "AI accuracy reports",
              "Export data",
            ]}
          />

          {/* Security & Audit */}
          <AdminSection
            title="Security & Audit"
            description="Security settings and audit logs"
            icon="shield"
            actions={[
              "Access logs",
              "Security policies",
              "Data retention",
              "Compliance reports",
            ]}
          />
        </div>
      </main>
    </div>
  );
}

function AdminStatCard({
  title,
  value,
  change,
  icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  icon: "users" | "check" | "cpu" | "phone";
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-chart-1/10 text-chart-1",
    green: "bg-primary/10 text-primary",
    purple: "bg-chart-3/10 text-chart-3",
    orange: "bg-chart-4/10 text-chart-4",
  };

  const icons = {
    users: <UsersFourIcon className="h-4 w-4" weight="duotone" />,
    check: <CheckCircleIcon className="h-4 w-4" weight="duotone" />,
    cpu: <CpuIcon className="h-4 w-4" weight="duotone" />,
    phone: <PhoneIcon className="h-4 w-4" weight="duotone" />,
  };

  return (
    <div className="rounded-lg bg-card p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          {icons[icon]}
        </div>
      </div>
      <p className="text-2xl font-bold text-card-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{change}</p>
    </div>
  );
}

function AdminSection({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description: string;
  icon: "users" | "settings" | "chart" | "shield";
  actions: string[];
}) {
  const icons = {
    users: <UsersFourIcon className="h-6 w-6 text-muted-foreground" weight="duotone" />,
    settings: <GearIcon className="h-6 w-6 text-muted-foreground" weight="duotone" />,
    chart: <ChartBarIcon className="h-6 w-6 text-muted-foreground" weight="duotone" />,
    shield: <ShieldCheckIcon className="h-6 w-6 text-muted-foreground" weight="duotone" />,
  };

  return (
    <div className="rounded-lg bg-card p-6 shadow-sm border border-border">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          {icons[icon]}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-card-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <ul className="space-y-2">
            {actions.map((action, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <CaretRightIcon className="h-4 w-4 text-muted-foreground" weight="bold" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
