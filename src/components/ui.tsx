import type { ReactNode } from "react";

export function Field({ label, error, hint, htmlFor, children }: { label: string; error?: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export function YesNo({ label, value, onChange, yes, no, error }: { label: string; value: boolean | null; onChange: (v: boolean) => void; yes: string; no: string; error?: string }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`rounded-xl border px-4 py-2.5 font-medium transition ${
              value === v
                ? "border-brand-600 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-900/40 dark:text-brand-100"
                : "border-stone-300 bg-white hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-500"
            }`}
          >
            {v ? yes : no}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </fieldset>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "border-brand-600 bg-brand-700 text-white dark:border-brand-500 dark:bg-brand-600"
          : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
      }`}
    >
      {children}
    </button>
  );
}

export function Progress({ step, labels, stepOf }: { step: number; labels: string[]; stepOf: string }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-medium text-brand-700 dark:text-brand-500">{stepOf}</p>
      <div className="flex gap-2">
        {labels.map((l, i) => (
          <div key={l} className="flex-1">
            <div className={`h-1.5 rounded-full ${i < step ? "bg-brand-600 dark:bg-brand-500" : "bg-stone-200 dark:bg-stone-800"}`} />
            <p className={`mt-1.5 hidden text-xs sm:block ${i < step ? "text-stone-700 dark:text-stone-300" : "text-stone-400 dark:text-stone-500"}`}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
