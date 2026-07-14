import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/landing/reveal";
import { Logo } from "@/components/ui/logo";

// Public landing page for The Job Helpers — the page we send to prospective
// clients. Light, emerald brand (data-portal="client" scopes the tokens), with
// tasteful motion (see globals.css lp-* + components/landing/reveal). Lives at
// /landing-page for now; later it moves to the root URL.

export const metadata: Metadata = {
  title: "The Job Helpers · Your job search, fully handled",
  description:
    "We find roles that fit you, you approve the ones you like, and our team applies on your behalf. You just show up to interviews.",
};

const STEPS = [
  {
    n: "1",
    title: "We source roles matched to you",
    body: "Every week our team finds real openings that fit your experience, salary, location and preferences. No job boards, no endless scrolling.",
    icon: <IconSearch />,
  },
  {
    n: "2",
    title: "You review and approve",
    body: "See each role in your portal. Approve the ones you like with a tap, or skip one with a quick reason so we learn your taste and search better.",
    icon: <IconApprove />,
  },
  {
    n: "3",
    title: "We apply and keep you posted",
    body: "Our team submits tailored applications on your behalf and tracks each one, from applied to interviewing to offer, so you always know where things stand.",
    icon: <IconSend />,
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

const STATS = [
  { k: "Weekly", v: "Curated roles", s: "Fresh matches every week" },
  { k: "Your call", v: "You approve every role", s: "Nothing applied without your yes" },
  { k: "End to end", v: "Tracked to offer", s: "Every application, always visible" },
];

export default function LandingPage() {
  return (
    <div
      data-portal="client"
      className="min-h-screen overflow-x-hidden bg-background text-foreground"
    >
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-panel-border/60 bg-[var(--background)]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size={32} />
          <Link
            href="/login"
            className="rounded-full border border-panel-border px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-28 -top-24 h-80 w-80 rounded-full bg-[var(--accent)] opacity-[0.14] blur-[90px]" />
          <div className="absolute right-[-6rem] top-24 h-96 w-96 rounded-full bg-emerald-400 opacity-[0.12] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle, color-mix(in srgb, var(--foreground) 6%, transparent) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage:
                "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)",
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-16 md:grid-cols-2 md:pt-24">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-panel-border bg-panel px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                Done-for-you job search
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-[42px] font-semibold leading-[1.02] tracking-tight text-balance sm:text-[56px]">
                Your job search,{" "}
                <span className="relative whitespace-nowrap text-[var(--accent-strong)]">
                  fully handled
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M1 5.5C40 2 120 1.5 199 4.5"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-muted">
                We find roles that fit you. You approve the ones you like. Our
                team applies on your behalf and tracks every application through
                to offers. You just show up to the interviews.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] hover:shadow-xl hover:shadow-[var(--accent)]/30"
                >
                  Go to your portal
                  <span className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
                <a
                  href="#how"
                  className="rounded-lg px-4 py-2.5 text-[14px] font-semibold text-muted transition-colors hover:text-foreground"
                >
                  See how it works
                </a>
              </div>
            </Reveal>
          </div>

          {/* Product preview */}
          <Reveal delay={200} className="relative">
            <div className="lp-float relative mx-auto max-w-sm">
              {/* peeking card behind for depth */}
              <div className="absolute -right-3 -top-3 h-full w-full rotate-3 rounded-2xl border border-panel-border bg-panel/70" />
              <div className="relative rounded-2xl border border-panel-border bg-panel p-5 shadow-[0_30px_70px_-30px_rgba(16,24,40,0.4)]">
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
                          className="lp-meter block h-full rounded-full"
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
          </Reveal>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-panel-border bg-panel">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-3">
          {STATS.map((st, i) => (
            <Reveal key={st.v} delay={i * 90} className="text-center sm:text-left">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                {st.k}
              </p>
              <p className="mt-1.5 text-[17px] font-semibold">{st.v}</p>
              <p className="mt-0.5 text-[13px] text-muted">{st.s}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            How it works
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-[30px] font-semibold tracking-tight text-balance">
            Three simple steps. We do the heavy lifting.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-panel-border bg-panel p-7 transition-all hover:-translate-y-1.5 hover:border-[var(--accent)]/40 hover:shadow-[0_28px_60px_-32px_rgba(16,24,40,0.4)]">
                {/* ghosted step number */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-1 -top-5 select-none font-mono text-[92px] font-bold leading-none text-[var(--accent)] opacity-[0.08]"
                >
                  {s.n}
                </span>
                <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)]/12 text-[var(--accent-strong)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  {s.icon}
                </span>
                <p className="relative mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                  Step {s.n}
                </p>
                <h3 className="relative mt-1.5 text-[16.5px] font-semibold leading-snug">
                  {s.title}
                </h3>
                <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-muted">
                  {s.body}
                </p>
                {/* accent underline grows on hover */}
                <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-300 group-hover:scale-x-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values — tinted band for contrast */}
      <section
        className="border-y border-panel-border"
        style={{
          backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--panel))",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
              Why The Job Helpers
            </p>
            <h2 className="mt-3 max-w-xl text-[28px] font-semibold tracking-tight text-balance">
              Built around you, not a job board.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 100}>
                <div className="group flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-panel text-[var(--accent-strong)] shadow-sm ring-1 ring-panel-border transition-transform group-hover:scale-110">
                    {v.icon}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold">{v.title}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                      {v.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24">
        <Reveal className="mx-auto max-w-3xl">
          <div
            className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-[var(--accent)]/20 px-6 py-14 text-center sm:px-12"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 120% at 50% 0%, color-mix(in srgb, var(--accent) 16%, var(--panel)), var(--panel))",
            }}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--accent)] opacity-[0.12] blur-[80px]" />
            <h2 className="relative max-w-md text-[27px] font-semibold leading-tight tracking-tight text-balance sm:text-[30px]">
              Ready to let us take the job search off your plate?
            </h2>
            <p className="relative mt-4 max-w-sm text-[15px] text-muted">
              Sign in to your portal to review this week’s roles.
            </p>
            <Link
              href="/login"
              className="group relative mt-7 inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
            >
              Go to your portal
              <span className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-panel-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-[12.5px] text-muted sm:flex-row">
          <Logo size={26} />
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
function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function IconApprove() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
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
