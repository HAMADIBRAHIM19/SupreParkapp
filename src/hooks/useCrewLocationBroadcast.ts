import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Crew broadcasts their GPS location to seekers via Supabase Realtime.
 * Only runs when `active` is true (i.e., crew has approved bookings).
 */
export const useCrewLocationBroadcast = (bookingIds: string[], active: boolean) => {
  const watchIdRef = useRef<number | null>(null);
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  useEffect(() => {
    if (!active || bookingIds.length === 0) return;

    // Create channels for each booking
    const channels = bookingIds.map((id) =>
      supabase.channel(`tracking-${id}`).subscribe()
    );
    channelsRef.current = channels;

    // Start watching position
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const payload = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
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
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      channels.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [active, bookingIds.join(",")]);
};
