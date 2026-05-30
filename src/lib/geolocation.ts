import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export interface AppCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const LOCATION_PERMISSION_DENIED = "LOCATION_PERMISSION_DENIED";
const LOCATION_UNSUPPORTED = "LOCATION_UNSUPPORTED";

const hasLocationPermission = (status: { location?: string; coarseLocation?: string }) =>
  status.location === "granted" || status.coarseLocation === "granted";

const ensureNativeLocationPermission = async () => {
  const current = await Geolocation.checkPermissions().catch(() => null);
  if (current && hasLocationPermission(current)) return;

  const requested = await Geolocation.requestPermissions({ permissions: ["location"] });
  if (!hasLocationPermission(requested)) {
    throw new Error(LOCATION_PERMISSION_DENIED);
  }
};

const normalizeWebLocationError = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) return new Error(LOCATION_PERMISSION_DENIED);
  return error;
};

export const getCurrentCoordinates = async (options?: PositionOptions): Promise<AppCoordinates> => {
  if (Capacitor.isNativePlatform()) {
    await ensureNativeLocationPermission();
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: options?.timeout ?? 15000,
      maximumAge: options?.maximumAge ?? 0,
      enableLocationFallback: true,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  }

  if (!navigator.geolocation) throw new Error(LOCATION_UNSUPPORTED);

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      (error) => reject(normalizeWebLocationError(error)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0, ...options },
    );
  });
};

export const watchCoordinates = async (
  onPosition: (coords: AppCoordinates) => void,
  onError?: (error: unknown) => void,
  options?: PositionOptions,
): Promise<() => void> => {
  if (Capacitor.isNativePlatform()) {
    await ensureNativeLocationPermission();
    const id = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 5000,
        minimumUpdateInterval: 5000,
        enableLocationFallback: true,
      },
      (position, error) => {
        if (error) {
          onError?.(error);
          return;
        }
        if (!position) return;
        onPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
    );

    return () => { void Geolocation.clearWatch({ id }); };
  }

  if (!navigator.geolocation) throw new Error(LOCATION_UNSUPPORTED);

  const id = navigator.geolocation.watchPosition(
    (position) => onPosition({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    }),
    (error) => onError?.(normalizeWebLocationError(error)),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000, ...options },
  );

  return () => navigator.geolocation.clearWatch(id);
};

export const isLocationPermissionDenied = (error: unknown) =>
  error instanceof Error && error.message === LOCATION_PERMISSION_DENIED;