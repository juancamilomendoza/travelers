import type { Lang } from "./shared/constants";

/**
 * The city the browser is in, or null. The browser asks the user for permission first.
 * Coordinates are rounded to about 1 km before the free reverse-geocoding lookup and are never stored.
 */
export async function currentCity(lang: Lang): Promise<string | null> {
  if (!("geolocation" in navigator)) return null;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, maximumAge: 600000 }),
    );
    const lat = pos.coords.latitude.toFixed(2);
    const lon = pos.coords.longitude.toFixed(2);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`,
    );
    const data = (await res.json()) as { city?: string; locality?: string };
    return data.city || data.locality || null;
  } catch {
    return null;
  }
}
