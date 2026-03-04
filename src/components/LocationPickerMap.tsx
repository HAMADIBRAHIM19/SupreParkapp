import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationPickerMap = ({ onLocationSelect, selectedLocation }: LocationPickerMapProps) => {
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border" style={{ height: 250 }}>
        <MapContainer
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={reverseGeocode} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
          )}
        </MapContainer>
      </div>

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
