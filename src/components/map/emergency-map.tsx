"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapData, Ambulance, Dispatch, Hospital, AmbulanceStatus } from "@/types/map";
import { getMapData } from "@/api/map";
import { cn } from "@/lib/utils";
import { AmbulanceIcon, HospitalIcon, WarningCircleIcon, ClockIcon } from "@phosphor-icons/react";
import { useMapWebSocket } from "@/hooks/useMapWebSocket";

// Fix for default marker icons in Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); color: white; font-size: 16px;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const ambulanceIcon = createCustomIcon("#3b82f6", "🚑");
const hospitalIcon = createCustomIcon("#10b981", "🏥");
const emergencyIcon = (priority: string) => {
  const color =
    priority === "P0" || priority === "P1" ? "#ef4444" : priority === "P2" ? "#f59e0b" : "#6b7280";
  return createCustomIcon(color, "🚨");
};

interface EmergencyMapProps {
  className?: string;
  height?: string;
}

// Animated marker component for smooth ambulance movement
function AnimatedAmbulanceMarker({ ambulance, icon }: { ambulance: Ambulance; icon: L.DivIcon }) {
  const markerRef = useRef<L.Marker | null>(null);
  const prevPositionRef = useRef<[number, number]>([
    ambulance.location.latitude,
    ambulance.location.longitude,
  ]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const newPosition: [number, number] = [
      ambulance.location.latitude,
      ambulance.location.longitude,
    ];

    const oldPosition = prevPositionRef.current;

    // Check if position actually changed
    if (oldPosition[0] !== newPosition[0] || oldPosition[1] !== newPosition[1]) {
      // Smooth animation to new position (1 second duration)
      const startTime = Date.now();
      const duration = 1000; // 1 second

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-in-out interpolation
        const eased =
          progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const lat = oldPosition[0] + (newPosition[0] - oldPosition[0]) * eased;
        const lng = oldPosition[1] + (newPosition[1] - oldPosition[1]) * eased;

        marker.setLatLng([lat, lng]);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          prevPositionRef.current = newPosition;
        }
      };

      requestAnimationFrame(animate);
    }

    // Update heading/rotation if available
    if (ambulance.heading !== null) {
      const icon = marker.getElement();
      if (icon) {
        const markerIcon = icon.querySelector(".custom-marker > div > div");
        if (markerIcon) {
          (markerIcon as HTMLElement).style.transform = `rotate(${ambulance.heading}deg)`;
        }
      }
    }
  }, [ambulance.location.latitude, ambulance.location.longitude, ambulance.heading]);

  return (
    <Marker ref={markerRef} position={prevPositionRef.current} icon={icon}>
      <Popup>
        <AmbulancePopup ambulance={ambulance} />
      </Popup>
    </Marker>
  );
}

