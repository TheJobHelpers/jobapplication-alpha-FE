import { Panel } from "@/components/ui/panel";

// Temporary placeholder for internal routes not yet built. Keeps the shell
// fully navigable while screens land in backlog order (04 Backlog).
export function ComingSoon({
  area,
  title,
  blurb,
}: {
  area: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          {area}
        </p>
        <h1 className="mt-1 text-[16px] font-semibold">{title}</h1>
      </header>
      <Panel className="p-8">
        <p className="max-w-lg text-[13px] leading-relaxed text-muted">{blurb}</p>
        <p className="mt-3 text-[11px] text-zinc-500">Coming soon.</p>
      </Panel>
    </div>
  );
}
