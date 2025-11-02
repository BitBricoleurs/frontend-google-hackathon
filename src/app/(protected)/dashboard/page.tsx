"use client";

import { useQueue } from "@/contexts/queue-context";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Phone as PhoneIcon,
  Clock as ClockIcon,
  Cpu as CpuIcon,
  CheckCircle as CheckCircleIcon,
  Lightning as LightningIcon,
  MapPin as MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";

// Dynamically import the map component to avoid SSR issues with Leaflet
const EmergencyMap = dynamic(
  () => import("@/components/map/emergency-map").then((mod) => mod.EmergencyMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-lg border border-border bg-card flex items-center justify-center"
        style={{ height: "600px" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { calls, stats, updateWaitTimes } = useQueue();

  // Update wait times every second
  useEffect(() => {
    const interval = setInterval(() => {
      updateWaitTimes();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateWaitTimes]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Calls"
            value={stats?.aiConnected.toString() || "0"}
            icon="phone"
            color="blue"
          />
          <StatCard
            title="Waiting Queue"
            value={calls.length.toString()}
            icon="clock"
            color="yellow"
          />
          <StatCard
            title="AI Processing"
            value={((stats?.aiConnected || 0) + (stats?.aiConnecting || 0)).toString()}
            icon="cpu"
            color="purple"
          />
          <StatCard
            title="High Priority"
            value={stats?.highPriority.toString() || "0"}
            icon="check"
            color="green"
          />
        </div>

        {/* Emergency Response Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="rounded-lg bg-card p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <LightningIcon className="h-6 w-6 text-primary" weight="fill" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Emergency Dashboard</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor real-time emergency calls and AI agent status
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Total Calls Today</span>
                <span className="text-lg font-bold text-primary">{stats?.aiConnected || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">Average Wait Time</span>
                <span className="text-lg font-bold text-yellow-500">2m 30s</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">AI Response Rate</span>
                <span className="text-lg font-bold text-green-500">98%</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-lg bg-card p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircleIcon className="h-6 w-6 text-green-500" weight="fill" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">System Status</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">All systems operational</p>
            <div className="space-y-3">
              <StatusItem label="AI Agent System" status="operational" />
              <StatusItem label="Voice Recognition" status="operational" />
              <StatusItem label="Translation Service" status="operational" />
              <StatusItem label="Database Connection" status="operational" />
            </div>
          </div>
        </div>

        {/* Emergency Map */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <MapPinIcon className="h-6 w-6 text-blue-500" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Live Emergency Map</h2>
              <p className="text-sm text-muted-foreground">
                Real-time tracking of ambulances, dispatches, and hospitals
              </p>
            </div>
          </div>
          <EmergencyMap height="700px" />
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
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>{icons[icon]}</div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  status,
}: {
  label: string;
  status: "operational" | "warning" | "error";
}) {
  const statusConfig = {
    operational: { color: "text-green-500", bg: "bg-green-500/10", dot: "bg-green-500" },
    warning: { color: "text-yellow-500", bg: "bg-yellow-500/10", dot: "bg-yellow-500" },
    error: { color: "text-red-500", bg: "bg-red-500/10", dot: "bg-red-500" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${config.dot} animate-pulse`} />
        <span className={`text-xs font-medium uppercase ${config.color}`}>{status}</span>
      </div>
    </div>
  );
}
