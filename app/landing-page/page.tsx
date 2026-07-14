import Link from "next/link";
import type { Metadata } from "next";

// Public landing page for The Job Helpers — the page we send to prospective
// clients. Minimal, light, emerald brand (data-portal="client" scopes the tokens).
// Lives at /landing-page for now; later it moves to the root URL.

export const metadata: Metadata = {
  title: "The Job Helpers · Your job search, fully handled",
  description:
    "We find roles that fit you, you approve the ones you like, and our team applies on your behalf. You just show up to interviews.",
};

const STEPS = [
  {
    n: "01",
    title: "We source roles matched to you",
    body: "Every week our team finds real openings that fit your experience, salary, location and preferences. No job boards, no endless scrolling.",
  },
  {
    n: "02",
    title: "You review and approve",
    body: "See each role in your portal. Approve the ones you like with a tap, or skip one with a quick reason so we learn your taste and search better.",
  },
  {
    n: "03",
    title: "We apply and keep you posted",
    body: "Our team submits tailored applications on your behalf and tracks each one, from applied to interviewing to offer, so you always know where things stand.",
  },
];

const VALUES = [
  {
    title: "Matched to you",
    body: "Every role is chosen against your profile, not scraped in bulk.",
    icon: <IconTarget />,
  },
  {
    title: "You stay in control",
    body: "Nothing is applied to without your approval. Your search, your call.",
    icon: <IconCheck />,
  },
  {
    title: "Fully transparent",
    body: "Track every application end to end. No black box, no wondering.",
    icon: <IconEye />,
  },
];

export default function LandingPage() {
  return (
    <div
      data-portal="client"
      className="min-h-screen bg-background text-foreground"
    >
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          <span className="text-[15px] font-semibold">The Job Helpers</span>
        </div>
        <Link
          href="/login"
          className="rounded-full border border-panel-border px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 md:grid-cols-2 md:pt-20">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            Done-for-you job search
          </p>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-tight text-balance sm:text-[52px]">
            Your job search, fully handled.
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted">
            We find roles that fit you. You approve the ones you like. Our team
            applies on your behalf and tracks every application through to offers.
            You just show up to the interviews.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--accent-strong)]"
            >
              Go to your portal
            </Link>
            <a
              href="#how"
              className="rounded-lg px-4 py-2.5 text-[14px] font-semibold text-muted transition-colors hover:text-foreground"
            >
              See how it works →
            </a>
          </div>
        </div>

        {/* Product preview */}
        <div className="relative">
          <div className="mx-auto max-w-sm rounded-2xl border border-panel-border bg-panel p-5 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.35)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                This week · for you
              </p>
              <span className="rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-strong)]">
                3 to review
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-panel-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold">
                    Senior Product Manager
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    Stripe · Remote (US) · $180k–$210k
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-9 overflow-hidden rounded-full bg-panel-border">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: "92%", backgroundColor: "rgb(129 140 248)" }}
                    />
                  </span>
                  <span className="font-mono text-[11px] text-foreground/80">
                    92%
                  </span>
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="flex-1 rounded-md bg-[var(--accent)] py-1.5 text-center text-[12px] font-semibold text-white">
                  Approve
                </span>
                <span className="flex-1 rounded-md border border-status-rejected/60 py-1.5 text-center text-[12px] font-semibold text-status-rejected">
                  Not a fit
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <PreviewRow title="Staff PM · Klarna" status="Interviewing" tone="var(--status-interview)" />
              <PreviewRow title="Product Lead · Wise" status="Applied" tone="var(--status-applied)" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-panel-border bg-panel">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-[26px] font-semibold tracking-tight">
            How it works
          </h2>
          <p className="mt-2 max-w-lg text-[15px] text-muted">
            Three simple steps. We do the heavy lifting; you stay in control.
          </p>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="font-mono text-[13px] font-semibold text-[var(--accent-strong)]">
                  {s.n}
                </span>
                <div className="mt-3 h-px w-8 bg-[var(--accent)]" />
                <h3 className="mt-4 text-[17px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-panel-border p-6"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]/12 text-[var(--accent-strong)]">
                {v.icon}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{v.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div
          className="overflow-hidden rounded-3xl border border-panel-border px-8 py-14 text-center"
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 8%, var(--panel))",
          }}
        >
          <h2 className="mx-auto max-w-lg text-[26px] font-semibold tracking-tight text-balance">
            Ready to let us take the job search off your plate?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
            Sign in to your portal to review this week’s roles.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--accent-strong)]"
          >
            Go to your portal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-panel-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-[12.5px] text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-medium text-foreground">The Job Helpers</span>
          </div>
          <p>© {new Date().getFullYear()} The Job Helpers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function PreviewRow({
  title,
  status,
  tone,
}: {
  title: string;
  status: string;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-panel-border px-3 py-2">
      <span className="text-[12.5px]">{title}</span>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{
          color: tone,
          backgroundColor: `color-mix(in srgb, ${tone} 16%, transparent)`,
        }}
      >
        {status}
      </span>
    </div>
  );
}

function IconTarget() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
