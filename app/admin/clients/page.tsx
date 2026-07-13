import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { api, type Client } from "@/lib/api";

// Clients roster. Minimal real list (name, owner, stage, quota) where each row
// opens the Client Workspace. The full "New client" intake flow lands later.
export default async function ClientsPage() {
  const clients = await api.getClients();

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Clients
          </p>
          <h1 className="mt-1 text-[16px] font-semibold">Roster</h1>
        </div>
        <span className="font-mono text-[12px] tabular-nums text-muted">
          {clients.length} clients
        </span>
      </header>

      <Panel className="overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-panel-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          <span>Client</span>
          <span className="hidden sm:block">Owner</span>
          <span>Stage</span>
          <span className="text-right">Quota</span>
        </div>
        <div className="divide-y divide-panel-border">
          {clients.map((c) => (
            <RosterRow key={c.id} client={c} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function RosterRow({ client: c }: { client: Client }) {
  return (
    <Link
      href={`/admin/clients/${c.id}`}
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/30"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-zinc-100">
          {c.name}
        </p>
        <p className="text-[11px] text-muted">{c.tier}</p>
      </div>
      <span className="hidden whitespace-nowrap text-[12px] text-muted sm:block">
        {c.ownerName}
      </span>
      <StageChip stage={c.stage} />
      <span className="text-right font-mono text-[12px] tabular-nums text-zinc-300">
        {c.filledApps}/{c.quotaApps}
      </span>
    </Link>
  );
}

function StageChip({ stage }: { stage: Client["stage"] }) {
  const color =
    stage === "active"
      ? "var(--status-offer)"
      : stage === "onboarding"
        ? "var(--status-review)"
        : stage === "paused"
          ? "var(--status-interview)"
          : "var(--status-expired)";
  return (
    <span
      className="justify-self-start rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
      }}
    >
      {stage}
    </span>
  );
}
