import { CONSENT_VERSION, type Currency, type Lang, type PlanType, type Visa } from "./shared/constants";
import type { PlanRequest } from "./shared/schema";

/** Everything the two form screens collect. Kept as strings where the user types, converted on submit. */
export type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  consent: boolean;
  mode: "suggest" | "known";
  destination: string;
  origin: string;
  currency: Currency;
  budget: string;
  travelers: string;
  planType: PlanType | "";
  startDate: string;
  endDate: string;
  days: string;
  hasPassport: boolean | null;
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
  destination: "",
  origin: "Bogotá",
  currency: "COP",
  budget: "",
  travelers: "2",
  planType: "",
  startDate: "",
  endDate: "",
  days: "4",
  hasPassport: null,
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

export function validateAbout(f: FormState, t: { required: string; invalidEmail: string; invalidPhone: string; mustConsent: string }): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = t.required;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = t.invalidEmail;
  if (!/^\+?[0-9 ]{7,20}$/.test(f.whatsapp.trim()) || f.whatsapp.replace(/\D/g, "").length < 7) e.whatsapp = t.invalidPhone;
  if (!f.consent) e.consent = t.mustConsent;
  return e;
}

export function validateTrip(f: FormState, t: { required: string; invalidDates: string }): Errors {
  const e: Errors = {};
  if (f.mode === "known" && f.destination.trim().length < 2) e.destination = t.required;
  if (f.mode === "suggest" && f.origin.trim().length < 2) e.origin = t.required;
  if (!(parseAmount(f.budget) > 0)) e.budget = t.required;
  const n = Number(f.travelers);
  if (!Number.isInteger(n) || n < 1 || n > 20) e.travelers = t.required;
  if (!f.planType) e.planType = t.required;
  if (f.startDate && f.endDate && !daysBetween(f.startDate, f.endDate)) e.endDate = t.invalidDates;
  const d = Number(f.days);
  if (!daysBetween(f.startDate, f.endDate) && (!Number.isInteger(d) || d < 1 || d > 30)) e.days = t.required;
  if (f.mode === "suggest" && f.hasPassport === null) e.hasPassport = t.required;
  if (f.mode === "known" && f.hasFlights === null) e.hasFlights = t.required;
  if (f.mode === "known" && f.hasLodging === null) e.hasLodging = t.required;
  return e;
}

export function toRequest(f: FormState, lang: Lang): PlanRequest {
  const auto = daysBetween(f.startDate, f.endDate);
  const common = {
    lang,
    name: f.name.trim(),
    email: f.email.trim(),
    whatsapp: f.whatsapp.trim(),
    consent: true as const,
    consentVersion: CONSENT_VERSION,
    currency: f.currency,
    budgetPerPerson: parseAmount(f.budget),
    travelers: Number(f.travelers),
    planType: f.planType as PlanType,
    startDate: f.startDate || null,
    endDate: f.endDate || null,
    days: Math.min(auto ?? Number(f.days), 30),
  };
  return f.mode === "suggest"
    ? { mode: "suggest", ...common, origin: f.origin.trim(), hasPassport: !!f.hasPassport, visas: f.hasPassport ? f.visas : [] }
    : { mode: "known", ...common, destination: f.destination.trim(), hasFlights: !!f.hasFlights, hasLodging: !!f.hasLodging };
}

export function money(n: number, currency: Currency, lang: Lang) {
  return new Intl.NumberFormat(lang === "es" ? "es-CO" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}
