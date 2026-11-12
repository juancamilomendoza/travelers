// Real place data from Google Maps (Places API New), so addresses, photos and contacts are not made up by the AI.
// Google's terms do not allow storing this data, so it is looked up for each answer and never saved.
import type { PlaceInfo } from "../../src/shared/schema.ts";

const BASIC_FIELDS = ["places.formattedAddress", "places.googleMapsUri", "places.photos"];
// Phone, website and rating are billed at a higher tier ("Enterprise").
const FULL_FIELDS = [...BASIC_FIELDS, "places.nationalPhoneNumber", "places.internationalPhoneNumber", "places.websiteUri", "places.rating", "places.userRatingCount"];

type GooglePlace = {
  formattedAddress?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[];
};

const key = () => process.env.GOOGLE_MAPS_API_KEY;
export const placesEnabled = () => !!key();

async function photoUrl(name: string): Promise<string | null> {
  // skipHttpRedirect returns a public image URL, so the API key never reaches the browser.
  const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=640&skipHttpRedirect=true`, {
    headers: { "X-Goog-Api-Key": key()! },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { photoUri?: string };
  return data.photoUri ?? null;
}

/** Finds one place by text ("name, area, city"). Returns null if Google has no match or the call fails. */
export async function findPlace(query: string, lang: string): Promise<PlaceInfo | null> {
  const full = process.env.GOOGLE_PLACES_LEVEL !== "basic";
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": key()!,
        "X-Goog-FieldMask": (full ? FULL_FIELDS : BASIC_FIELDS).join(","),
      },
      body: JSON.stringify({ textQuery: query, languageCode: lang, pageSize: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error("places search failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const p = ((await res.json()) as { places?: GooglePlace[] }).places?.[0];
    if (!p?.formattedAddress) return null;
    const photo = p.photos?.[0];
    const author = photo?.authorAttributions?.[0];
    return {
      address: p.formattedAddress,
      mapsUrl: p.googleMapsUri ?? null,
      photoUrl: photo ? await photoUrl(photo.name).catch(() => null) : null,
      photoBy: author?.displayName ?? null,
      photoByUrl: author?.uri ?? null,
      phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
      website: p.websiteUri ?? null,
      rating: p.rating ?? null,
      ratingCount: p.userRatingCount ?? null,
    };
  } catch (err) {
    console.error("places lookup error", err);
    return null;
  }
}
