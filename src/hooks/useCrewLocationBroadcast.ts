import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { watchCoordinates } from "@/lib/geolocation";

/**
 * Crew broadcasts their GPS location to spot requesters via Supabase Realtime.
 * Only runs when `active` is true (i.e., crew has approved bookings).
 */
export const useCrewLocationBroadcast = (bookingIds: string[], active: boolean) => {
  const stopWatchRef = useRef<(() => void) | null>(null);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    if (!active || bookingIds.length === 0) return;

    // Create channels for each booking
    const channels = bookingIds.map((id) =>
      supabase.channel(`tracking-${id}`).subscribe()
    );
    channelsRef.current = channels;

    // Start watching position
    watchCoordinates(
        (coords) => {
          const payload = {
            lat: coords.latitude,
            lng: coords.longitude,
            accuracy: coords.accuracy,
            timestamp: Date.now(),
          };
          channels.forEach((ch, i) => {
            ch.send({
              type: "broadcast",
              event: "crew-location",
              payload,
            });
          });
        },
        undefined,
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
      .then((stop) => { stopWatchRef.current = stop; })
      .catch((error) => console.error("Crew location watch failed", error));

    return () => {
      stopWatchRef.current?.();
      stopWatchRef.current = null;
      channels.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [active, bookingIds.join(",")]);
};
