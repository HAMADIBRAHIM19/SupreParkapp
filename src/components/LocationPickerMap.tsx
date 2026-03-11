import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export interface LocationInfo {
  lat: number;
  lng: number;
  name: string;
  neighborhood: string;
  city: string;
  fullAddress: string;
}

interface LocationPickerMapProps {
  onLocationSelect: (location: LocationInfo) => void;
  selectedLocation: LocationInfo | null;
}

const LocationPickerMap = ({ onLocationSelect, selectedLocation }: LocationPickerMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const defaultCenter: [number, number] = [24.7136, 46.6753];

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&addressdetails=1&zoom=18`
      );
      const data = await res.json();
      const addr = data.address || {};

      const name = addr.amenity || addr.shop || addr.tourism || addr.leisure || addr.building || addr.road || data.display_name?.split(",")[0] || "موقع محدد";
      const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || "";
      const city = addr.city || addr.town || addr.state || "";
      const fullAddress = data.display_name || "";

      onLocationSelect({ lat, lng, name, neighborhood, city, fullAddress });
    } catch {
      onLocationSelect({ lat, lng, name: "موقع محدد", neighborhood: "", city: "", fullAddress: `${lat}, ${lng}` });
    } finally {
      setLoading(false);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else if (mapRef.current) {
          markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
        }
        setLocating(false);
        reverseGeocode(lat, lng);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = selectedLocation ? [selectedLocation.lat, selectedLocation.lng] as [number, number] : defaultCenter;

    const map = L.map(containerRef.current).setView(center, 16);
    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      reverseGeocode(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleLocateMe}
          disabled={locating}
          className="gap-2"
        >
          {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          موقعي الحالي
        </Button>
      </div>

      <div ref={containerRef} className="rounded-lg overflow-hidden border" style={{ height: 250 }} />

      {loading && (
        <p className="text-xs text-muted-foreground animate-pulse">جاري تحديد الموقع...</p>
      )}

      {selectedLocation && !loading && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm" dir="rtl">
          <p className="font-semibold text-foreground">{selectedLocation.name}</p>
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
