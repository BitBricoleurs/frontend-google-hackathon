"use client";

import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import {
  Phone as PhoneIcon,
  Lock as LockIcon,
  Clock as ClockIcon,
  Cpu as CpuIcon,
  CheckCircle as CheckCircleIcon,
  Lightning as LightningIcon,
} from "@phosphor-icons/react/dist/ssr";

export default function DashboardPage() {
  const { responder, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <PhoneIcon className="h-6 w-6 text-primary-foreground" weight="fill" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-card-foreground">
                  Emergency Response Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-Assisted Call Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
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

              <div className="text-right">
                <p className="text-sm font-medium text-card-foreground">
                  {responder?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {responder?.responderId} • {responder?.role}
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
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Calls" value="3" icon="phone" color="blue" />
          <StatCard
            title="Waiting Queue"
            value="8"
            icon="clock"
            color="yellow"
          />
          <StatCard title="AI Processing" value="5" icon="cpu" color="purple" />
          <StatCard
            title="Completed Today"
            value="24"
            icon="check"
            color="green"
          />
        </div>

        {/* Placeholder for future features */}
        <div className="rounded-lg bg-card p-8 shadow-sm border border-border">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-accent">
                <LightningIcon
                  className="h-8 w-8 text-accent-foreground"
                  weight="fill"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              Dashboard Coming Soon
            </h2>
            <p className="text-muted-foreground mb-6">
              Your emergency response dashboard will display real-time call
              data, AI agent conversations, and patient files.
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto">
              <FeatureItem text="Current Call Management" />
              <FeatureItem text="Waiting Queue with AI Agent Status" />
              <FeatureItem text="Patient File Repository" />
              <FeatureItem text="Real-time Transcription & Translation" />
              <FeatureItem text="Medical Keyword Detection" />
              <FeatureItem text="Emotion & Distress Analysis" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: "phone" | "clock" | "cpu" | "check";
  color: "blue" | "yellow" | "purple" | "green";
}) {
  const colorClasses = {
    blue: "bg-chart-1/10 text-chart-1",
    yellow: "bg-chart-4/10 text-chart-4",
    purple: "bg-chart-3/10 text-chart-3",
    green: "bg-primary/10 text-primary",
  };

  const icons = {
    phone: <PhoneIcon className="h-6 w-6" weight="duotone" />,
    clock: <ClockIcon className="h-6 w-6" weight="duotone" />,
    cpu: <CpuIcon className="h-6 w-6" weight="duotone" />,
    check: <CheckCircleIcon className="h-6 w-6" weight="duotone" />,
  };

  return (
    <div className="rounded-lg bg-card p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          {icons[icon]}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircleIcon className="h-5 w-5 text-primary" weight="fill" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
