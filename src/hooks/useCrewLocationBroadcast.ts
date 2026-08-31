import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { watchCoordinates } from "@/lib/geolocation";

interface LocationPayload {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Crew broadcasts their GPS location to spot requesters via Supabase Realtime.
 * Only runs when `active` is true (i.e., crew has approved bookings).
 *
 * Broadcast messages are ephemeral, so we also:
 * - only send after the channel is actually SUBSCRIBED,
 * - re-send the last known position on a heartbeat,
 * - answer "request-location" pings sent by a requester who just opened the map.
 */
export const useCrewLocationBroadcast = (bookingIds: string[], active: boolean) => {
  const stopWatchRef = useRef<(() => void) | null>(null);
  const lastPayloadRef = useRef<LocationPayload | null>(null);

  useEffect(() => {
    if (!active || bookingIds.length === 0) return;

    const ready = new Set<string>();

    const channels = bookingIds.map((id) => {
      const channel = supabase.channel(`tracking-${id}`);
      channel
        .on("broadcast", { event: "request-location" }, () => {
          if (lastPayloadRef.current && ready.has(id)) {
            channel.send({ type: "broadcast", event: "crew-location", payload: lastPayloadRef.current });
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            ready.add(id);
            if (lastPayloadRef.current) {
              channel.send({ type: "broadcast", event: "crew-location", payload: lastPayloadRef.current });
            }
          } else {
            ready.delete(id);
          }
        });
      return { id, channel };
    });

    const broadcast = (payload: LocationPayload) => {
      channels.forEach(({ id, channel }) => {
        if (!ready.has(id)) return;
        channel.send({ type: "broadcast", event: "crew-location", payload });
      });
    };

    watchCoordinates(
      (coords) => {
        const payload: LocationPayload = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: Date.now(),
        };
        lastPayloadRef.current = payload;
        broadcast(payload);
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    )
      .then((stop) => {
        stopWatchRef.current = stop;
      })
      .catch((error) => console.error("Crew location watch failed", error));

    // Heartbeat so a requester opening the map gets a position quickly.
    const heartbeat = window.setInterval(() => {
      if (lastPayloadRef.current) broadcast({ ...lastPayloadRef.current });
    }, 8000);

    return () => {
      window.clearInterval(heartbeat);
      stopWatchRef.current?.();
      stopWatchRef.current = null;
      channels.forEach(({ channel }) => supabase.removeChannel(channel));
    };
  }, [active, bookingIds.join(",")]);
};
