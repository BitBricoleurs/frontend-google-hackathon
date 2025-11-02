import { useEffect, useRef, useCallback } from "react";

interface AmbulanceLocationUpdate {
  type: "ambulance:location:updated";
  ambulanceId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: string;
  heading: number | null;
  speed: number | null;
  dispatchId: string | null;
  timestamp: string;
}

interface WebSocketMessage {
  type: string;
  event?: {
    eventName?: string;
    data?: AmbulanceLocationUpdate;
  };
  [key: string]: unknown;
}

interface UseMapWebSocketOptions {
  onAmbulanceLocationUpdate?: (update: AmbulanceLocationUpdate) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export function useMapWebSocket(options: UseMapWebSocketOptions = {}) {
  const { onAmbulanceLocationUpdate, autoReconnect = true, reconnectDelay = 3000 } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (isConnectingRef.current || !isMountedRef.current) {
      return;
    }

    try {
      isConnectingRef.current = true;

      // Get WebSocket URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const wsUrl = apiUrl.replace("http://", "ws://").replace("https://", "wss://");

      const ws = new WebSocket(`${wsUrl}/ws/dashboard`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[MapWebSocket] Connected to dashboard");
        isConnectingRef.current = false;

        // Subscribe to map room for real-time ambulance updates
        ws.send(
          JSON.stringify({
            type: "subscribe",
            room: "map",
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("[MapWebSocket] Received message:", message.type);

          // Handle different message types
          if (message.type === "subscribed") {
            console.log("[MapWebSocket] Subscribed to room:", message.room);
          } else if (message.type === "domain_event") {
            // Domain event from event bus - this is what the backend actually sends!
            console.log("[MapWebSocket] Domain event:", message.eventName);

            if (message.eventName === "AmbulanceLocationUpdatedEvent") {
              const eventData = message.data as {
                ambulanceId: string;
                location: { latitude: number; longitude: number };
                status: string;
                heading: number | null;
                speed: number | null;
                dispatchId?: string | null;
                occurredAt?: string;
              };
              console.log("[MapWebSocket] Ambulance location update:", eventData);

              if (onAmbulanceLocationUpdate && eventData) {
                // Extract the payload from the event
                const update = {
                  type: "ambulance:location:updated" as const,
                  ambulanceId: eventData.ambulanceId,
                  location: eventData.location,
                  status: eventData.status,
                  heading: eventData.heading,
                  speed: eventData.speed,
                  dispatchId: eventData.dispatchId,
                  timestamp: eventData.occurredAt || new Date().toISOString(),
                };
                onAmbulanceLocationUpdate(update);
              }
            }
          } else if (message.type === "ambulance:location:updated") {
            // Direct ambulance location update
            console.log("[MapWebSocket] Direct ambulance update");
            if (onAmbulanceLocationUpdate) {
              onAmbulanceLocationUpdate(message as unknown as AmbulanceLocationUpdate);
            }
          }
        } catch (error) {
          console.error("[MapWebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[MapWebSocket] WebSocket error:", error);
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        console.log("[MapWebSocket] Disconnected");
        wsRef.current = null;
        isConnectingRef.current = false;

        // Auto-reconnect if enabled and component is still mounted
        if (autoReconnect && isMountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[MapWebSocket] Attempting to reconnect...");
            connect();
          }, reconnectDelay);
        }
      };
    } catch (error) {
      console.error("[MapWebSocket] Failed to connect:", error);
      isConnectingRef.current = false;

      // Retry connection if auto-reconnect is enabled
      if (autoReconnect && isMountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
      }
    }
  }, [onAmbulanceLocationUpdate, autoReconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
  };
}
