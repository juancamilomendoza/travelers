import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { Config } from "@netlify/functions";
import {
  KnownResult,
  LocalResult,
  PlanRequest,
  SuggestResult,
  type KnownView,
  type LocalView,
  type PlanResponse,
} from "../../src/shared/schema.ts";
import { findPlace, placesEnabled } from "../lib/places.mts";

// Google Maps lookups per answer in "known" mode (restaurants), to keep the cost per search bounded.
const MAX_RESTAURANT_LOOKUPS = 6;

// Cheapest Claude model, chosen by the project owner to keep the cost per search low.
const MODEL = "claude-haiku-5-5";
const CACHE_DAYS = 7;

const SYSTEM = `You are the trip planner of Pa Donde Vamos, a web app for travelers from anywhere in the world.
You receive one trip request as JSON and answer with realistic, concrete suggestions.

Rules:
- The group is "adults" adults plus one child per entry in "childrenAges" (each number is that child's age in years; 0 = under one year old).
- All costs are estimates in the request's currency ("currency") and are TOTALS for the whole group for the whole trip ("days" days), unless a field says otherwise.
- budgetTotal is the total budget for the whole group and the whole trip. Every suggestion's total must fit inside it.
- If nothing reasonable fits, set budgetTooLow to true, give minimumBudget (the minimum total for the whole group, in the request currency) and still return your cheapest realistic option. Otherwise budgetTooLow is false and minimumBudget is 0.
- Fit the suggestions to planType (e.g. bachelor/bachelorette: nightlife and group plans; family: kid-friendly, little travel; proposal/honeymoon/couple: romantic places; rest: calm and nature; first_trip: easy, safe, well connected places).
- When there are children, every activity, lodging and restaurant must suit their ages: no nightlife-only plans, no activities with age or height limits they don't meet, family rooms or apartments, short transfers for babies and toddlers. Price children realistically: babies under 2 usually fly on a lap for a small fee and stay free; many tickets are reduced for children.
- If startDate is given, consider the season (high/low, weather) for those dates.
- Use real, well-known place names, written exactly as the business is listed on Google Maps. Never invent a place. Do not invent prices that are wildly off; when unsure, round to a typical value.
- The group leaves from "origin" (a city). Infer the origin country from the city. "nationalities" lists every nationality in the group (one or more).
- requirements: short text on passport/visa/entry needs. If the group has several nationalities and the needs differ, say what each nationality needs (one short clause each). Mention documents for minors when there are children (e.g. birth certificate, travel permit if a parent is not traveling). End with a reminder to verify them before buying. For a destination inside the origin country, say whether a passport is needed for each nationality (mention any local entry card, such as San Andres's tourist card in Colombia).
- Write every text field in the language given by "lang" ("es" = Spanish, "en" = English). Keep each text short (one sentence).

Mode "suggest" (the traveler wants destination ideas):
- Return exactly 3 destinations, from cheapest to most expensive total.
- Every destination must be one that EVERY nationality in the group can enter. When in doubt for any one of them, pick another destination.
- passport "none" (nobody has a passport) or "some" (not everyone has one): only destinations inside the origin country, or countries that every nationality in the group can enter with a national ID card (e.g. Andean Community, Mercosur, EU/Schengen). With "some", say in requirements that whoever lacks a passport should get one to open more options.
- passport "all": at least one international destination unless the budget truly cannot reach one; only countries every nationality can enter without a visa, with an eVisa/ETA, or with one of the visas listed in "visas" (visas that every traveler holds).
- Do not default to Colombia: pick destinations that make sense from the origin city and fit the budget.
- transport includes the round trip from "origin" plus local transport.
- activities: 3 to 5 items. food.places: 1 or 2 typical places or dishes.

Mode "known" (the traveler already chose "destination"):
- Return a day-by-day itinerary with one entry per day (max "days" entries), each with 1 to 3 activities and 1 or 2 restaurants (priceLevel is "$", "$$" or "$$$").
- lodging: null if hasLodging is true; otherwise suggest lodging.
- transportToDestination: null if hasFlights is true; otherwise estimate the round trip from "origin".
- budgetTotal is what the whole group wants to spend AT the destination (plus lodging/transport to it only if they don't have them).
- tips: 2 or 3 short practical tips.

Mode "local" (the group wants a plan in the city where they already are, "city"):
- There is no trip: ignore travel, passports and requirements. "today" is today's date; "when" is "today", "weekend" (the coming weekend) or "date" (use "date").
- Return 4 or 5 real, currently well-known places in or near "city" that match "interests" (food, nightlife, culture, outdoors, kids = family plan, romantic, celebration). Mix the interests when there are several.
- Each place: name (the exact Google Maps name); kind (a short label such as "Restaurante" or "Mirador", in "lang"); area (the neighborhood, as specific as you know it; never a street address); why (one sentence); priceLevel ("$", "$$" or "$$$"); cost = estimated total for the whole group (food, drinks, tickets, local transport).
- Each place's cost must fit budgetTotal. If nothing fits, set budgetTooLow and minimumBudget as above.
- With children: only places that welcome them at those ages; no bars or nightclubs.
- tips: 2 or 3 short tips (booking, best time to go, safety, transport).`;

