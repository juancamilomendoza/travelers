// Plain values shared by the web page and the Netlify functions (no zod, so the page bundle stays small).

export const CURRENCIES = ["COP", "USD", "EUR"] as const;
export const LANGS = ["es", "en"] as const;
export const VISAS = ["us", "schengen", "uk", "canada", "mexico", "other"] as const;
export const PLAN_TYPES = [
  "bachelor",
  "bachelorette",
  "family",
  "proposal",
  "honeymoon",
  "couple",
  "rest",
  "first_trip",
  "friends",
  "adventure",
  "culture_food",
  "celebration",
  "other",
] as const;

export type Currency = (typeof CURRENCIES)[number];
export type Lang = (typeof LANGS)[number];
export type Visa = (typeof VISAS)[number];
export type PlanType = (typeof PLAN_TYPES)[number];

/** Version of the consent text shown on screen 1. Bump it whenever the text changes. */
export const CONSENT_VERSION = "2026-11-12.2";
