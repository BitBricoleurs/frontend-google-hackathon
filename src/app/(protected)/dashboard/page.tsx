"use client";

import { useQueue } from "@/contexts/queue-context";
import { useEffect } from "react";
import {
  Phone as PhoneIcon,
  Clock as ClockIcon,
  Cpu as CpuIcon,
  CheckCircle as CheckCircleIcon,
  Lightning as LightningIcon,
} from "@phosphor-icons/react/dist/ssr";

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
      {/* Main Content */}
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
          <p className="mt-2 text-3xl font-bold text-card-foreground">
            {value}
          </p>
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
