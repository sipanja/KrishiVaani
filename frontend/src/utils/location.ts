/**
 * Automatic Geolocation Helper for KrishiVaani AI
 * Automatically requests and caches farmer's current coordinates for real-time weather forecasting.
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

const CACHE_KEY_LAT = 'krishi_geo_lat';
const CACHE_KEY_LON = 'krishi_geo_lon';
const CACHE_KEY_TIME = 'krishi_geo_time';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function getAutomaticCoordinates(forceRefresh = false): Promise<Coordinates | null> {
  // Check session cache if not forcing refresh
  if (!forceRefresh && typeof window !== 'undefined' && window.sessionStorage) {
    const cachedLat = sessionStorage.getItem(CACHE_KEY_LAT);
    const cachedLon = sessionStorage.getItem(CACHE_KEY_LON);
    const cachedTime = sessionStorage.getItem(CACHE_KEY_TIME);

    if (cachedLat && cachedLon && cachedTime) {
      const elapsed = Date.now() - parseInt(cachedTime, 10);
      if (elapsed < CACHE_TTL_MS) {
        return {
          lat: parseFloat(cachedLat),
          lon: parseFloat(cachedLon),
        };
      }
    }
  }

  // Request browser geolocation
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return null;
  }

  return new Promise<Coordinates | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        try {
          sessionStorage.setItem(CACHE_KEY_LAT, coords.lat.toString());
          sessionStorage.setItem(CACHE_KEY_LON, coords.lon.toString());
          sessionStorage.setItem(CACHE_KEY_TIME, Date.now().toString());
        } catch {
          // ignore session storage quotas
        }

        resolve(coords);
      },
      (error) => {
        console.warn('Automatic geolocation unavailable or dismissed:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 300000, // 5 minutes cached by browser
      }
    );
  });
}
