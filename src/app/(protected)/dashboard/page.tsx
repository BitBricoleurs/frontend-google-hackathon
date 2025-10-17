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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <PhoneIcon className="h-6 w-6 text-white" weight="fill" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Emergency Response Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  AI-Assisted Call Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Admin Panel Link - Only visible to admins */}
              {responder?.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LockIcon className="h-4 w-4" weight="bold" />
                  Admin Panel
                </Link>
              )}

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {responder?.name}
                </p>
                <p className="text-xs text-gray-600">
                  {responder?.responderId} • {responder?.role}
                </p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
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
        <div className="rounded-lg bg-white p-8 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <LightningIcon
                  className="h-8 w-8 text-blue-600"
                  weight="fill"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
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
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };

  const icons = {
    phone: <PhoneIcon className="h-6 w-6" weight="duotone" />,
    clock: <ClockIcon className="h-6 w-6" weight="duotone" />,
    cpu: <CpuIcon className="h-6 w-6" weight="duotone" />,
    check: <CheckCircleIcon className="h-6 w-6" weight="duotone" />,
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          {icons[icon]}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircleIcon className="h-5 w-5 text-green-600" weight="fill" />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
}
