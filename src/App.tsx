import { useEffect, useState } from "react";
import { dict } from "./i18n";
import { emptyForm, parseAmount, toRequest, type FormState } from "./form";
import type { Lang, PlanResponse } from "./shared/schema";
import StepAbout from "./components/StepAbout";
import StepTrip from "./components/StepTrip";
import { AgencyCta, KnownView, SuggestView } from "./components/Results";
import Privacy from "./components/Privacy";
import { Progress } from "./components/ui";

const store = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private mode */
    }
  },
};

function initialLang(): Lang {
  const saved = store.get("travelers-lang");
  if (saved === "es" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
}

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "done"; data: Extract<PlanResponse, { ok: true }> };

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [route, setRoute] = useState(() => location.hash);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const t = dict[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    store.set("travelers-lang", lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    store.set("travelers-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const onHash = () => setRoute(location.hash);
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    scrollTo({ top: 0, behavior: "smooth" });
  }, [step, status.kind]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  async function submit() {
    setStep(3);
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toRequest(form, lang)),
      });
      const data = (await res.json()) as PlanResponse;
      if (data.ok) setStatus({ kind: "done", data });
      else setStatus({ kind: "error", message: data.error === "invalid" ? t.errInvalid : data.error === "ai_unavailable" ? t.errAi : t.errServer });
    } catch {
      setStatus({ kind: "error", message: t.errServer });
    }
  }

  function restart() {
    setForm((f) => ({ ...emptyForm, name: f.name, email: f.email, whatsapp: f.whatsapp, consent: f.consent }));
    setStatus({ kind: "idle" });
    setStep(2);
  }

  const budgetTotal = parseAmount(form.budget) * Number(form.travelers);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-50/85 backdrop-blur dark:border-stone-800/70 dark:bg-stone-950/85">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <a href="#" className="flex items-center gap-2" onClick={() => setRoute("")}>
            <img src="/favicon.svg" alt="" className="size-8" />
            <span>
              <span className="block font-extrabold tracking-tight">Pa Donde Vamos</span>
              <span className="hidden text-xs text-stone-500 sm:block dark:text-stone-400">{t.tagline}</span>
            </span>
          </a>
          <div className="flex items-center gap-1">
            <div role="group" aria-label={t.langLabel} className="flex rounded-lg border border-stone-300 p-0.5 text-sm dark:border-stone-700">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={`rounded-md px-2.5 py-1 font-semibold uppercase transition ${lang === l ? "bg-brand-700 text-white dark:bg-brand-600" : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button onClick={() => setDark((d) => !d)} aria-label={t.theme} title={t.theme} className="btn-ghost size-10 p-0 text-lg">
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:py-10">
        {route === "#privacidad" ? (
          <Privacy lang={lang} />
        ) : (
          <>
            {/* On phones the header has no room for the tagline, so it opens the first step instead. */}
            {step === 1 && <p className="mb-4 text-lg font-semibold text-brand-700 sm:hidden dark:text-brand-500">{t.tagline}</p>}
            <Progress step={step} labels={t.steps} stepOf={t.stepOf(step)} />
            {step === 1 && <StepAbout t={t} form={form} set={set} onNext={() => setStep(2)} />}
            {step === 2 && <StepTrip t={t} lang={lang} form={form} set={set} onBack={() => setStep(1)} onSubmit={submit} />}
            {step === 3 && status.kind === "loading" && (
              <div className="card flex flex-col items-center gap-4 py-16 text-center" aria-live="polite">
                <div className="size-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-stone-800 dark:border-t-brand-500" />
                <p className="text-lg font-semibold">{t.loading}</p>
                <p className="text-sm text-stone-500">{t.loadingHint}</p>
              </div>
            )}
            {step === 3 && status.kind === "error" && (
              <div className="card space-y-4 text-center" role="alert">
                <p>{status.message}</p>
                <div className="flex justify-center gap-2">
                  <button className="btn-ghost" onClick={() => setStep(2)}>
                    ← {t.back}
                  </button>
                  <button className="btn-primary" onClick={submit}>
                    {t.retry}
                  </button>
                </div>
              </div>
            )}
            {step === 3 && status.kind === "done" && (
              <div className="space-y-5">
                {status.data.mode === "suggest" ? (
                  <SuggestView t={t} lang={lang} currency={form.currency} budgetTotal={budgetTotal} result={status.data.result} />
                ) : (
                  <KnownView t={t} lang={lang} currency={form.currency} budgetTotal={budgetTotal} result={status.data.result} />
                )}
                <AgencyCta t={t} leadId={status.data.leadId} />
                <div className="text-center">
                  <button className="btn-ghost" onClick={restart}>
                    ↺ {t.restart}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
        <p>{t.footer}</p>
        <a href="#privacidad" className="mt-1 inline-block underline">
          {t.privacy}
        </a>
      </footer>
    </div>
  );
}
