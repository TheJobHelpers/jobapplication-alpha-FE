"use client";

// Public CQFO questionnaire — one question per screen, Typeform-style.
// Reached via a unique tokenized link emailed to the client; no login.
// Answers autosave locally per token so a half-finished form resumes.
// Backend wiring (load client name/tier by token, submit answers) comes
// with apps/api; until then the page runs standalone on mock data.

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { Answers, CQFO_STEPS, Step, isStepComplete } from "@/lib/cqfo";

const MOCK_CLIENT = { name: "Ashley Bennett", tier: "Tier 2" };

export default function QuestionnairePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const storageKey = `cqfo:${token}`;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { index: number; answers: Answers };
        setIndex(Math.min(saved.index, CQFO_STEPS.length - 1));
        setAnswers(saved.answers);
      }
    } catch {
      // corrupt saved state — start fresh
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify({ index, answers }));
  }, [index, answers, loaded, storageKey]);

  const step = CQFO_STEPS[index];
  const questionSteps = useMemo(() => CQFO_STEPS.filter((s) => s.kind !== "intro" && s.kind !== "outro"), []);
  const questionNumber = questionSteps.findIndex((s) => s.id === step.id) + 1;
  const progress = step.kind === "outro" ? 1 : step.kind === "intro" ? 0 : questionNumber / questionSteps.length;
  const canAdvance = isStepComplete(step, answers);

  const next = useCallback(() => {
    if (isStepComplete(CQFO_STEPS[index], answers) && index < CQFO_STEPS.length - 1) setIndex(index + 1);
  }, [index, answers]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inTextarea = (e.target as HTMLElement)?.tagName === "TEXTAREA";
      if (e.key === "Enter" && !inTextarea) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next]);

  const set = (id: string, value: unknown) => setAnswers((a) => ({ ...a, [id]: value }));

  if (!loaded) return null;

  return (
    <div data-portal="client" className="min-h-screen flex flex-col bg-background">
      <div className="h-1 bg-zinc-900">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      <header className="flex items-center justify-between px-6 py-4 text-xs text-muted">
        <Logo size={26} />
        {step.kind !== "intro" && step.kind !== "outro" && (
          <span className="tabular-nums">{questionNumber} of {questionSteps.length}</span>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-xl">
          <StepView key={step.id} step={step} answers={answers} set={set} onNext={next} />
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 border-t border-zinc-800/60 bg-background/95 px-6 py-3 flex items-center justify-between">
        <button onClick={back} disabled={index === 0}
          className="text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-0 transition-colors">
          ← Back
        </button>
        {step.kind !== "outro" && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-600 hidden sm:inline">press Enter ↵</span>
            <button onClick={next} disabled={!canAdvance}
              className="rounded-lg bg-accent-strong px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity">
              {step.kind === "intro" ? "Start" : index === CQFO_STEPS.length - 2 ? "Finish" : "OK"}
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

function StepView({ step, answers, set, onNext }: {
  step: Step; answers: Answers;
  set: (id: string, v: unknown) => void; onNext: () => void;
}) {
  switch (step.kind) {
    case "intro":
      return (
        <div className="space-y-4 animate-[fadein_.3s_ease]">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Client questionnaire</p>
          <h1 className="text-3xl font-semibold text-zinc-100" style={{ textWrap: "balance" }}>
            Welcome, {MOCK_CLIENT.name}
          </h1>
          <p className="text-zinc-400">
            This questionnaire covers common inquiries that are both mandatory and frequently
            encountered throughout the application process. Your answers guide the data we include
            when submitting applications weekly.
          </p>
          <p className="text-sm text-zinc-500">
            {MOCK_CLIENT.tier} · Your progress saves automatically, so you can leave and come back anytime.
          </p>
        </div>
      );

    case "outro":
      return (
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-accent-strong/20 text-accent flex items-center justify-center text-xl">✓</div>
          <h1 className="text-2xl font-semibold text-zinc-100">All done. Thank you!</h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            Thank you for your cooperation and the opportunity to work together to find the
            best-suited job leads. Your team has been notified.
          </p>
        </div>
      );

    case "choice": {
      const value = answers[step.id] as string | undefined;
      return (
        <Q title={step.title}>
          <div className="flex flex-col gap-2">
            {step.options.map((opt, i) => (
              <button key={opt}
                onClick={() => { set(step.id, opt); setTimeout(onNext, 180); }}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                  value === opt
                    ? "border-accent bg-accent-strong/15 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                }`}>
                <span className="w-5 h-5 rounded border border-zinc-700 text-[10px] flex items-center justify-center text-zinc-500">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </Q>
      );
    }

    case "text": {
      const value = (answers[step.id] as string) ?? "";
      return (
        <Q title={step.title} hint={step.hint}>
          {step.multiline ? (
            <textarea autoFocus rows={4} value={value} placeholder={step.placeholder ?? "Type your answer here…"}
              onChange={(e) => set(step.id, e.target.value)} className={inputCls + " resize-none"} />
          ) : (
            <input autoFocus type={step.inputType ?? "text"} value={value}
              placeholder={step.placeholder ?? "Type your answer here…"}
              onChange={(e) => set(step.id, e.target.value)} className={inputCls} />
          )}
        </Q>
      );
    }

    case "fields": {
      const value = (answers[step.id] as Record<string, string>) ?? {};
      return (
        <Q title={step.title}>
          <div className="grid gap-3 sm:grid-cols-2">
            {step.fields.map((f, i) => (
              <label key={f.key} className={i === 0 ? "sm:col-span-2" : ""}>
                <span className="text-xs text-zinc-500">{f.label}</span>
                <input autoFocus={i === 0} value={value[f.key] ?? ""} placeholder={f.placeholder}
                  onChange={(e) => set(step.id, { ...value, [f.key]: e.target.value })}
                  className={inputCls + " mt-1"} />
              </label>
            ))}
          </div>
        </Q>
      );
    }

    case "yesno": {
      const value = (answers[step.id] as { answer?: string; detail?: string }) ?? {};
      return (
        <Q title={step.title} hint={step.hint}>
          <div className="flex gap-2">
            {(["yes", "no"] as const).map((opt) => (
              <button key={opt}
                onClick={() => {
                  const nextVal = { ...value, answer: opt };
                  set(step.id, nextVal);
                  if (!(opt === "yes" && step.followUp)) setTimeout(onNext, 180);
                }}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                  value.answer === opt
                    ? "border-accent bg-accent-strong/15 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                }`}>
                {opt}
              </button>
            ))}
          </div>
          {value.answer === "yes" && step.followUp && (
            <label className="block mt-4">
              <span className="text-xs text-zinc-500">{step.followUp.label}</span>
              {step.followUp.multiline ? (
                <textarea autoFocus rows={3} value={value.detail ?? ""}
                  onChange={(e) => set(step.id, { ...value, detail: e.target.value })}
                  className={inputCls + " mt-1 resize-none"} />
              ) : (
                <input autoFocus value={value.detail ?? ""}
                  onChange={(e) => set(step.id, { ...value, detail: e.target.value })}
                  className={inputCls + " mt-1"} />
              )}
            </label>
          )}
        </Q>
      );
    }

    case "range": {
      const value = (answers[step.id] as { from?: string; to?: string; note?: string }) ?? {};
      return (
        <Q title={step.title}>
          <div className="flex items-center gap-3">
            <input autoFocus inputMode="numeric" placeholder="From" value={value.from ?? ""}
              onChange={(e) => set(step.id, { ...value, from: e.target.value })} className={inputCls} />
            <span className="text-zinc-600 text-sm">to</span>
            <input inputMode="numeric" placeholder="To" value={value.to ?? ""}
              onChange={(e) => set(step.id, { ...value, to: e.target.value })} className={inputCls} />
            <span className="text-zinc-500 text-sm">{step.unit}/yr</span>
          </div>
          {step.noteLabel && (
            <label className="block mt-4">
              <span className="text-xs text-zinc-500">{step.noteLabel}</span>
              <textarea rows={2} value={value.note ?? ""}
                onChange={(e) => set(step.id, { ...value, note: e.target.value })}
                className={inputCls + " mt-1 resize-none"} />
            </label>
          )}
        </Q>
      );
    }

    case "repeat": {
      const rows = (answers[step.id] as Record<string, string>[]) ?? Array.from({ length: Math.max(step.min, 1) }, () => ({}));
      const setRow = (i: number, key: string, v: string) => {
        const copy = rows.map((r) => ({ ...r }));
        copy[i][key] = v;
        set(step.id, copy);
      };
      return (
        <Q title={step.title} hint={step.hint}>
          <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
            {rows.map((row, i) => (
              <fieldset key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                <legend className="px-1 text-xs text-zinc-500">{step.itemLabel} {rows.length > 1 ? i + 1 : ""}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {step.fields.map((f) => (
                    <label key={f.key}>
                      <span className="text-xs text-zinc-500">{f.label}</span>
                      <input value={row[f.key] ?? ""} placeholder={f.placeholder}
                        onChange={(e) => setRow(i, f.key, e.target.value)} className={inputCls + " mt-1"} />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            {rows.length < step.max && (
              <button onClick={() => set(step.id, [...rows, {}])}
                className="text-xs text-accent hover:underline">+ Add {step.itemLabel.toLowerCase()}</button>
            )}
            {rows.length > Math.max(step.min, 1) && (
              <button onClick={() => set(step.id, rows.slice(0, -1))}
                className="text-xs text-zinc-500 hover:text-zinc-300">Remove last</button>
            )}
          </div>
        </Q>
      );
    }
  }
}

function Q({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-medium text-zinc-100" style={{ textWrap: "balance" }}>{title}</h2>
        {hint && <p className="mt-2 text-sm text-zinc-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 text-sm text-zinc-100 " +
  "placeholder:text-zinc-600 outline-none focus:border-accent transition-colors";
