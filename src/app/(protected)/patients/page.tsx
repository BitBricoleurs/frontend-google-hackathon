"use client";

import {
  UsersThree,
  MagnifyingGlass,
  UserCircle,
  Calendar,
  Phone,
  MapPin,
  Heart,
  FileText,
  Plus,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Mock patient data
const mockPatients = [
  {
    id: "PT-001",
    name: "Sarah Johnson",
    age: 34,
    lastContact: "2025-10-15",
    phone: "+1 (555) 123-4567",
    location: "Downtown District",
    status: "stable",
    notes: "Regular checkups, no major issues",
  },
  {
    id: "PT-002",
    name: "Michael Chen",
    age: 56,
    lastContact: "2025-10-16",
    phone: "+1 (555) 234-5678",
    location: "North Side",
    status: "monitoring",
    notes: "Follow-up required for recent incident",
  },
  {
    id: "PT-003",
    name: "Emily Rodriguez",
    age: 28,
    lastContact: "2025-10-17",
    phone: "+1 (555) 345-6789",
    location: "East Quarter",
    status: "stable",
    notes: "Allergies: Penicillin",
  },
  {
    id: "PT-004",
    name: "James Williams",
    age: 42,
    lastContact: "2025-10-14",
    phone: "+1 (555) 456-7890",
    location: "West End",
    status: "critical",
    notes: "Chronic condition - requires immediate attention",
  },
  {
    id: "PT-005",
    name: "Olivia Brown",
    age: 67,
    lastContact: "2025-10-16",
    phone: "+1 (555) 567-8901",
    location: "South District",
    status: "monitoring",
    notes: "Recent surgery recovery",
  },
];

export default function PatientsPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <UsersThree className="h-6 w-6 text-primary-foreground" weight="fill" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">Patient Records</h1>
              <p className="text-sm text-muted-foreground">Manage and view patient information</p>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" weight="bold" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search patients by name, ID, or phone..."
              className={cn(
                "w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
                "transition-colors"
              )}
            />
          </div>
          <select
            className={cn(
              "rounded-lg border border-input bg-background px-4 py-2 text-sm",
              "text-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
              "transition-colors"
            )}
          >
            <option>All Status</option>
            <option>Stable</option>
            <option>Monitoring</option>
            <option>Critical</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4">
          {mockPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientCard({ patient }: { patient: (typeof mockPatients)[0] }) {
  const statusColors = {
    stable: "bg-green-500/10 text-green-500 border-green-500/20",
    monitoring: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    critical: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        {/* Patient Info */}
        <div className="flex gap-4 flex-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <UserCircle className="h-8 w-8 text-primary" weight="fill" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-card-foreground">{patient.name}</h3>
              <span className="text-sm text-muted-foreground">{patient.age} years old</span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border",
                  statusColors[patient.status as keyof typeof statusColors]
                )}
              >
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" weight="duotone" />
                <span>{patient.id}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" weight="duotone" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" weight="duotone" />
                <span>{patient.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" weight="duotone" />
                <span>Last contact: {patient.lastContact}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <Heart className="h-4 w-4 text-muted-foreground mt-0.5" weight="duotone" />
              <span className="text-muted-foreground">{patient.notes}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            View Details
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}
