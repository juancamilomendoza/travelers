import { useState, type FormEvent } from "react";
import type { dict } from "../i18n";
import { validateAbout, type Errors, type FormState } from "../form";
import { Field } from "./ui";

type Props = {
  t: (typeof dict)["es"];
  form: FormState;
  set: (patch: Partial<FormState>) => void;
  onNext: () => void;
};

export default function StepAbout({ t, form, set, onNext }: Props) {
  const [errors, setErrors] = useState<Errors>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateAbout(form, t);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  return (
    <form onSubmit={submit} noValidate className="card space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.s1Title}</h1>
        <p className="mt-1 text-stone-600 dark:text-stone-400">{t.s1Lead}</p>
      </div>

      <Field label={t.name} error={errors.name} htmlFor="name">
        <input id="name" className="input" autoComplete="name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>

      <Field label={t.email} error={errors.email} htmlFor="email">
        <input id="email" type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
      </Field>

      <Field label={t.whatsapp} error={errors.whatsapp} hint={t.whatsappHint} htmlFor="whatsapp">
        <input id="whatsapp" type="tel" className="input" autoComplete="tel" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-stone-100 p-4 text-sm leading-relaxed text-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-brand-700"
            checked={form.consent}
            onChange={(e) => set({ consent: e.target.checked })}
          />
          <span>
            {t.consent}{" "}
            <a href="#privacidad" target="_blank" className="font-medium text-brand-700 underline dark:text-brand-500">
              {t.privacyLink}
            </a>
            .
          </span>
        </label>
        {errors.consent && <p className="error">{errors.consent}</p>}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary w-full sm:w-auto">
          {t.next} →
        </button>
      </div>
    </form>
  );
}
