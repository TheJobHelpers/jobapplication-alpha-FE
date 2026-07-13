"use client";

// Clients roster — fixtures + clients created in the UI (store), with stage
// overrides applied. Each row opens the workspace. "New client" (manager/admin)
// starts the onboarding wizard.

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  effectiveQuestionnaire,
  QuestionnaireStatusChip,
} from "@/components/admin/questionnaire-panel";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { Panel } from "@/components/ui/panel";
import { api, type Client, type QuestionnaireStatus } from "@/lib/api";
import { canCreateClient } from "@/lib/permissions";
import { stageColor } from "@/lib/stage";

export function ClientsRoster() {
  const { user } = useCurrentUser();
  const { clients: created, stageById, questionnaireById } = useStore();
  const [base, setBase] = useState<Client[]>([]);

  useEffect(() => {
    api.getClients().then(setBase);
  }, []);

  const clients = [...created, ...base].map((c) => ({
    ...c,
    stage: stageById[c.id] ?? c.stage,
  }));

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Clients
          </p>
          <h1 className="mt-1 text-[16px] font-semibold">Roster</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] tabular-nums text-muted">
            {clients.length} clients
          </span>
          {canCreateClient(user) && (
            <Link
              href="/admin/clients/new"
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              + New client
            </Link>
          )}
        </div>
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
            <RosterRow
              key={c.id}
              client={c}
              qStatus={effectiveQuestionnaire(c, questionnaireById).status}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function RosterRow({
  client: c,
  qStatus,
}: {
  client: Client;
  qStatus: QuestionnaireStatus;
}) {
  return (
    <Link
      href={`/admin/clients/${c.id}`}
      className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/30"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-zinc-100">{c.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[11px] text-muted">{c.tier}</span>
          {c.stage === "onboarding" && (
            <span className="flex items-center gap-1 text-[10px] text-muted">
              · Questionnaire <QuestionnaireStatusChip status={qStatus} />
            </span>
          )}
        </div>
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
  const color = stageColor(stage);
  return (
    <span
      className="justify-self-start rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
    >
      {stage}
    </span>
  );
}
