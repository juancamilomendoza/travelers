import { useState, type FormEvent } from "react";
import { planLabels, visaLabels, type dict } from "../i18n";
import { daysBetween, validateTrip, type Errors, type FormState } from "../form";
import { CURRENCIES, PLAN_TYPES, VISAS, type Lang, type PlanType } from "../shared/constants";
import { Chip, Field, YesNo } from "./ui";
import PlaceInput from "./PlaceInput";
import { DESTINATIONS, ORIGIN_CITIES } from "../places";

type Props = {
  t: (typeof dict)["es"];
  lang: Lang;
  form: FormState;
  set: (patch: Partial<FormState>) => void;
  onBack: () => void;
  onSubmit: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function StepTrip({ t, lang, form, set, onBack, onSubmit }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const autoDays = daysBetween(form.startDate, form.endDate);

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateTrip(form, t);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit();
  }

  const formatBudget = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    return digits ? Number(digits).toLocaleString(lang === "es" ? "es-CO" : "en-US") : "";
  };

  return (
    <form onSubmit={submit} noValidate className="card space-y-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.s2Title}</h1>

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
        {(["suggest", "known"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={form.mode === m}
            onClick={() => set({ mode: m })}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              form.mode === m
                ? "border-brand-600 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/30"
                : "border-stone-200 hover:border-stone-300 dark:border-stone-800 dark:hover:border-stone-700"
            }`}
          >
            <span className="block text-lg">{m === "suggest" ? "🧭" : "📍"}</span>
            <span className="mt-1 block font-semibold">{m === "suggest" ? t.modeSuggest : t.modeKnown}</span>
            <span className="mt-0.5 block text-sm text-stone-600 dark:text-stone-400">{m === "suggest" ? t.modeSuggestHint : t.modeKnownHint}</span>
          </button>
        ))}
      </div>

      {form.mode === "known" ? (
        <Field label={t.destination} error={errors.destination} htmlFor="destination">
          <PlaceInput id="destination" options={DESTINATIONS} placeholder={t.destinationPh} value={form.destination} onChange={(v) => set({ destination: v })} />
        </Field>
      ) : (
        <Field label={t.origin} error={errors.origin} htmlFor="origin">
          <PlaceInput id="origin" options={ORIGIN_CITIES} value={form.origin} onChange={(v) => set({ origin: v })} />
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
        <Field label={t.currency} htmlFor="currency">
          <select id="currency" className="input" value={form.currency} onChange={(e) => set({ currency: e.target.value as FormState["currency"] })}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={form.mode === "known" ? t.budgetKnown : t.budgetSuggest} error={errors.budget} htmlFor="budget">
          <input
            id="budget"
            className="input"
            inputMode="numeric"
            placeholder={form.currency === "COP" ? "2.000.000" : "800"}
            value={formatBudget(form.budget)}
            onChange={(e) => set({ budget: e.target.value.replace(/[^\d]/g, "") })}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.travelers} error={errors.travelers} htmlFor="travelers">
          <input id="travelers" className="input" type="number" min={1} max={20} value={form.travelers} onChange={(e) => set({ travelers: e.target.value })} />
        </Field>
        <Field label={t.planType} error={errors.planType} htmlFor="planType">
          <select id="planType" className="input" value={form.planType} onChange={(e) => set({ planType: e.target.value as PlanType })}>
            <option value="" disabled>
              —
            </option>
            {PLAN_TYPES.map((p) => (
              <option key={p} value={p}>
                {planLabels[lang][p]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="label">{t.dates}</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="startDate" className="mb-1 block text-xs text-stone-500 dark:text-stone-400">
              {t.from}
            </label>
            <input id="startDate" type="date" className="input" min={today()} value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1 block text-xs text-stone-500 dark:text-stone-400">
              {t.to}
            </label>
            <input id="endDate" type="date" className="input" min={form.startDate || today()} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
          </div>
        </div>
        {errors.endDate && <p className="error">{errors.endDate}</p>}
        {autoDays ? (
          <p className="mt-2 text-sm text-brand-700 dark:text-brand-500">{t.daysAuto(autoDays)}</p>
        ) : (
          <div className="mt-4">
            <Field label={t.days} error={errors.days} htmlFor="days">
              <input id="days" className="input sm:w-40" type="number" min={1} max={30} value={form.days} onChange={(e) => set({ days: e.target.value })} />
            </Field>
          </div>
        )}
      </fieldset>

      {form.mode === "suggest" ? (
        <>
          <YesNo label={t.passport} value={form.hasPassport} onChange={(v) => set({ hasPassport: v })} yes={t.yes} no={t.no} error={errors.hasPassport} />
          {form.hasPassport && (
            <fieldset>
              <legend className="label">{t.visas}</legend>
              <div className="flex flex-wrap gap-2">
                {VISAS.map((v) => (
                  <Chip
                    key={v}
                    active={form.visas.includes(v)}
                    onClick={() => set({ visas: form.visas.includes(v) ? form.visas.filter((x) => x !== v) : [...form.visas, v] })}
                  >
                    {visaLabels[lang][v]}
                  </Chip>
                ))}
              </div>
            </fieldset>
          )}
        </>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <YesNo label={t.hasFlights} value={form.hasFlights} onChange={(v) => set({ hasFlights: v })} yes={t.yes} no={t.no} error={errors.hasFlights} />
          <YesNo label={t.hasLodging} value={form.hasLodging} onChange={(v) => set({ hasLodging: v })} yes={t.yes} no={t.no} error={errors.hasLodging} />
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <button type="button" className="btn-ghost" onClick={onBack}>
          ← {t.back}
        </button>
        <button type="submit" className="btn-primary">
          {t.submit} →
        </button>
      </div>
    </form>
  );
}