export function EmergencyMap({ className, height = "600px" }: EmergencyMapProps) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastHours, setLastHours] = useState(24);

  // Handle real-time ambulance location updates via WebSocket
  const handleAmbulanceUpdate = useCallback(
    (update: {
      ambulanceId: string;
      location: { latitude: number; longitude: number };
      status: string;
      heading: number | null;
      speed: number | null;
      dispatchId: string | null;
    }) => {
      console.log("[EmergencyMap] Received ambulance update:", update);

      setMapData((prevData) => {
        if (!prevData) return prevData;

        const updatedAmbulances = prevData.ambulances.map((amb) => {
          if (amb.id === update.ambulanceId || amb.vehicleId === update.ambulanceId) {
            return {
              ...amb,
              location: update.location,
              status: update.status as AmbulanceStatus,
              heading: update.heading,
              speed: update.speed,
              currentDispatchId: update.dispatchId,
            };
          }
          return amb;
        });

        return {
          ...prevData,
          ambulances: updatedAmbulances,
        };
      });
    },
    []
  );

  // Connect to WebSocket for real-time updates
  useMapWebSocket({
    onAmbulanceLocationUpdate: handleAmbulanceUpdate,
  });

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoading(true);
        const data = await getMapData(lastHours);
        setMapData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch map data:", err);
        setError("Failed to load map data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapData();

    // Refresh map data every 30 seconds (WebSocket will handle real-time updates between refreshes)
    const interval = setInterval(fetchMapData, 30000);
    return () => clearInterval(interval);
  }, [lastHours]);

  // Default center (Paris, France)
  const defaultCenter: [number, number] = [48.8566, 2.3522];

  if (isLoading && !mapData) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card flex items-center justify-center",
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-card flex items-center justify-center",
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <WarningCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" weight="duotone" />
          <p className="text-foreground font-medium mb-2">Failed to load map</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-lg border border-border overflow-hidden relative", className)}
      style={{ height }}
    >
      {/* Map Controls - positioned within the map container */}
      <div className="absolute bottom-4 left-4 z-[1000] space-y-2">
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3">
          <div className="text-xs font-semibold text-foreground mb-2">Time Range</div>
          <select
            value={lastHours}
            onChange={(e) => setLastHours(Number(e.target.value))}
            className="text-xs bg-background border border-border rounded px-2 py-1 w-full"
          >
            <option value={6}>Last 6 hours</option>
            <option value={12}>Last 12 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={48}>Last 48 hours</option>
            <option value={72}>Last 72 hours</option>
          </select>
        </div>

        {/* Legend */}
        <div className="bg-card/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-foreground mb-2">Legend</div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Ambulances ({mapData?.ambulances.length || 0})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>
              Critical (
              {mapData?.dispatches.filter((d) => d.priority === "P0" || d.priority === "P1")
                .length || 0}
              )
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>
              Urgent (
              {mapData?.dispatches.filter((d) => d.priority === "P2" || d.priority === "P3")
                .length || 0}
              )
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Hospitals ({mapData?.hospitals.length || 0})</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Ambulances - with smooth animation */}
        {mapData?.ambulances.map((ambulance) => (
          <AnimatedAmbulanceMarker key={ambulance.id} ambulance={ambulance} icon={ambulanceIcon} />
        ))}

        {/* Dispatches */}
        {mapData?.dispatches.map((dispatch) => (
          <Marker
            key={dispatch.id}
            position={[dispatch.location.latitude, dispatch.location.longitude]}
            icon={emergencyIcon(dispatch.priority)}
          >
            <Popup>
              <DispatchPopup dispatch={dispatch} />
            </Popup>
          </Marker>
        ))}

        {/* Hospitals */}
        {mapData?.hospitals.map((hospital) => (
          <Marker
            key={hospital.id}
            position={[hospital.latitude, hospital.longitude]}
            icon={hospitalIcon}
          >
            <Popup>
              <HospitalPopup hospital={hospital} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function AmbulancePopup({ ambulance }: { ambulance: Ambulance }) {
  const statusColors = {
    AVAILABLE: "text-green-600",
    DISPATCHED: "text-blue-600",
    EN_ROUTE: "text-blue-600",
    ON_SCENE: "text-yellow-600",
    RETURNING: "text-orange-600",
    OUT_OF_SERVICE: "text-gray-600",
  };

  return (
    <div className="p-2 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <AmbulanceIcon className="h-5 w-5 text-blue-500" weight="fill" />
        <span className="font-bold text-sm">{ambulance.callSign || "Unknown"}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Type:</span>
          <span className="font-medium">{ambulance.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={cn("font-medium", statusColors[ambulance.status] || "text-gray-600")}>
            {ambulance.status.replace(/_/g, " ")}
          </span>
        </div>
        {ambulance.speed !== null && ambulance.speed > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Speed:</span>
            <span className="font-medium">{ambulance.speed} km/h</span>
          </div>
        )}
        {ambulance.homeHospital && (
          <div className="flex justify-between">
            <span className="text-gray-600">Base:</span>
            <span className="font-medium">{String(ambulance.homeHospital)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DispatchPopup({ dispatch }: { dispatch: Dispatch }) {
  const priorityColors = {
    P0: "text-red-600 bg-red-100",
    P1: "text-red-600 bg-red-100",
    P2: "text-yellow-600 bg-yellow-100",
    P3: "text-yellow-600 bg-yellow-100",
    P4: "text-gray-600 bg-gray-100",
    P5: "text-gray-600 bg-gray-100",
  };

  // Safely handle symptoms - ensure it's always an array of strings
  const symptomsArray = Array.isArray(dispatch.symptoms)
    ? dispatch.symptoms
    : typeof dispatch.symptoms === "string"
      ? [dispatch.symptoms]
      : [];

  return (
    <div className="p-2 min-w-[250px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <WarningCircleIcon className="h-5 w-5 text-red-500" weight="fill" />
          <span className="font-bold text-sm">Emergency Call</span>
        </div>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded",
            priorityColors[dispatch.priority] || "text-gray-600 bg-gray-100"
          )}
        >
          {dispatch.priority}
        </span>
      </div>
      <div className="space-y-1 text-xs">
        <div>
          <span className="text-gray-600">Address:</span>
          <p className="font-medium">{dispatch.address || "Unknown location"}</p>
        </div>
        {symptomsArray.length > 0 && (
          <div>
            <span className="text-gray-600">Symptoms:</span>
            <p className="font-medium">{symptomsArray.join(", ")}</p>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <span className="font-medium uppercase">{dispatch.status.replace(/_/g, " ")}</span>
        </div>
        {dispatch.estimatedArrivalMinutes !== null && dispatch.estimatedArrivalMinutes > 0 && (
          <div className="flex items-center gap-1 mt-2 p-2 bg-blue-50 rounded">
            <ClockIcon className="h-4 w-4 text-blue-600" weight="bold" />
            <span className="font-medium text-blue-600">
              ETA: {dispatch.estimatedArrivalMinutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function HospitalPopup({ hospital }: { hospital: Hospital }) {
  return (
    <div className="p-2 min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <HospitalIcon className="h-5 w-5 text-green-500" weight="fill" />
        <span className="font-bold text-sm">{hospital.name || "Unknown Hospital"}</span>
      </div>
      <div className="space-y-1 text-xs">
        {hospital.code && (
          <div>
            <span className="text-gray-600">Code:</span>
            <span className="font-medium ml-1">{hospital.code}</span>
          </div>
        )}
        {(hospital.address || hospital.city) && (
          <div>
            <span className="text-gray-600">Address:</span>
            <p className="font-medium">
              {hospital.address || "Unknown address"}
              {hospital.city && `, ${hospital.city}`}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {hospital.hasSMUR && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
              SMUR
            </span>
          )}
          {hospital.hasEmergencyRoom && (
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
              ER
            </span>
          )}
          {hospital.hasHelicopterPad && (
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
              HELI
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <span className="text-gray-600">Ambulances:</span>
          <span className="font-medium">
            <span className="text-green-600">{hospital.availableAmbulances ?? 0}</span>
            <span className="text-gray-400"> / {hospital.totalAmbulances ?? 0}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
