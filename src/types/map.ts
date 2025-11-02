/**
 * Map Types
 * Types for map data (ambulances, dispatches, hospitals)
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export type AmbulanceStatus =
  | "AVAILABLE"
  | "DISPATCHED"
  | "EN_ROUTE"
  | "ON_SCENE"
  | "RETURNING"
  | "OUT_OF_SERVICE";
export type AmbulanceType = "SMUR" | "AMBULANCE" | "VSAV" | "MEDICALISED";

export interface Ambulance {
  id: string;
  vehicleId: string;
  callSign: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
  location: Location;
  heading: number | null;
  speed: number | null;
  currentDispatchId: string | null;
  homeHospital: string | null;
}

export type DispatchPriority = "P0" | "P1" | "P2" | "P3" | "P4" | "P5";
export type DispatchStatus =
  | "PENDING"
  | "DISPATCHED"
  | "EN_ROUTE"
  | "ON_SCENE"
  | "COMPLETED"
  | "CANCELLED";

export interface Dispatch {
  id: string;
  dispatchId: string;
  priority: DispatchPriority;
  status: DispatchStatus;
  location: Location;
  address: string;
  symptoms: string[];
  requestedAt: string;
  dispatchedAt: string | null;
  ambulanceId: string | null;
  estimatedArrivalMinutes: number | null;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  hasSMUR: boolean;
  hasEmergencyRoom: boolean;
  hasHelicopterPad: boolean;
  totalAmbulances: number;
  availableAmbulances: number;
}

export interface MapData {
  ambulances: Ambulance[];
  dispatches: Dispatch[];
  hospitals: Hospital[];
  timestamp: string;
}

export interface MapDataResponse {
  ambulances: Ambulance[];
  dispatches: Dispatch[];
  hospitals: Hospital[];
  timestamp: string;
}