function json(body: PlanResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Everything that shapes the AI answer, without personal data. Used for the cache and sent to the AI. */
function tripOnly(r: PlanRequest) {
  const group = {
    mode: r.mode,
    lang: r.lang,
    currency: r.currency,
    budgetTotal: r.budgetTotal,
    adults: r.adults,
    childrenAges: [...r.childrenAges].sort((a, b) => a - b),
  };
  if (r.mode === "local") {
    // "today" makes "today" and "weekend" concrete; it also keeps cached answers to one day.
    const today = new Date().toISOString().slice(0, 10);
    return { ...group, city: r.city, interests: [...r.interests].sort(), when: r.when, date: r.date, today };
  }
  const base = {
    ...group,
    planType: r.planType,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    origin: r.origin,
    nationalities: [...r.nationalities].sort(),
  };
  return r.mode === "suggest"
    ? { ...base, passport: r.passport, visas: [...r.visas].sort() }
    : { ...base, destination: r.destination, hasFlights: r.hasFlights, hasLodging: r.hasLodging };
}

/**
 * Adds real address, photo and contacts from Google Maps. In "local" mode, places Google cannot find are
 * dropped (they are likely made up), unless none is found at all. Not stored: Google's terms forbid it.
 */
async function withPlaces(r: PlanRequest, result: unknown): Promise<unknown> {
  if (!placesEnabled()) return result;
  if (r.mode === "local") {
    const res = result as LocalResult;
    const found = await Promise.all(res.places.map((p) => findPlace(`${p.name}, ${p.area}, ${r.city}`, r.lang)));
    const places = res.places.map((p, i) => ({ ...p, info: found[i] ?? undefined }));
    const real = places.filter((p) => p.info);
    return { ...res, places: real.length ? real : places } satisfies LocalView;
  }
  if (r.mode === "known") {
    const res = result as KnownResult;
    const names = [...new Set(res.itinerary.flatMap((d) => d.restaurants.map((x) => x.name)))].slice(0, MAX_RESTAURANT_LOOKUPS);
    const found = new Map(await Promise.all(names.map(async (n) => [n, await findPlace(`${n}, ${r.destination}`, r.lang)] as const)));
    return {
      ...res,
      itinerary: res.itinerary.map((d) => ({ ...d, restaurants: d.restaurants.map((x) => ({ ...x, info: found.get(x.name) ?? undefined })) })),
    } satisfies KnownView;
  }
  return result;
}

async function toCop(amount: number, currency: string): Promise<number | null> {
  if (currency === "COP") return amount;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`, {
      signal: AbortSignal.timeout(2500),
    });
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.COP;
    return rate ? Math.round(amount * rate) : null;
  } catch {
    return null;
  }
}

async function askClaude(r: PlanRequest) {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const schema = r.mode === "suggest" ? SuggestResult : r.mode === "known" ? KnownResult : LocalResult;
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    messages: [{ role: "user", content: JSON.stringify(tripOnly(r)) }],
  });
  if (response.stop_reason !== "end_turn" || !response.parsed_output) {
    console.error("Claude did not finish", response.stop_reason, response.usage);
    return null;
  }
  console.log("usage", response.usage);
  return response.parsed_output;
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const parsed = PlanRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: "invalid" }, 400);
  const r = parsed.data;

  const db = supabase();
  const trip = tripOnly(r);
  const travelers = r.adults + r.childrenAges.length;
  const budgetTotalCop = await toCop(r.budgetTotal, r.currency);
  const perPerson = (n: number | null) => (n === null ? null : Math.round(n / travelers));
  const cacheKey = createHash("sha256").update(JSON.stringify(trip)).digest("hex");

  // 1. Save the lead first, so it is kept even if the AI step fails or the user leaves.
  let leadId: string | null = null;
  if (db) {
    const { data, error } = await db
      .from("leads")
      .insert({
        mode: r.mode,
        lang: r.lang,
        name: r.name,
        email: r.email,
        whatsapp: r.whatsapp,
        consent_version: r.consent ? r.consentVersion : null,
        consent_at: r.consent ? new Date().toISOString() : null,
        currency: r.currency,
        budget_total: r.budgetTotal,
        budget_total_cop: budgetTotalCop,
        // Per-person columns are kept, derived from the total, so older reports still work.
        budget_per_person: perPerson(r.budgetTotal),
        budget_per_person_cop: perPerson(budgetTotalCop),
        travelers,
        adults: r.adults,
        children_ages: r.childrenAges,
        ...(r.mode === "local"
          ? {
              plan_type: null,
              start_date: r.date,
              end_date: r.date,
              days: 1,
              origin: r.city,
              destination: r.city,
              interests: r.interests,
              local_when: r.when,
            }
          : {
              plan_type: r.planType,
              start_date: r.startDate,
              end_date: r.endDate,
              days: r.days,
              origin: r.origin,
              nationalities: r.nationalities,
              nationality: r.nationalities.join(", "),
            }),
        passport_status: r.mode === "suggest" ? r.passport : null,
        has_passport: r.mode === "suggest" ? r.passport === "all" : null,
        visas: r.mode === "suggest" ? r.visas : null,
        ...(r.mode === "known" ? { destination: r.destination } : {}),
        has_flights: r.mode === "known" ? r.hasFlights : null,
        has_lodging: r.mode === "known" ? r.hasLodging : null,
      })
      .select("id")
      .single();
    if (error) console.error("lead insert failed", error);
    leadId = data?.id ?? null;
  } else {
    console.warn("Supabase is not configured: the lead was not saved");
  }

  // 2. Reuse a recent identical answer instead of paying for it again.
  let result: unknown = null;
  if (db) {
    const since = new Date(Date.now() - CACHE_DAYS * 864e5).toISOString();
    const { data } = await db
      .from("plan_cache")
      .select("result")
      .eq("key", cacheKey)
      .gte("created_at", since)
      .maybeSingle();
    result = data?.result ?? null;
  }

  // 3. Otherwise ask Claude.
  if (!result) {
    if (!process.env.ANTHROPIC_API_KEY) return json({ ok: false, error: "ai_unavailable" }, 503);
    try {
      result = await askClaude(r);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.InternalServerError) {
        console.error("Claude busy", err.status);
      } else if (err instanceof Anthropic.APIError) {
        console.error("Claude API error", err.status, err.message);
      } else {
        console.error("Claude call failed", err);
      }
      return json({ ok: false, error: "ai_unavailable" }, 503);
    }
    if (!result) return json({ ok: false, error: "ai_unavailable" }, 503);
    if (db) await db.from("plan_cache").upsert({ key: cacheKey, mode: r.mode, result, created_at: new Date().toISOString() });
  }

  if (db && leadId) await db.from("leads").update({ result }).eq("id", leadId);

  // The "contact me" button only makes sense when there is a way to reach the person.
  if (!r.email && !r.whatsapp) leadId = null;

  const view = await withPlaces(r, result);
  if (r.mode === "suggest") return json({ ok: true, mode: "suggest", leadId, result: view as SuggestResult });
  if (r.mode === "known") return json({ ok: true, mode: "known", leadId, result: view as KnownView });
  return json({ ok: true, mode: "local", leadId, result: view as LocalView });
};

export const config: Config = { path: "/api/plan" };
