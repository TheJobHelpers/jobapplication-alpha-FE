"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { LoadJobsTab } from "@/components/admin/load-jobs-tab";
import { SourcingPreferences } from "@/components/admin/sourcing-preferences";
import { Panel } from "@/components/ui/panel";
import { api, type Client, type ApplicationJob } from "@/lib/api";

export default function AddJobPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);

  useEffect(() => {
    api.getClients()
      .then((cs) => {
        setClients(cs);
        if (cs.length > 0) {
          setClientId(cs[0].id);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === clientId);
  }, [clients, clientId]);

  const handleJobsAdded = (jobs: ApplicationJob[]) => {
    setLastImportCount(jobs.length);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-8">
        <p className="text-[13px] text-muted">Loading clients list…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Global Actions
        </p>
        <h1 className="mt-1 text-[20px] font-semibold text-zinc-100">Add job</h1>
        <p className="mt-1 text-xs text-muted leading-relaxed max-w-xl">
          Sourced outside the portal — select a client, reference their sourcing preferences, and load jobs via Manual Entry, CSV, or Bulk Paste.
        </p>
      </header>

      {/* Select Client Dropdown */}
      <Panel className="p-5 mb-6">
        <div className="max-w-md">
          <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted block mb-1.5">
            Select Target Client Workspace
          </label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setLastImportCount(null);
            }}
            className="w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-500 transition-colors"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.tier} ({c.ownerName})
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {selectedClient ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] items-start gap-6">
          {/* Sourcing / Uploader cockpit */}
          <div className="space-y-6">
            {lastImportCount !== null && (
              <div className="rounded-lg border border-status-offer/30 bg-status-offer/10 p-4 text-xs text-status-offer flex items-center justify-between gap-3 animate-[fadein_.2s_ease]">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Added {lastImportCount} job{lastImportCount > 1 ? "s" : ""} to {selectedClient.name}&apos;s active shortlist!
                </span>
                <Link
                  href={`/admin/clients/${selectedClient.id}`}
                  className="rounded bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[var(--accent-strong)] transition-colors shrink-0"
                >
                  Open Workspace
                </Link>
              </div>
            )}

            <LoadJobsTab
              key={selectedClient.id}
              client={selectedClient}
              onAdd={handleJobsAdded}
            />
          </div>

          {/* Sourcing preferences side reference card */}
          <aside className="space-y-6 lg:sticky lg:top-8">
            <Panel className="p-5">
              <SourcingPreferences client={selectedClient} />
            </Panel>
            <Panel className="p-5">
              <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">
                Need Help Sourcing?
              </h4>
              <p className="text-[12px] text-zinc-400 leading-relaxed">
                Make sure the title and company columns match the client's targets. The system computes match scores automatically upon import.
              </p>
            </Panel>
          </aside>
        </div>
      ) : (
        <p className="text-zinc-500 text-sm">Please create a client first in the clients list page.</p>
      )}
    </div>
  );
}
