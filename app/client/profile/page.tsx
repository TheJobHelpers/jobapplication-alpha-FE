"use client";

// Profile — what we know about the client and what we're searching for on their
// behalf. Read-mostly in the mock: preferences and documents come from onboarding
// (the CQFO questionnaire); changes go through their Job Helper for now.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useClientPortal } from "@/components/client/client-portal-context";
import {
  effectiveDocuments,
  useStore,
} from "@/components/shell/store-context";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import {
  api,
  DOCUMENT_KIND_LABEL,
  DOCUMENT_KINDS,
  QUESTIONNAIRE_LABEL,
  type ClientDocument,
  type WorkType,
} from "@/lib/api";

const WORK_TYPE_LABEL: Record<WorkType, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  any: "Any",
};

export default function ClientProfilePage() {
  const { client } = useClientPortal();
  const { documentsById } = useStore();
  const p = client.preferences;
  const q = client.questionnaire;

  // Same document record the team sees in the workspace Documents tab.
  const [baseDocs, setBaseDocs] = useState<ClientDocument[]>([]);
  useEffect(() => {
    api.getDocuments(client.id).then(setBaseDocs);
  }, [client.id]);
  const docs = effectiveDocuments(baseDocs, documentsById[client.id]);
  const byKind = new Map(docs.map((d) => [d.kind, d]));

  const salary =
    p?.salaryMin || p?.salaryMax
      ? `$${((p.salaryMin ?? 0) / 1000).toFixed(0)}k – $${((p.salaryMax ?? 0) / 1000).toFixed(0)}k`
      : "—";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight">Your profile</h1>
        <p className="mt-1 text-[14px] text-muted">
          What we know about you and what we’re looking for.
        </p>
      </header>

      <Section title="Basic information">
        <Row label="Name" value={client.name} />
        <Row label="Service tier" value={client.tier} />
        <Row label="Your Job Helper" value={client.ownerName} />
        <Row
          label="Job approval"
          value={
            client.approvalRequired
              ? "You review jobs before we apply"
              : "We apply on your behalf"
          }
        />
      </Section>

      {p && (
        <Section title="What we're searching for">
          <Row label="Roles" value={p.titles.join(", ")} />
          <Row label="Locations" value={p.locations.join(", ")} />
          <Row label="Work style" value={WORK_TYPE_LABEL[p.workType]} />
          <Row label="Target salary" value={salary} />
        </Section>
      )}

      <Section title="Documents">
        <div className="divide-y divide-panel-border">
          {DOCUMENT_KINDS.map((kind) => {
            const doc = byKind.get(kind);
            return (
              <div key={kind} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[13px]">{DOCUMENT_KIND_LABEL[kind]}</span>
                  {doc && (
                    <p className="truncate text-[11px] text-muted">
                      {doc.fileName} · {doc.uploadedAt}
                    </p>
                  )}
                </div>
                {doc ? (
                  <span className="rounded-full bg-status-offer/15 px-2 py-0.5 text-[10px] font-semibold text-status-offer">
                    Uploaded
                  </span>
                ) : (
                  <span className="rounded-full border border-panel-border px-2 py-0.5 text-[10px] font-semibold text-muted">
                    Missing
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {q && (
          <div className="mt-3 flex items-center justify-between border-t border-panel-border pt-3">
            <p className="text-[12.5px] text-muted">
              Questionnaire: {QUESTIONNAIRE_LABEL[q.status]}
            </p>
            {q.token && q.status !== "completed" && (
              <Link href={`/q/${q.token}`}>
                <Button variant="secondary" size="sm">
                  Continue questionnaire
                </Button>
              </Link>
            )}
          </div>
        )}
      </Section>

      <p className="text-[12px] text-muted">
        Need to update something? Message{" "}
        <span className="font-medium text-foreground">{client.ownerName}</span>,
        your Job Helper, and we’ll take care of it.
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
        {title}
      </h2>
      <Panel className="p-4">{children}</Panel>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="text-right text-[13px]">{value}</span>
    </div>
  );
}
