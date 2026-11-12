import { CONSENT_VERSION, MAX_TRAVELERS, type Currency, type Interest, type Lang, type Passport, type When, type PlanType, type Visa } from "./shared/constants";
import type { PlanRequest } from "./shared/schema";

/** Everything the two form screens collect. Kept as strings where the user types, converted on submit. */
export type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  consent: boolean;
  mode: "suggest" | "known" | "local";
  /** "A plan in my city": where, what and when. The date reuses startDate. */
  city: string;
  interests: Interest[];
  when: When | null;
  destination: string;
  origin: string;
  /** Countries already added to the group. */
  nationalities: string[];
  currency: Currency;
  /** Total for the whole group, digits only. */
  budget: string;
  adults: number;
  /** One age per child; null until the user picks it. */
  childrenAges: (number | null)[];
  planType: PlanType | "";
  startDate: string;
  endDate: string;
  days: string;
  passport: Passport | null;
  visas: Visa[];
  hasFlights: boolean | null;
  hasLodging: boolean | null;
};

export const emptyForm: FormState = {
  name: "",
  email: "",
  whatsapp: "+57 ",
  consent: false,
  mode: "suggest",
  city: "",
  interests: [],
  when: null,
  destination: "",
  origin: "",
  nationalities: [],
  currency: "COP",
  budget: "",
  adults: 2,
  childrenAges: [],
  planType: "",
  startDate: "",
  endDate: "",
  days: "4",
  passport: null,
  visas: [],
  hasFlights: null,
  hasLodging: null,
};

export function daysBetween(start: string, end: string): number | null {
  if (!start || !end) return null;
  const d = Math.round((Date.parse(end) - Date.parse(start)) / 864e5) + 1;
  return d >= 1 ? d : null;
}

export const parseAmount = (s: string) => Number(s.replace(/[^\d]/g, ""));

export type Errors = Partial<Record<keyof FormState, string>>;

/** The WhatsApp field starts with "+57 ", so a value with only a country code counts as empty. */
const phoneOrNull = (s: string) => (s.replace(/\D/g, "").length > 3 ? s.trim() : null);
const textOrNull = (s: string) => s.trim() || null;

export const hasContact = (f: FormState) => !!(textOrNull(f.name) || textOrNull(f.email) || phoneOrNull(f.whatsapp));

/** All three fields are optional; whatever is filled in must be valid, and then consent is required. */
export function validateAbout(f: FormState, t: { required: string; invalidEmail: string; invalidPhone: string; mustConsent: string }): Errors {
  const e: Errors = {};
  if (f.name.trim() && f.name.trim().length < 2) e.name = t.required;
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = t.invalidEmail;
  const phone = phoneOrNull(f.whatsapp);
  if (phone && (!/^\+?[0-9 ]{7,20}$/.test(phone) || phone.replace(/\D/g, "").length < 7)) e.whatsapp = t.invalidPhone;
  if (hasContact(f) && !f.consent) e.consent = t.mustConsent;
  return e;
}

export function validateTrip(f: FormState, t: { required: string; invalidDates: string; childAgeMissing: string }): Errors {
  const e: Errors = {};
  if (!(parseAmount(f.budget) > 0)) e.budget = t.required;
  if (f.adults < 1 || f.adults + f.childrenAges.length > MAX_TRAVELERS) e.adults = t.required;
  if (f.childrenAges.some((a) => a === null)) e.childrenAges = t.childAgeMissing;
  if (f.mode === "local") {
    if (f.city.trim().length < 2) e.city = t.required;
    if (f.interests.length === 0) e.interests = t.required;
    if (f.when === null) e.when = t.required;
    if (f.when === "date" && !f.startDate) e.startDate = t.required;
    return e;
  }
  if (f.mode === "known" && f.destination.trim().length < 2) e.destination = t.required;
  if (f.origin.trim().length < 2) e.origin = t.required;
  if (f.nationalities.length === 0) e.nationalities = t.required;
  if (!f.planType) e.planType = t.required;
  if (f.startDate && f.endDate && !daysBetween(f.startDate, f.endDate)) e.endDate = t.invalidDates;
  const d = Number(f.days);
  if (!daysBetween(f.startDate, f.endDate) && (!Number.isInteger(d) || d < 1 || d > 30)) e.days = t.required;
  // "Some of us" only makes sense for a group; it may linger if the group shrank to one person.
  const solo = f.adults + f.childrenAges.length === 1;
  if (f.mode === "suggest" && (f.passport === null || (solo && f.passport === "some"))) e.passport = t.required;
  if (f.mode === "known" && f.hasFlights === null) e.hasFlights = t.required;
  if (f.mode === "known" && f.hasLodging === null) e.hasLodging = t.required;
  return e;
}

export function toRequest(f: FormState, lang: Lang): PlanRequest {
  const auto = daysBetween(f.startDate, f.endDate);
  const base = {
    lang,
    name: textOrNull(f.name),
    email: textOrNull(f.email),
    whatsapp: phoneOrNull(f.whatsapp),
    consent: hasContact(f) && f.consent,
    consentVersion: hasContact(f) && f.consent ? CONSENT_VERSION : null,
    currency: f.currency,
    budgetTotal: parseAmount(f.budget),
    adults: f.adults,
    childrenAges: f.childrenAges.map((a) => a ?? 0),
  };
  if (f.mode === "local") {
    const when = f.when ?? "today";
    return { mode: "local", ...base, city: f.city.trim(), interests: f.interests, when, date: when === "date" ? f.startDate || null : null };
  }
  const common = {
    ...base,
    planType: f.planType as PlanType,
    startDate: f.startDate || null,
    endDate: f.endDate || null,
    days: Math.min(auto ?? Number(f.days), 30),
    origin: f.origin.trim(),
    nationalities: f.nationalities,
  };
  return f.mode === "suggest"
    ? { mode: "suggest", ...common, passport: f.passport ?? "none", visas: f.passport === "none" ? [] : f.visas }
    : { mode: "known", ...common, destination: f.destination.trim(), hasFlights: !!f.hasFlights, hasLodging: !!f.hasLodging };
}

export function money(n: number, currency: Currency, lang: Lang) {
  return new Intl.NumberFormat(lang === "es" ? "es-CO" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}
