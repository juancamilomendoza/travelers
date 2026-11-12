// Plain values shared by the web page and the Netlify functions (no zod, so the page bundle stays small).

export const CURRENCIES = ["COP", "USD", "EUR"] as const;
export const LANGS = ["es", "en"] as const;
/** Whether the travelers have a valid passport: everyone, some of them, or nobody. */
export const PASSPORT = ["all", "some", "none"] as const;
/** What the group wants to do in "a plan in my city". */
export const INTERESTS = ["food", "nightlife", "culture", "outdoors", "kids", "romantic", "celebration"] as const;
/** When the local plan happens. */
export const WHEN = ["today", "weekend", "date"] as const;
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
export type Passport = (typeof PASSPORT)[number];
export type Interest = (typeof INTERESTS)[number];
export type When = (typeof WHEN)[number];

/** Group size limits. Babies count as children (age 0). */
export const MAX_TRAVELERS = 20;
export const MAX_CHILDREN = 10;
export const MAX_NATIONALITIES = 6;
export type PlanType = (typeof PLAN_TYPES)[number];

/** Version of the consent text shown on screen 1. Bump it whenever the text changes. */
export const CONSENT_VERSION = "2026-11-12.2";
