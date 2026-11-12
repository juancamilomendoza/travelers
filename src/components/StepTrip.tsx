import { useState, type FormEvent } from "react";
import { planLabels, visaLabels, type dict } from "../i18n";
import { daysBetween, validateTrip, type Errors, type FormState } from "../form";
import { CURRENCIES, INTERESTS, WHEN, MAX_CHILDREN, MAX_TRAVELERS, PASSPORT, PLAN_TYPES, VISAS, type Lang, type PlanType } from "../shared/constants";
import { Chip, Choice, Counter, Field, YesNo } from "./ui";
import NationalityPicker from "./NationalityPicker";
import { currentCity } from "../geo";
import PlaceInput from "./PlaceInput";
import { COUNTRIES, DESTINATIONS, ORIGIN_CITIES } from "../places";

type Props = {
  t: (typeof dict)["es"];
  lang: Lang;
  form: FormState;
  set: (patch: Partial<FormState>) => void;
  onBack: () => void;
  onSubmit: () => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function StepTrip({ t, lang, form, set: setForm, onBack, onSubmit }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const [locating, setLocating] = useState<"idle" | "busy" | "failed">("idle");
  const local = form.mode === "local";
  // Editing a field clears its error message, so fixed fields stop showing red.
  const set = (patch: Partial<FormState>) => {
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch))));
    setForm(patch);
  };
  const autoDays = daysBetween(form.startDate, form.endDate);
  const kids = form.childrenAges.length;
  const room = MAX_TRAVELERS - form.adults - kids;

  async function locate() {
    setLocating("busy");
    const city = await currentCity(lang);
    if (city) set({ city });
    setLocating(city ? "idle" : "failed");
  }

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
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{local ? t.s2TitleLocal : t.s2Title}</h1>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup">
        {(["suggest", "known", "local"] as const).map((m) => (
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
            <span className="block text-lg">{{ suggest: "🧭", known: "📍", local: "🍽️" }[m]}</span>
            <span className="mt-1 block font-semibold">{{ suggest: t.modeSuggest, known: t.modeKnown, local: t.modeLocal }[m]}</span>
            <span className="mt-0.5 block text-sm text-stone-600 dark:text-stone-400">
              {{ suggest: t.modeSuggestHint, known: t.modeKnownHint, local: t.modeLocalHint }[m]}
            </span>
          </button>
        ))}
      </div>

      {form.mode === "known" && (
        <Field label={t.destination} error={errors.destination} htmlFor="destination">
          <PlaceInput id="destination" options={DESTINATIONS} placeholder={t.destinationPh} value={form.destination} onChange={(v) => set({ destination: v })} />
        </Field>
      )}

      {local && (
        <>
          <Field label={t.city} error={errors.city} hint={locating === "failed" ? t.locationFailed : undefined} htmlFor="city">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <PlaceInput id="city" options={ORIGIN_CITIES} placeholder={t.cityPh} value={form.city} onChange={(v) => set({ city: v })} />
              </div>
              <button type="button" className="btn-ghost shrink-0 border border-stone-300 dark:border-stone-700" disabled={locating === "busy"} onClick={locate}>
                {locating === "busy" ? t.locating : t.useLocation}
              </button>
            </div>
          </Field>
          <fieldset>
            <legend className="label">{t.interests}</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <Chip
                  key={i}
                  active={form.interests.includes(i)}
                  onClick={() => set({ interests: form.interests.includes(i) ? form.interests.filter((x) => x !== i) : [...form.interests, i] })}
                >
                  {t.interestLabels[i]}
                </Chip>
              ))}
            </div>
            {errors.interests && <p className="error">{errors.interests}</p>}
          </fieldset>
        </>
      )}

      {!local && (
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.nationalities} error={errors.nationalities} htmlFor="nationalities">
          <NationalityPicker
            id="nationalities"
            options={COUNTRIES[lang]}
            placeholder={form.nationalities.length ? t.nationalityMorePh : t.nationalityPh}
            hint={t.nationalitiesHint}
            removeLabel={t.remove}
            value={form.nationalities}
            onChange={(v) => set({ nationalities: v })}
          />
        </Field>
        <Field label={t.origin} error={errors.origin} htmlFor="origin">
          <PlaceInput id="origin" options={ORIGIN_CITIES} placeholder={t.originPh} value={form.origin} onChange={(v) => set({ origin: v })} />
        </Field>
      </div>
      )}

      <fieldset>
        <legend className="label">{t.group}</legend>
        <div className="divide-y divide-stone-200 rounded-2xl border border-stone-200 px-4 dark:divide-stone-800 dark:border-stone-800">
          <Counter
            id="adults"
            label={t.adults}
            hint={t.adultsHint}
            value={form.adults}
            min={1}
            max={form.adults + room}
            onChange={(v) => set({ adults: v })}
            decLabel={t.less}
            incLabel={t.more}
          />
          <Counter
            id="children"
            label={t.children}
            hint={t.childrenHint}
            value={kids}
            min={0}
            max={Math.min(MAX_CHILDREN, kids + room)}
            onChange={(v) => set({ childrenAges: v > kids ? [...form.childrenAges, null] : form.childrenAges.slice(0, v) })}
            decLabel={t.less}
            incLabel={t.more}
          />
          {kids > 0 && (
            <div className="grid grid-cols-2 gap-3 py-3 sm:grid-cols-3">
              {form.childrenAges.map((age, i) => (
                <div key={i}>
                  <label htmlFor={`child-${i}`} className="mb-1 block text-xs text-stone-500 dark:text-stone-400">
                    {t.childN(i + 1)}
                  </label>
                  <select
                    id={`child-${i}`}
                    className="input"
                    aria-invalid={!!errors.childrenAges && age === null}
                    value={age ?? ""}
                    onChange={(e) => set({ childrenAges: form.childrenAges.map((a, j) => (j === i ? Number(e.target.value) : a)) })}
                  >
                    <option value="" disabled>
                      {t.agePick}
                    </option>
                    {Array.from({ length: 18 }, (_, a) => (
                      <option key={a} value={a}>
                        {t.age(a)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.adults && <p className="error">{errors.adults}</p>}
        {errors.childrenAges && <p className="error">{errors.childrenAges}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
        <Field label={t.currency} htmlFor="currency">
          <select id="currency" className="input" value={form.currency} onChange={(e) => set({ currency: e.target.value as FormState["currency"] })}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label={local ? t.budgetLocal : form.mode === "known" ? t.budgetKnown : t.budgetSuggest} hint={local ? t.budgetLocalHint : t.budgetHint} error={errors.budget} htmlFor="budget">
          <input
            id="budget"
            className="input"
            inputMode="numeric"
            placeholder={form.currency === "COP" ? (local ? "300.000" : "2.000.000") : local ? "100" : "800"}
            value={formatBudget(form.budget)}
            onChange={(e) => set({ budget: e.target.value.replace(/[^\d]/g, "") })}
          />
        </Field>
      </div>

      {!local && (
      <div>
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
      )}

      {local ? (
        <div>
          <Choice label={t.when} value={form.when} options={WHEN.map((w) => ({ value: w, label: t.whenLabels[w] }))} onChange={(v) => set({ when: v })} error={errors.when} />
          {form.when === "date" && (
            <div className="mt-3">
              <Field label={t.whenDate} error={errors.startDate} htmlFor="localDate">
                <input id="localDate" type="date" className="input sm:w-56" min={today()} value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
              </Field>
            </div>
          )}
        </div>
      ) : (
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
      )}

      {form.mode === "suggest" && (
        <>
          <Choice
            label={form.adults + kids > 1 ? t.passportGroup : t.passport}
            value={form.passport}
            options={PASSPORT.filter((p) => p !== "some" || form.adults + kids > 1).map((p) => ({ value: p, label: t.passportOptions[p] }))}
            onChange={(v) => set({ passport: v })}
            error={errors.passport}
          />
          {form.passport && form.passport !== "none" && (
            <fieldset>
              <legend className="label">{form.adults + kids > 1 ? t.visasGroup : t.visas}</legend>
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
      )}
      {form.mode === "known" && (
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
