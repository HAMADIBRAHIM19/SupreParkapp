/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

declare global {
  interface Window {
    google?: typeof google;
  }
}

export interface LocationInfo {
  lat: number;
  lng: number;
  name: string;
  neighborhood: string;
  city: string;
  street: string;
  fullAddress: string;
}

interface LocationPickerMapProps {
  onLocationSelect: (location: LocationInfo) => void;
  selectedLocation: LocationInfo | null;
}

// Load Google Maps script dynamically
let googleMapsPromise: Promise<void> | null = null;

const loadGoogleMaps = async (): Promise<void> => {
  if (googleMapsPromise) return googleMapsPromise;
  if (window.google?.maps) return Promise.resolve();

  googleMapsPromise = (async () => {
    const { data, error } = await supabase.functions.invoke("get-maps-key");
    if (error || !data?.key) throw new Error("Failed to load Maps API key");

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places&language=ar&region=SA`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  })();

  return googleMapsPromise;
};

const LocationPickerMap = ({ onLocationSelect, selectedLocation }: LocationPickerMapProps) => {
  const { t, dir, lang } = useLanguage();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const defaultCenter = { lat: 24.7136, lng: 46.6753 };

  // Find the closest POI to the clicked point.
  // Search radius scales with map zoom and device pixel ratio so high-zoom/high-DPR
  // clicks are tight while low-zoom clicks still find nearby places.
  const findNearbyPOI = useCallback((lat: number, lng: number): Promise<string | null> => {
    if (!mapRef.current) return Promise.resolve(null);

    const map = mapRef.current;
    const zoom = map.getZoom() ?? 16;
    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;

    // Approx meters per pixel at given lat/zoom (Web Mercator).
    const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
    // Use a click tolerance of ~20 CSS pixels, adjusted by DPR (sharper screens → tighter).
    const tolerancePx = 20 / Math.max(1, dpr);
    const searchRadius = Math.min(120, Math.max(15, metersPerPixel * tolerancePx));
    // Acceptance distance is a bit tighter than the search radius.
    const acceptMeters = Math.min(80, Math.max(10, metersPerPixel * (tolerancePx * 0.75)));
    // Convert acceptance meters → squared degrees for cheap comparison.
    const degPerMeter = 1 / 111320;
    const acceptDegSq = (acceptMeters * degPerMeter) ** 2;

    const service = new google.maps.places.PlacesService(map);
    const location = new google.maps.LatLng(lat, lng);

    return new Promise((resolve) => {
      service.nearbySearch(
        { location, radius: searchRadius, type: "point_of_interest" },
        (results, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.length) {
            resolve(null);
            return;
          }
          let best: google.maps.places.PlaceResult | null = null;
          let bestDist = Infinity;
          for (const r of results) {
            const loc = r.geometry?.location;
            if (!loc) continue;
            const dLat = loc.lat() - lat;
            const dLng = loc.lng() - lng;
            const d = dLat * dLat + dLng * dLng;
            if (d < bestDist) { bestDist = d; best = r; }
          }
          if (best && bestDist < acceptDegSq) {
            resolve(best.name || null);
          } else {
            resolve(null);
          }
        }
      );
    });
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    setLoading(true);

    try {
      // Try to find a nearby POI name
      const poiName = await findNearbyPOI(lat, lng);

      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      const results = response.results;

      if (!results?.length) {
        onLocationSelect({ lat, lng, name: poiName || t("selectedPosition"), neighborhood: "", city: "", street: "", fullAddress: `${lat}, ${lng}` });
        return;
      }

      const bestResult = results[0];
      const components = bestResult.address_components;
      const getComponent = (type: string) =>
        components.find(c => c.types.includes(type))?.long_name || "";

      const neighborhood = getComponent("neighborhood") || getComponent("sublocality_level_1") || getComponent("sublocality") || "";
      const city = getComponent("locality") || getComponent("administrative_area_level_1") || "";
      const street = getComponent("route") || "";
      const fullAddress = bestResult.formatted_address || "";

      // Use POI name if found, otherwise fallback to geocoding
      let name: string;
      if (poiName) {
        name = poiName;
      } else {
        const poiGeoResult = results.find(r =>
          r.types.some(t => ["point_of_interest", "establishment", "store", "restaurant", "cafe", "food"].includes(t))
        );
        name = poiGeoResult
          ? poiGeoResult.formatted_address.split(",")[0]
          : (street || neighborhood || bestResult.formatted_address.split(",")[0]);
      }

      onLocationSelect({ lat, lng, name, neighborhood, city, street, fullAddress });
    } catch {
      onLocationSelect({ lat, lng, name: t("selectedPosition"), neighborhood: "", city: "", street: "", fullAddress: `${lat}, ${lng}` });
    } finally {
      setLoading(false);
    }
  }, [onLocationSelect, findNearbyPOI]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const position = { lat, lng };
        if (mapRef.current) {
          mapRef.current.setCenter(position);
          mapRef.current.setZoom(17);
        }
        if (markerRef.current) {
          markerRef.current.setPosition(position);
        } else if (mapRef.current) {
          markerRef.current = new google.maps.Marker({ position, map: mapRef.current, animation: google.maps.Animation.DROP });
        }
        setLocating(false);
        reverseGeocode(lat, lng);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const center = selectedLocation
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : defaultCenter;

        const map = new google.maps.Map(containerRef.current, {
          center, zoom: 16,
          mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
          zoomControl: true, gestureHandling: "greedy",
        });

        geocoderRef.current = new google.maps.Geocoder();

        if (selectedLocation) {
          markerRef.current = new google.maps.Marker({ position: center, map, animation: google.maps.Animation.DROP });
        }

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const position = { lat, lng };
          if (markerRef.current) {
            markerRef.current.setPosition(position);
          } else {
            markerRef.current = new google.maps.Marker({ position, map, animation: google.maps.Animation.DROP });
          }
          reverseGeocode(lat, lng);
        });

        mapRef.current = map;
        setMapReady(true);

        // Initialize Places Autocomplete
        if (searchInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ["geometry", "formatted_address", "address_components", "name", "types"],
          });
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            map.setCenter({ lat, lng });
            map.setZoom(17);

            if (markerRef.current) {
              markerRef.current.setPosition({ lat, lng });
            } else {
              markerRef.current = new google.maps.Marker({ position: { lat, lng }, map, animation: google.maps.Animation.DROP });
            }

            const components = place.address_components || [];
            const getComponent = (type: string) =>
              components.find(c => c.types.includes(type))?.long_name || "";

            const name = place.name || place.formatted_address?.split(",")[0] || "";
            const neighborhood = getComponent("neighborhood") || getComponent("sublocality_level_1") || getComponent("sublocality") || "";
            const city = getComponent("locality") || getComponent("administrative_area_level_1") || "";
            const street = getComponent("route") || "";
            const fullAddress = place.formatted_address || "";

            onLocationSelect({ lat, lng, name, neighborhood, city, street, fullAddress });
          });
        }
      } catch (err) {
        console.error("Google Maps init error:", err);
        setMapError(t("mapLoadError"));
      }
    };

    init();

    return () => {
      cancelled = true;
      if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder={t("searchLocation")}
          className={`flex h-10 w-full rounded-md border border-input bg-background ${dir === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3"} py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
          dir={dir}
        />
      </div>

      <div className={`flex ${dir === "rtl" ? "justify-end" : "justify-start"}`}>
        <Button type="button" size="sm" variant="outline" onClick={handleLocateMe} disabled={locating || !mapReady} className="gap-2">
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          {t("myCurrentLocation")}
        </Button>
      </div>

      <div className="relative rounded-lg overflow-hidden border" style={{ height: 250 }}>
        <div ref={containerRef} className="w-full h-full" />
        {!mapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-sm text-destructive z-10">
            {mapError}
          </div>
        )}
      </div>

      {loading && <p className="text-xs text-muted-foreground animate-pulse">{t("locatingPosition")}</p>}

      {selectedLocation && !loading && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm" dir={dir}>
          <p className="font-semibold text-foreground">{selectedLocation.name}</p>
          {selectedLocation.street && <p className="text-muted-foreground">{t("streetLabel")}: {selectedLocation.street}</p>}
          {selectedLocation.neighborhood && <p className="text-muted-foreground">{t("neighborhoodLabel")}: {selectedLocation.neighborhood}</p>}
          {selectedLocation.city && <p className="text-muted-foreground">{t("cityLabel")}: {selectedLocation.city}</p>}
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
