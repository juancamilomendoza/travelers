import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { Config } from "@netlify/functions";
import {
  KnownResult,
  PlanRequest,
  SuggestResult,
  type PlanResponse,
} from "../../src/shared/schema.ts";

// Cheapest Claude model, chosen by the project owner to keep the cost per search low.
const MODEL = "claude-haiku-5-5";
const CACHE_DAYS = 7;

const SYSTEM = `You are the trip planner of Pa Donde Vamos, a web app for travelers who start in Colombia.
You receive one trip request as JSON and answer with realistic, concrete suggestions.

Rules:
- All costs are estimates in the request's currency ("currency") and are TOTALS for the whole group ("travelers" people) for the whole trip ("days" days), unless a field says otherwise.
- The total budget is budgetPerPerson x travelers. Every suggestion's total must fit inside it.
- If nothing reasonable fits, set budgetTooLow to true, give minimumBudgetPerPerson (in the request currency) and still return your cheapest realistic option. Otherwise budgetTooLow is false and minimumBudgetPerPerson is 0.
- Fit the suggestions to planType (e.g. bachelor/bachelorette: nightlife and group plans; family: kid-friendly, little travel; proposal/honeymoon/couple: romantic places; rest: calm and nature; first_trip: easy, safe, well connected places).
- If startDate is given, consider the season (high/low, weather) for those dates.
- Use real, well-known place names. Do not invent prices that are wildly off; when unsure, round to a typical value.
- requirements: one short sentence on passport/visa/entry needs for a Colombian citizen, ending with a reminder to verify them before buying. For domestic Colombian destinations say no passport is needed (mention any local entry card, such as San Andres's tourist card).
- Write every text field in the language given by "lang" ("es" = Spanish, "en" = English). Keep each text short (one sentence).

Mode "suggest" (the traveler wants destination ideas):
- Return exactly 3 destinations, from cheapest to most expensive total.
- Without passport (hasPassport false): only destinations inside Colombia.
- With passport: mix domestic and international destinations that a Colombian can enter without a visa, or with one of the visas listed in "visas".
- transport includes the round trip from "origin" plus local transport.
- activities: 3 to 5 items. food.places: 1 or 2 typical places or dishes.

Mode "known" (the traveler already chose "destination"):
- Return a day-by-day itinerary with one entry per day (max "days" entries), each with 1 to 3 activities and 1 or 2 restaurants (priceLevel is "$", "$$" or "$$$").
- lodging: null if hasLodging is true; otherwise suggest lodging.
- transportToDestination: null if hasFlights is true; otherwise estimate the round trip from Bogota.
- budgetPerPerson is what each person wants to spend AT the destination (plus lodging/transport to it only if they don't have them).
- tips: 2 or 3 short practical tips.`;

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
  const base = {
    mode: r.mode,
    lang: r.lang,
    currency: r.currency,
    budgetPerPerson: r.budgetPerPerson,
    travelers: r.travelers,
    planType: r.planType,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
  };
  return r.mode === "suggest"
    ? { ...base, origin: r.origin, hasPassport: r.hasPassport, visas: [...r.visas].sort() }
    : { ...base, destination: r.destination, hasFlights: r.hasFlights, hasLodging: r.hasLodging };
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
  const schema = r.mode === "suggest" ? SuggestResult : KnownResult;
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
        consent_version: r.consentVersion,
        consent_at: new Date().toISOString(),
        currency: r.currency,
        budget_per_person: r.budgetPerPerson,
        budget_per_person_cop: await toCop(r.budgetPerPerson, r.currency),
        travelers: r.travelers,
        plan_type: r.planType,
        start_date: r.startDate,
        end_date: r.endDate,
        days: r.days,
        origin: r.mode === "suggest" ? r.origin : null,
        has_passport: r.mode === "suggest" ? r.hasPassport : null,
        visas: r.mode === "suggest" ? r.visas : null,
        destination: r.mode === "known" ? r.destination : null,
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

  return r.mode === "suggest"
    ? json({ ok: true, mode: "suggest", leadId, result: result as SuggestResult })
    : json({ ok: true, mode: "known", leadId, result: result as KnownResult });
};

export const config: Config = { path: "/api/plan" };
