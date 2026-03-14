/// <reference types="google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const defaultCenter = { lat: 24.7136, lng: 46.6753 };

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    setLoading(true);

    try {
      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      const results = response.results;

      if (!results?.length) {
        onLocationSelect({ lat, lng, name: "موقع محدد", neighborhood: "", city: "", street: "", fullAddress: `${lat}, ${lng}` });
        return;
      }

      // Find the most detailed result (POI or street address)
      const poiResult = results.find(r =>
        r.types.includes("point_of_interest") ||
        r.types.includes("establishment") ||
        r.types.includes("store") ||
        r.types.includes("restaurant") ||
        r.types.includes("cafe") ||
        r.types.includes("food")
      );

      const bestResult = poiResult || results[0];
      const components = bestResult.address_components;

      const getComponent = (type: string) =>
        components.find(c => c.types.includes(type))?.long_name || "";

      const name = poiResult
        ? (getComponent("point_of_interest") || getComponent("establishment") || bestResult.formatted_address.split(",")[0])
        : (getComponent("route") || getComponent("street_address") || bestResult.formatted_address.split(",")[0]);

      const neighborhood = getComponent("neighborhood") || getComponent("sublocality_level_1") || getComponent("sublocality") || "";
      const city = getComponent("locality") || getComponent("administrative_area_level_1") || "";
      const street = getComponent("route") || "";
      const fullAddress = bestResult.formatted_address || "";

      onLocationSelect({ lat, lng, name, neighborhood, city, street, fullAddress });
    } catch {
      onLocationSelect({ lat, lng, name: "موقع محدد", neighborhood: "", city: "", street: "", fullAddress: `${lat}, ${lng}` });
    } finally {
      setLoading(false);
    }
  }, [onLocationSelect]);

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
          markerRef.current = new google.maps.Marker({
            position,
            map: mapRef.current,
            animation: google.maps.Animation.DROP,
          });
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
          center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: [],
        });

        geocoderRef.current = new google.maps.Geocoder();

        if (selectedLocation) {
          markerRef.current = new google.maps.Marker({
            position: center,
            map,
            animation: google.maps.Animation.DROP,
          });
        }

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const position = { lat, lng };

          if (markerRef.current) {
            markerRef.current.setPosition(position);
          } else {
            markerRef.current = new google.maps.Marker({
              position,
              map,
              animation: google.maps.Animation.DROP,
            });
          }

          reverseGeocode(lat, lng);
        });

        mapRef.current = map;
        setMapReady(true);

        // Initialize Places Autocomplete
        if (searchInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: "sa" },
            fields: ["geometry", "formatted_address", "address_components", "name"],
          });
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const position = { lat, lng };

            map.setCenter(position);
            map.setZoom(17);

            if (markerRef.current) {
              markerRef.current.setPosition(position);
            } else {
              markerRef.current = new google.maps.Marker({
                position,
                map,
                animation: google.maps.Animation.DROP,
              });
            }

            // Extract address from place details
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
          autocompleteRef.current = autocomplete;
        }
      } catch (err) {
        console.error("Google Maps init error:", err);
        setMapError("تعذر تحميل الخريطة");
      }
    };

    init();

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
      autocompleteRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="ابحث عن موقع..."
          className="flex h-10 w-full rounded-md border border-input bg-background pr-9 pl-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          dir="rtl"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleLocateMe}
          disabled={locating || !mapReady}
          className="gap-2"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          موقعي الحالي
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

      {loading && (
        <p className="text-xs text-muted-foreground animate-pulse">جاري تحديد الموقع...</p>
      )}

      {selectedLocation && !loading && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm" dir="rtl">
          <p className="font-semibold text-foreground">{selectedLocation.name}</p>
          {selectedLocation.street && (
            <p className="text-muted-foreground">الشارع: {selectedLocation.street}</p>
          )}
          {selectedLocation.neighborhood && (
            <p className="text-muted-foreground">الحي: {selectedLocation.neighborhood}</p>
          )}
          {selectedLocation.city && (
            <p className="text-muted-foreground">المدينة: {selectedLocation.city}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
