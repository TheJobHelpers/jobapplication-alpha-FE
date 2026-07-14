import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Portal chooser. Flat surfaces, one accent per card scoped via data-portal
// (indigo = internal, emerald = client). No glass, no gradients (DESIGN.md).
const portals = [
  {
    href: "/admin",
    portal: "internal",
    name: "Internal Portal",
    audience: "Operations team",
    blurb: "Work queue, client workspaces, pipeline, and team oversight.",
  },
  {
    href: "/client",
    portal: "client",
    name: "Client Portal",
    audience: "Managed clients",
    blurb: "Review sourced jobs, track applications, and manage your profile.",
  },
] as const;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-24">
      <div className="space-y-4 text-center">
        <Logo size={44} showName={false} className="justify-center" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          The Job Helpers
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Job Application Portal
        </h1>
        <p className="mx-auto max-w-xl text-[14px] text-muted">
          One platform, two portals. Pick yours.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-5 sm:grid-cols-2">
        {portals.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            data-portal={p.portal}
            className="group space-y-3 rounded-lg border border-panel-border bg-panel p-6 transition-colors hover:border-zinc-600"
          >
            <div className="h-1.5 w-8 rounded-full bg-[var(--accent)] transition-all group-hover:w-12" />
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">
                {p.name}
              </h2>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                {p.audience}
              </p>
            </div>
            <p className="text-[13px] text-muted">{p.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
