/**
 * Map API
 * API calls for map data (ambulances, dispatches, hospitals)
 */

import { api } from "@/lib/api-client";
import type { MapDataResponse, Ambulance, Dispatch, Hospital } from "@/types/map";

/**
 * Get all map data (ambulances, dispatches, hospitals)
 */
export async function getMapData(lastHours: number = 24): Promise<MapDataResponse> {
  const response = await api.get<MapDataResponse>(`/map/data?lastHours=${lastHours}`);
  return response.data;
}

/**
 * Get all active ambulances
 */
export async function getAmbulances(): Promise<{ ambulances: Ambulance[]; count: number }> {
  const response = await api.get<{ ambulances: Ambulance[]; count: number }>("/map/ambulances");
  return response.data;
}

/**
 * Get active dispatches for map
 */
export async function getDispatches(
  lastHours: number = 24
): Promise<{ dispatches: Dispatch[]; count: number }> {
  const response = await api.get<{ dispatches: Dispatch[]; count: number }>(
    `/map/dispatches?lastHours=${lastHours}`
  );
  return response.data;
}

/**
 * Get all hospitals
 */
export async function getHospitals(): Promise<{ hospitals: Hospital[]; count: number }> {
  const response = await api.get<{ hospitals: Hospital[]; count: number }>("/map/hospitals");
  return response.data;
}
