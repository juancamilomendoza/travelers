import { useState } from "react";
import type { dict } from "../i18n";
import { money } from "../form";
import type { Currency, KnownResult, Lang, SuggestResult } from "../shared/schema";

type T = (typeof dict)["es"];
type Common = { t: T; lang: Lang; currency: Currency; budgetTotal: number };

function Row({ icon, label, cost, fmt, children }: { icon: string; label: string; cost: number; fmt: (n: number) => string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-stone-100 py-3 first:border-t-0 dark:border-stone-800">
      <span className="text-xl" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-semibold">{label}</p>
          <p className="shrink-0 font-semibold tabular-nums">{fmt(cost)}</p>
        </div>
        <div className="mt-0.5 text-sm text-stone-600 dark:text-stone-400">{children}</div>
      </div>
    </div>
  );
}

function Totals({ t, total, budgetTotal, fmt }: { t: T; total: number; budgetTotal: number; fmt: (n: number) => string }) {
  const left = budgetTotal - total;
  return (
    <div className="mt-2 rounded-xl bg-stone-100 p-4 dark:bg-stone-800/60">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">{t.total}</span>
        <span className="text-xl font-bold tabular-nums">{fmt(total)}</span>
      </div>
      <p className={`mt-1 text-right text-sm font-medium ${left >= 0 ? "text-brand-700 dark:text-brand-500" : "text-amber-700 dark:text-amber-400"}`}>
        {left >= 0 ? t.leftover : t.over} {fmt(Math.abs(left))}
      </p>
    </div>
  );
}

function Requirements({ t, text }: { t: T; text: string }) {
  return (
    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
      <span className="font-semibold">🛂 {t.requirements}: </span>
      {text}
    </p>
  );
}

function TooLow({ t, min, fmt }: { t: T; min: number; fmt: (n: number) => string }) {
  return (
    <p className="card border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{t.tooLow(fmt(min))}</p>
  );
}

export function SuggestView({ t, lang, currency, budgetTotal, result }: Common & { result: SuggestResult }) {
  const fmt = (n: number) => money(n, currency, lang);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.s3Suggest}</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t.estimated}</p>
      </header>
      {result.budgetTooLow && <TooLow t={t} min={result.minimumBudget} fmt={fmt} />}
      {result.destinations.map((d, i) => (
        <article key={i} className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-500">#{i + 1}</p>
          <h2 className="text-xl font-bold">
            {d.city}, <span className="font-medium text-stone-500 dark:text-stone-400">{d.country}</span>
          </h2>
          <p className="mt-1 text-stone-600 dark:text-stone-400">{d.why}</p>
          <div className="mt-4">
            <Row icon="🏨" label={t.lodging} cost={d.lodging.cost} fmt={fmt}>
              {d.lodging.description}
            </Row>
            <Row icon="🎟️" label={t.activities} cost={d.activities.reduce((s, a) => s + a.cost, 0)} fmt={fmt}>
              <ul className="space-y-0.5">
                {d.activities.map((a, j) => (
                  <li key={j} className="flex justify-between gap-3">
                    <span>{a.name}</span>
                    <span className="shrink-0 tabular-nums">{fmt(a.cost)}</span>
                  </li>
                ))}
              </ul>
            </Row>
            <Row icon="✈️" label={t.transport} cost={d.transport.cost} fmt={fmt}>
              {d.transport.description}
            </Row>
            <Row icon="🍽️" label={t.food} cost={d.food.cost} fmt={fmt}>
              {d.food.description}
              {d.food.places.length > 0 && <span className="block">{d.food.places.join(" · ")}</span>}
            </Row>
          </div>
          <Totals t={t} total={d.total} budgetTotal={budgetTotal} fmt={fmt} />
          <Requirements t={t} text={d.requirements} />
        </article>
      ))}
    </div>
  );
}

export function KnownView({ t, lang, currency, budgetTotal, result }: Common & { result: KnownResult }) {
  const fmt = (n: number) => money(n, currency, lang);
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.s3Known(result.destination)}</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{t.estimated}</p>
      </header>
      {result.budgetTooLow && <TooLow t={t} min={result.minimumBudget} fmt={fmt} />}

      <ol className="space-y-4">
        {result.itinerary.map((d) => (
          <li key={d.day} className="card">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-500">{t.day(d.day)}</p>
            <h2 className="text-lg font-bold">{d.title}</h2>
            <ul className="mt-3 space-y-1.5">
              {d.activities.map((a, j) => (
                <li key={j} className="flex justify-between gap-3">
                  <span>🎟️ {a.name}</span>
                  <span className="shrink-0 tabular-nums text-stone-600 dark:text-stone-400">{fmt(a.cost)}</span>
                </li>
              ))}
            </ul>
            {d.restaurants.length > 0 && (
              <>
                <p className="mt-3 text-sm font-semibold text-stone-500 dark:text-stone-400">{t.restaurants}</p>
                <ul className="mt-1 space-y-1.5">
                  {d.restaurants.map((r, j) => (
                    <li key={j} className="flex justify-between gap-3">
                      <span>
                        🍽️ {r.name} <span className="text-stone-400">{r.priceLevel}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-stone-600 dark:text-stone-400">{fmt(r.cost)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="card">
        <Row icon="🛺" label={t.localTransport} cost={result.localTransport.cost} fmt={fmt}>
          {result.localTransport.description}
        </Row>
        {result.lodging && (
          <Row icon="🏨" label={t.lodging} cost={result.lodging.cost} fmt={fmt}>
            {result.lodging.description}
          </Row>
        )}
        {result.transportToDestination && (
          <Row icon="✈️" label={t.toDestination} cost={result.transportToDestination.cost} fmt={fmt}>
            {result.transportToDestination.description}
          </Row>
        )}
        <Totals t={t} total={result.total} budgetTotal={budgetTotal} fmt={fmt} />
        <Requirements t={t} text={result.requirements} />
        {result.tips.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold">💡 {t.tips}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-stone-600 dark:text-stone-400">
              {result.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function AgencyCta({ t, leadId }: { t: T; leadId: string | null }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  if (!leadId) return null;
  async function send() {
    setState("sending");
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ leadId }) }).catch(() => null);
    setState(res?.ok ? "done" : "idle");
  }
  return (
    <div className="card flex flex-col items-start gap-3 border-brand-200 bg-brand-50 sm:flex-row sm:items-center sm:justify-between dark:border-brand-900 dark:bg-brand-900/20">
      <p className="font-medium">{state === "done" ? t.agencyDone : t.agencyCta}</p>
      {state !== "done" && (
        <button className="btn-primary shrink-0" disabled={state === "sending"} onClick={send}>
          {t.agencyBtn}
        </button>
      )}
    </div>
  );
}
