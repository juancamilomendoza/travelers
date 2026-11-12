import { z } from "zod";

import { CURRENCIES, LANGS, PLAN_TYPES, VISAS } from "./constants";

export * from "./constants";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const common = {
  lang: z.enum(LANGS),
  // Contact data is optional: people can get a plan without leaving it.
  name: z.string().trim().min(2).max(80).nullable(),
  email: z.string().trim().email().max(120).nullable(),
  whatsapp: z.string().trim().regex(/^\+?[0-9 ]{7,20}$/).nullable(),
  consent: z.boolean(),
  consentVersion: z.string().max(20).nullable(),
  currency: z.enum(CURRENCIES),
  budgetPerPerson: z.number().positive().max(1_000_000_000),
  travelers: z.number().int().min(1).max(20),
  planType: z.enum(PLAN_TYPES),
  startDate: isoDate.nullable(),
  endDate: isoDate.nullable(),
  days: z.number().int().min(1).max(30),
  origin: z.string().trim().min(2).max(80),
  nationality: z.string().trim().min(2).max(60),
};

export const SuggestRequest = z.object({
  mode: z.literal("suggest"),
  ...common,
  hasPassport: z.boolean(),
  visas: z.array(z.enum(VISAS)).max(VISAS.length),
});

export const KnownRequest = z.object({
  mode: z.literal("known"),
  ...common,
  destination: z.string().trim().min(2).max(80),
  hasFlights: z.boolean(),
  hasLodging: z.boolean(),
});

export const PlanRequest = z
  .discriminatedUnion("mode", [SuggestRequest, KnownRequest])
  .refine((r) => !r.startDate || !r.endDate || r.endDate >= r.startDate, {
    message: "endDate must be on or after startDate",
  })
  // Anyone who leaves personal data must accept the data processing authorization (Ley 1581).
  .refine((r) => r.consent || (!r.name && !r.email && !r.whatsapp), {
    message: "consent is required when contact data is given",
  });

export type PlanRequest = z.infer<typeof PlanRequest>;

// ---------- What the AI returns ----------

const costItem = z.object({ name: z.string(), cost: z.number() });
const costBlock = z.object({ description: z.string(), cost: z.number() });

export const SuggestResult = z.object({
  budgetTooLow: z.boolean(),
  minimumBudgetPerPerson: z.number(),
  destinations: z.array(
    z.object({
      city: z.string(),
      country: z.string(),
      why: z.string(),
      lodging: costBlock,
      activities: z.array(costItem),
      transport: costBlock,
      food: z.object({ description: z.string(), places: z.array(z.string()), cost: z.number() }),
      total: z.number(),
      requirements: z.string(),
    }),
  ),
});

export const KnownResult = z.object({
  budgetTooLow: z.boolean(),
  minimumBudgetPerPerson: z.number(),
  destination: z.string(),
  itinerary: z.array(
    z.object({
      day: z.number().int(),
      title: z.string(),
      activities: z.array(costItem),
      restaurants: z.array(z.object({ name: z.string(), priceLevel: z.string(), cost: z.number() })),
    }),
  ),
  localTransport: costBlock,
  lodging: costBlock.nullable(),
  transportToDestination: costBlock.nullable(),
  total: z.number(),
  tips: z.array(z.string()),
  requirements: z.string(),
});

export type SuggestResult = z.infer<typeof SuggestResult>;
export type KnownResult = z.infer<typeof KnownResult>;

export type PlanResponse =
  | { ok: true; mode: "suggest"; leadId: string | null; result: SuggestResult }
  | { ok: true; mode: "known"; leadId: string | null; result: KnownResult }
  | { ok: false; error: "invalid" | "ai_unavailable" | "server" };
