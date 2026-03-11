import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, LocateFixed } from "lucide-react";

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

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

const LocationPickerMap = ({ onLocationSelect, selectedLocation }: LocationPickerMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [locating, setLocating] = useState(false);

  const defaultCenter: [number, number] = [24.7136, 46.6753]; // Riyadh

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&addressdetails=1`
      );
      const data = await res.json();
      const addr = data.address || {};

      const name = data.display_name?.split(",")[0] || addr.road || addr.building || "موقع محدد";
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

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=ar&addressdetails=1&limit=5&countrycodes=sa`
      );
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }

    setShowResults(false);
    setSearchQuery("");
    reverseGeocode(lat, lng);
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
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

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
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            placeholder="ابحث عن موقع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="text-right"
            dir="rtl"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto" dir="rtl">
            {searchResults.map((result, i) => (
              <button
                key={i}
                type="button"
                className="w-full text-right px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                onClick={() => handleSelectResult(result)}
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}

        {showResults && !searching && searchResults.length === 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-background border rounded-lg shadow-lg p-3 text-center text-sm text-muted-foreground" dir="rtl">
            لا توجد نتائج
          </div>
        )}
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
