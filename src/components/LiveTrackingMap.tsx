import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Loader2, BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LiveTrackingMapProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingLocation: string;
}

interface CrewPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

const PROXIMITY_THRESHOLD_METERS = 500;

/** Haversine distance in meters */
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LiveTrackingMap = ({ open, onOpenChange, bookingId, bookingLocation }: LiveTrackingMapProps) => {
  const { t, dir } = useLanguage();
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const crewMarkerRef = useRef<google.maps.Marker | null>(null);
  const destMarkerRef = useRef<google.maps.Marker | null>(null);
  const destLatLngRef = useRef<{ lat: number; lng: number } | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const proximityNotifiedRef = useRef(false);
  const [crewPos, setCrewPos] = useState<CrewPosition | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapsApiReady, setMapsApiReady] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [crewNearby, setCrewNearby] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    if (!open) return;
    if (window.google?.maps) {
      setMapsApiReady(true);
      return;
    }

    const loadMapsApi = async () => {
      try {
        const { data } = await supabase.functions.invoke("get-maps-key");
        if (!data?.key) return;
        if (window.google?.maps) { setMapsApiReady(true); return; }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places,geometry&language=ar&region=SA`;
        script.async = true;
        script.onload = () => setMapsApiReady(true);
        document.head.appendChild(script);
      } catch {}
    };
    loadMapsApi();
  }, [open]);

  // Initialize map
  useEffect(() => {
    if (!open || !mapsApiReady || !mapContainerRef.current || mapRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: 24.7136, lng: 46.6753 },
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
    });
    mapRef.current = map;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: bookingLocation + ", Saudi Arabia" }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const pos = results[0].geometry.location;
        destLatLngRef.current = { lat: pos.lat(), lng: pos.lng() };
        destMarkerRef.current = new google.maps.Marker({
          position: pos,
          map,
          title: bookingLocation,
          icon: {
            url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          },
        });
        map.setCenter(pos);
      }
    });

    setMapLoaded(true);
  }, [open, mapsApiReady]);

  // Subscribe to crew location
  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel(`tracking-${bookingId}`)
      .on("broadcast", { event: "crew-location" }, ({ payload }) => {
        setCrewPos(payload as CrewPosition);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [open, bookingId]);

  // Update crew marker + check proximity
  useEffect(() => {
    if (!crewPos || !mapRef.current) return;

    const pos = new google.maps.LatLng(crewPos.lat, crewPos.lng);

    if (crewMarkerRef.current) {
      crewMarkerRef.current.setPosition(pos);
    } else {
      crewMarkerRef.current = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: t("crewLocation"),
        icon: {
          url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%233b82f6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6" stroke="white"/></svg>`),
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 18),
        },
      });
    }

    // Calculate distance & check proximity
    if (destLatLngRef.current) {
      const dist = getDistanceMeters(crewPos.lat, crewPos.lng, destLatLngRef.current.lat, destLatLngRef.current.lng);
      setDistanceMeters(Math.round(dist));

      if (dist <= PROXIMITY_THRESHOLD_METERS && !proximityNotifiedRef.current) {
        proximityNotifiedRef.current = true;
        setCrewNearby(true);
        toast({
          title: t("crewNearbyTitle"),
          description: t("crewNearbyDesc"),
        });
        // Try browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(t("crewNearbyTitle"), { body: t("crewNearbyDesc") });
        } else if ("Notification" in window && Notification.permission !== "denied") {
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") {
              new Notification(t("crewNearbyTitle"), { body: t("crewNearbyDesc") });
            }
          });
        }
      }
    }

    // Fit bounds
    if (destMarkerRef.current) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pos);
      bounds.extend(destMarkerRef.current.getPosition()!);
      mapRef.current.fitBounds(bounds, 60);
    }
  }, [crewPos]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      crewMarkerRef.current?.setMap(null);
      crewMarkerRef.current = null;
      destMarkerRef.current?.setMap(null);
      destMarkerRef.current = null;
      mapRef.current = null;
      destLatLngRef.current = null;
      proximityNotifiedRef.current = false;
      setMapLoaded(false);
      setCrewPos(null);
      setDistanceMeters(null);
      setCrewNearby(false);
    }
  }, [open]);

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} ${t("km")}`;
    return `${meters} ${t("meter")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" />
            {t("liveTracking")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <MapPin className="w-3 h-3 text-destructive" />
            {t("destination")}: {bookingLocation}
          </Badge>
          {crewNearby ? (
            <Badge className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white">
              <BellRing className="w-3 h-3" />
              {t("crewNearbyTitle")}
            </Badge>
          ) : crewPos ? (
            <Badge variant="default" className="gap-1 text-xs animate-pulse">
              <Navigation className="w-3 h-3" />
              {t("crewOnTheWay")}
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("waitingForCrewLocation")}
            </Badge>
          )}
          {distanceMeters !== null && (
            <Badge variant="outline" className="gap-1 text-xs font-mono">
              {formatDistance(distanceMeters)}
            </Badge>
          )}
        </div>

        <div className="relative w-full" style={{ height: "400px" }}>
          <div ref={mapContainerRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="p-4 pt-2 flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-destructive inline-block" />
            {t("destination")}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-primary inline-block" />
            {t("crewLocation")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveTrackingMap;
