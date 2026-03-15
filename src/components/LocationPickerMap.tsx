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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const defaultCenter = { lat: 24.7136, lng: 46.6753 };

  // Find nearby POI using Places Service
  const findNearbyPOI = useCallback(async (lat: number, lng: number): Promise<LocationInfo | null> => {
    if (!mapRef.current) return null;

    const service = new google.maps.places.PlacesService(mapRef.current);
    const location = new google.maps.LatLng(lat, lng);

    return new Promise((resolve) => {
      service.nearbySearch(
        {
          location,
          radius: 50, // 50 meters radius
          type: "point_of_interest",
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const place = results[0];
            const placeLocation = place.geometry?.location;
            // Only use if very close (within ~50m)
            if (placeLocation) {
              const distance = google.maps.geometry?.spherical?.computeDistanceBetween(location, placeLocation);
              if (distance === undefined || distance < 100) {
                resolve({
                  lat,
                  lng,
                  name: place.name || "",
                  neighborhood: "",
                  city: "",
                  street: "",
                  fullAddress: place.vicinity || "",
                });
                return;
              }
            }
          }
          resolve(null);
        }
      );
    });
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    setLoading(true);

    try {
      // Try to find a nearby POI first
      const poiResult = await findNearbyPOI(lat, lng);
      
      const response = await geocoderRef.current.geocode({ location: { lat, lng } });
      const results = response.results;

      if (!results?.length) {
        onLocationSelect(poiResult || { lat, lng, name: "موقع محدد", neighborhood: "", city: "", street: "", fullAddress: `${lat}, ${lng}` });
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

      // Use POI name if found, otherwise use geocoding result
      let name: string;
      if (poiResult && poiResult.name) {
        name = poiResult.name;
      } else {
        // Try to get a meaningful name from geocoding
        const poiGeoResult = results.find(r =>
          r.types.includes("point_of_interest") ||
          r.types.includes("establishment") ||
          r.types.includes("store") ||
          r.types.includes("restaurant") ||
          r.types.includes("cafe") ||
          r.types.includes("food")
        );
        if (poiGeoResult) {
          name = poiGeoResult.formatted_address.split(",")[0];
        } else {
          name = street || neighborhood || bestResult.formatted_address.split(",")[0];
        }
      }

      onLocationSelect({ lat, lng, name, neighborhood, city, street, fullAddress });
    } catch {
      onLocationSelect({ lat, lng, name: "موقع محدد", neighborhood: "", city: "", street: "", fullAddress: `${lat}, ${lng}` });
    } finally {
      setLoading(false);
    }
  }, [onLocationSelect, findNearbyPOI]);

  const placeMarker = useCallback((lat: number, lng: number) => {
    const position = { lat, lng };
    if (markerRef.current) {
      markerRef.current.setPosition(position);
    } else if (mapRef.current) {
      markerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        animation: google.maps.Animation.DROP,
      });
    }
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(17);
        }
        placeMarker(lat, lng);
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

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          } else {
            markerRef.current = new google.maps.Marker({
              position: { lat, lng },
              map,
              animation: google.maps.Animation.DROP,
            });
          }

          reverseGeocode(lat, lng);
        });

        mapRef.current = map;
        setMapReady(true);

        // Initialize new PlaceAutocompleteElement
        if (searchContainerRef.current) {
          try {
            const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
              componentRestrictions: { country: "sa" },
            });

            // Style the element
            placeAutocomplete.style.width = "100%";
            placeAutocomplete.style.height = "40px";

            // Clear and append
            searchContainerRef.current.innerHTML = "";
            searchContainerRef.current.appendChild(placeAutocomplete);

            placeAutocomplete.addEventListener("gmp-placeselect", async (event: any) => {
              const place = event.place;
              if (!place) return;

              // Fetch full place details
              await place.fetchFields({
                fields: ["displayName", "formattedAddress", "location", "addressComponents"],
              });

              const location = place.location;
              if (!location) return;

              const lat = location.lat();
              const lng = location.lng();

              map.setCenter({ lat, lng });
              map.setZoom(17);

              if (markerRef.current) {
                markerRef.current.setPosition({ lat, lng });
              } else {
                markerRef.current = new google.maps.Marker({
                  position: { lat, lng },
                  map,
                  animation: google.maps.Animation.DROP,
                });
              }

              // Extract address components
              const addressComponents = place.addressComponents || [];
              const getComponent = (type: string) => {
                const comp = addressComponents.find((c: any) => c.types?.includes(type));
                return comp?.longText || "";
              };

              const name = place.displayName || place.formattedAddress?.split(",")[0] || "";
              const neighborhood = getComponent("neighborhood") || getComponent("sublocality_level_1") || getComponent("sublocality") || "";
              const city = getComponent("locality") || getComponent("administrative_area_level_1") || "";
              const street = getComponent("route") || "";
              const fullAddress = place.formattedAddress || "";

              onLocationSelect({ lat, lng, name, neighborhood, city, street, fullAddress });
            });
          } catch (err) {
            console.warn("PlaceAutocompleteElement not available, falling back to basic search:", err);
          }
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {/* Search Input Container */}
      <div className="relative" ref={searchContainerRef}>
        <div className="flex h-10 w-full rounded-md border border-input bg-background items-center pr-3 gap-2 text-sm text-muted-foreground">
          <Search className="w-4 h-4 shrink-0" />
          <span>جاري تحميل البحث...</span>
        </div>
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
