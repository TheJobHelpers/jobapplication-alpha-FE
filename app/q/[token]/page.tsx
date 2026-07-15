"use client";

// Public CQFO questionnaire — one question per screen, Typeform-style.
// Reached via a unique tokenized link (no login). Loads the real client by token
// from the backend, autosaves progress (→ in_progress), and submits (→ completed
// + seeds sourcing prefs). Light/white to match the client portal — colors come
// from the portal tokens (--foreground / --panel / --muted / --accent).

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { publicQuestionnaire } from "@/lib/api";
import { Answers, CQFO_STEPS, Step, isStepComplete } from "@/lib/cqfo";
import { deriveFromAnswers } from "@/lib/cqfo-derive";

// Where in CQFO_STEPS to resume, based on which required questions are still
// unanswered (optional ones count as "complete" whether answered or not, same
// as the real advance gate). Used to reconcile local vs server progress.
function resumeIndexFor(answers: Answers): number {
  const i = CQFO_STEPS.findIndex(
    (s, idx) => idx > 0 && idx < CQFO_STEPS.length - 1 && !isStepComplete(s, answers),
  );
  return i === -1 ? CQFO_STEPS.length - 2 : i;
}

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
  const [load, setLoad] = useState<"loading" | "ready" | "invalid">("loading");
  const [clientName, setClientName] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const submittedRef = useRef(false);
  // Latest answers, readable from the step-change effect without making it fire
  // on every keystroke. Updated in an effect (never during render).
  const answersRef = useRef<Answers>(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Restore local progress first (instant, offline-friendly).
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

  // Resolve the token against the backend: real client name, status, and
  // (crucially) the answers saved so far. A bad or expired token 404s →
  // invalid-link screen. Already completed → jump to done.
  useEffect(() => {
    let alive = true;
    publicQuestionnaire
      .get(token)
      .then((r) => {
        if (!alive) return;
        setClientName(r.clientName);
        setLoad("ready");
        if (r.status === "completed") {
          submittedRef.current = true;
          setAnswers((a) => (Object.keys(a).length ? a : r.answers));
          setIndex(CQFO_STEPS.length - 1); // outro
          return;
        }
        // This link has no login, so a client resuming on a different
        // device/browser has nothing but the server to recover their
        // progress from. Adopt whichever of local (this browser) vs server
        // (durable) is further along, so "leave and come back anytime" holds
        // no matter where they come back from.
        const serverIdx = resumeIndexFor(r.answers);
        const localIdx = resumeIndexFor(answersRef.current);
        if (serverIdx > localIdx) {
          setAnswers(r.answers);
          setIndex(serverIdx);
        }
      })
      .catch(() => alive && setLoad("invalid"));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify({ index, answers }));
  }, [index, answers, loaded, storageKey]);

  // Report progress to the backend on each screen change (once the token is
  // resolved): non-intro steps mark the questionnaire in-progress + persist the
  // partial answers; reaching the outro submits once (→ completed, seeds prefs).
  useEffect(() => {
    if (load !== "ready" || submittedRef.current) return;
    const s = CQFO_STEPS[index];
    if (!s || s.kind === "intro") return;
    const a = answersRef.current;
    if (s.kind === "outro") {
      submittedRef.current = true;
      publicQuestionnaire
        .submit(token, { ...a, ...deriveFromAnswers(a) })
        .catch(() => {});
    } else {
      publicQuestionnaire.saveProgress(token, a).catch(() => {});
    }
  }, [index, load, token]);

  const step = CQFO_STEPS[index];
  const questionSteps = useMemo(() => CQFO_STEPS.filter((s) => s.kind !== "intro" && s.kind !== "outro"), []);
  const questionNumber = questionSteps.findIndex((s) => s.id === step.id) + 1;
  const progress = step.kind === "outro" ? 1 : step.kind === "intro" ? 0 : questionNumber / questionSteps.length;
  // The intro can only advance once the client acknowledges the privacy policy.
  const stepReady = (s: Step) =>
    s.kind === "intro" ? answers.privacy_ack === true : isStepComplete(s, answers);
  const canAdvance = stepReady(step);

  const next = useCallback(() => {
    if (stepReady(CQFO_STEPS[index]) && index < CQFO_STEPS.length - 1) setIndex(index + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!loaded || load === "loading") return <Splash>Loading your questionnaire…</Splash>;
  if (load === "invalid")
    return (
      <Splash>
        This questionnaire link is invalid or has expired. Please contact your Job
        Helper for a new one.
      </Splash>
    );

  return (
    <div data-portal="client" className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="h-1 bg-panel-border">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      <header className="flex items-center justify-between px-6 py-4 text-xs text-muted">
        <Logo size={26} />
        {step.kind !== "intro" && step.kind !== "outro" && (
          <span className="tabular-nums">{questionNumber} of {questionSteps.length}</span>
        )}
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl flex flex-col gap-8">
          <div key={step.id} className="cq-step-in">
            <StepView step={step} answers={answers} set={set} onNext={next} clientName={clientName} />
          </div>

          {step.kind !== "intro" && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-3">
                {index > 0 && (
                  <button onClick={step.kind === "outro" ? () => setShowReviewModal(true) : back}
                    className={step.kind === "outro"
                      ? "text-xs text-muted hover:text-foreground hover:underline transition-colors mt-4"
                      : "rounded-lg border border-panel-border bg-panel px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-muted hover:text-foreground hover:bg-panel-border/30"}>
                    {step.kind === "outro" ? "← Review answers" : "← Back"}
                  </button>
                )}
                {step.kind !== "outro" && (
                  <button onClick={next} disabled={!canAdvance}
                    className="rounded-lg bg-accent-strong px-10 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40">
                    {index === CQFO_STEPS.length - 2 ? "Finish" : "OK"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-[fadein_.2s_ease]">
          <div className="w-full max-w-2xl bg-panel border border-panel-border rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5">
              <h3 className="text-base font-semibold text-foreground">Review your answers</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-muted hover:text-foreground text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-8 py-2 space-y-4 divide-y divide-panel-border/20 cq-review-scroll">
              {CQFO_STEPS.map((s, idx) => {
                if (s.kind === "intro" || s.kind === "outro") return null;
                const isFirst = CQFO_STEPS.findIndex((st) => st.kind !== "intro" && st.kind !== "outro") === idx;
                return (
                  <div key={s.id} className={isFirst ? "flex justify-between items-center gap-4 py-3" : "flex justify-between items-center gap-4 py-3.5 pt-4"}>
                    <div className="space-y-1 flex-1">
                      <span className="text-[13px] font-medium text-muted/70 block leading-snug text-left">{s.title}</span>
                      <div className="text-left mt-0.5">{renderAnswerSummary(s, answers)}</div>
                    </div>
                    <button
                      onClick={() => {
                        setIndex(idx);
                        setShowReviewModal(false);
                      }}
                      className="text-xs text-muted hover:text-accent-strong font-medium transition-colors shrink-0 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 flex justify-end">
              <button
                onClick={() => setShowReviewModal(false)}
                className="rounded-lg bg-accent-strong px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepView({ step, answers, set, onNext, clientName }: {
  step: Step; answers: Answers;
  set: (id: string, v: unknown) => void; onNext: () => void; clientName: string;
}) {
  switch (step.kind) {
    case "intro":
      return (
        <div className="flex flex-col items-center space-y-5 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-accent-strong">Client questionnaire</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground" style={{ textWrap: "balance" }}>
            Welcome{clientName ? `, ${clientName.split(" ")[0]}` : ""}
          </h1>
          <p className="max-w-xl text-muted" style={{ textWrap: "pretty" }}>
            This questionnaire collects essential details required for your job applications.
            Your answers directly shape the information we include when submitting applications
            on your behalf each week.
          </p>
          <p className="text-sm text-muted">
            Your progress saves automatically, so you can leave and come back anytime.
          </p>
          <label className="mt-1 mx-auto flex w-fit items-center justify-center gap-2.5 text-left cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={answers.privacy_ack === true}
              onChange={(e) => set("privacy_ack", e.target.checked)}
              className="h-4 w-4 shrink-0 accent-[var(--accent-strong)]"
            />
            <span className="text-sm text-muted/80">
              I acknowledge that I have read and agree to the{" "}
              <a
                href="https://thejobhelpers.com/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-strong underline"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://thejobhelpers.com/terms/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-strong underline"
              >
                Terms
              </a>
              .
            </span>
          </label>
          <button
            onClick={onNext}
            disabled={answers.privacy_ack !== true}
            className="mt-2 rounded-lg bg-accent-strong px-10 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          >
            Start
          </button>
        </div>
      );

    case "outro":
      return (
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-accent/15 text-accent-strong flex items-center justify-center text-xl">✓</div>
          <h1 className="text-2xl font-semibold text-foreground">All done!</h1>
          <p className="text-muted max-w-xl mx-auto" style={{ textWrap: "pretty" }}>
            <span>
              Thank you for your cooperation. The Job Helpers team has been notified, and
              you can expect your first job applications to begin soon.
            </span>
            <span className="block mt-3">
              We're thrilled to partner with you on this journey to find your next great role!
            </span>
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
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-panel-border bg-panel text-foreground hover:border-muted"
                }`}>
                <span className="w-5 h-5 rounded border border-panel-border text-[10px] flex items-center justify-center text-muted">
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
                <span className="text-xs text-muted">{f.label}</span>
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
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-panel-border bg-panel text-foreground hover:border-muted"
                }`}>
                {opt}
              </button>
            ))}
          </div>
          {value.answer === "yes" && step.followUp && (
            <label className="block mt-4">
              <span className="text-xs text-muted">{step.followUp.label}</span>
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
            <span className="text-muted text-sm">to</span>
            <input inputMode="numeric" placeholder="To" value={value.to ?? ""}
              onChange={(e) => set(step.id, { ...value, to: e.target.value })} className={inputCls} />
            <span className="text-muted text-sm">{step.unit}/yr</span>
          </div>
          {step.noteLabel && (
            <label className="block mt-4">
              <span className="text-xs text-muted">{step.noteLabel}</span>
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
              <fieldset key={i} className="rounded-lg border border-panel-border bg-panel p-4">
                <legend className="px-1 text-xs text-muted">{step.itemLabel} {rows.length > 1 ? i + 1 : ""}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {step.fields.map((f) => (
                    <label key={f.key}>
                      <span className="text-xs text-muted">{f.label}</span>
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
                className="text-xs text-accent-strong hover:underline">+ Add {step.itemLabel.toLowerCase()}</button>
            )}
            {rows.length > Math.max(step.min, 1) && (
              <button onClick={() => set(step.id, rows.slice(0, -1))}
                className="text-xs text-muted hover:text-foreground">Remove last</button>
            )}
          </div>
        </Q>
      );
    }
  }
}

function Q({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] sm:text-[27px] font-semibold leading-snug text-foreground" style={{ textWrap: "pretty" }}>{title}</h2>
        {hint && <p className="mt-2.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-panel-border bg-panel px-3.5 py-2.5 text-sm text-foreground " +
  "placeholder:text-muted outline-none focus:border-accent transition-colors";

// Full-screen centered message for the loading / invalid-link states.
function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-portal="client"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center"
    >
      <Logo size={30} />
      <p className="max-w-sm text-sm text-muted">{children}</p>
    </div>
  );
}

function renderAnswerSummary(s: Step, answers: Answers) {
  const value = answers[s.id];
  if (value === undefined || value === null) return <span className="text-muted/50 italic text-sm">Not answered</span>;

  switch (s.kind) {
    case "choice":
    case "text":
      return <span className="text-sm font-medium text-foreground">{String(value) || <span className="text-muted/50 italic">Empty</span>}</span>;

    case "fields": {
      const record = value as Record<string, string>;
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-0.5">
          {s.fields.map((f) => {
            const val = record[f.key];
            if (!val) return null;
            return (
              <span key={f.key} className="text-muted">
                {f.label}: <span className="text-foreground font-semibold">{val}</span>
              </span>
            );
          })}
        </div>
      );
    }

    case "yesno": {
      const obj = value as { answer?: string; detail?: string };
      if (!obj.answer) return <span className="text-muted/50 italic text-sm">Not answered</span>;
      return (
        <div className="text-sm text-foreground font-medium">
          <span className="capitalize">{obj.answer}</span>
          {obj.answer === "yes" && obj.detail && (
            <span className="text-muted font-normal text-xs ml-2 border-l border-panel-border pl-2 italic">
              {obj.detail}
            </span>
          )}
        </div>
      );
    }

    case "range": {
      const obj = value as { from?: string; to?: string; note?: string };
      return (
        <div className="text-sm text-foreground font-medium">
          {obj.from || "—"} to {obj.to || "—"} {s.unit}/yr
          {obj.note && (
            <span className="text-muted font-normal text-xs ml-2 border-l border-panel-border pl-2 italic text-left">
              Note: {obj.note}
            </span>
          )}
        </div>
      );
    }

    case "repeat": {
      const list = value as Record<string, string>[];
      if (!list.length) return <span className="text-muted/50 italic text-sm">None</span>;
      return (
        <div className="space-y-3 mt-1">
          {list.map((item, i) => (
            <div key={i} className="text-xs border-l-2 border-panel-border pl-3 space-y-1 text-left">
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">{s.itemLabel} {i + 1}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {s.fields.map((f) => {
                  const val = item[f.key];
                  if (!val) return null;
                  return (
                    <span key={f.key} className="text-muted">
                      {f.label}: <span className="text-foreground font-medium">{val}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
