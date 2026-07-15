"use client";

// Global Quick-Add job slide-over (replaces the old search tray; opened with S).
// Pick a client, then add manually or import. Since there's no shared job store
// yet, a successful add shows a confirmation with a link into the workspace.

import Link from "next/link";
import { useEffect, useState } from "react";
import { AddJobsForm } from "@/components/admin/add-jobs-form";
import { api, type ApplicationJob, type Client } from "@/lib/api";

export function QuickAdd({ onClose }: { onClose: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [added, setAdded] = useState<{ count: number; client: Client } | null>(
    null,
  );

  useEffect(() => {
    api.getClients().then((cs) => {
      setClients(cs);
      setClientId(cs[0]?.id ?? "");
    });
  }, []);

  const client = clients.find((c) => c.id === clientId);

  function handleAdd(jobs: ApplicationJob[]) {
    if (client) setAdded({ count: jobs.length, client });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        className="flex h-full w-[380px] flex-col border-l border-panel-border bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">Add a job</h2>
          <button
            onClick={onClose}
            className="text-[12px] text-muted hover:text-zinc-200"
          >
            Esc
          </button>
        </div>

        {added ? (
          <div className="mt-6">
            <p className="text-[13px] text-status-offer">
              Added {added.count} {added.count === 1 ? "job" : "jobs"} to{" "}
              {added.client.name}&apos;s shortlist.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/admin/clients/${added.client.id}`}
                onClick={onClose}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                Open workspace
              </Link>
              <button
                onClick={() => setAdded(null)}
                className="rounded-md border border-zinc-700 px-3 py-1.5 text-[12px] font-semibold text-zinc-200 hover:bg-zinc-800/60"
              >
                Add more
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1.5 mb-4 w-full rounded-md border border-panel-border bg-panel px-2.5 py-1.5 text-[12.5px] text-zinc-200 outline-none focus:border-zinc-600"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.tier}
                </option>
              ))}
            </select>

            {client && (
              <div className="space-y-4">
                <AddJobsForm
                  clientId={client.id}
                  clientName={client.name}
                  onAdd={handleAdd}
                />
                <div className="border-t border-panel-border pt-4">
                  <Link
                    href={`/admin/clients/${client.id}?tab=load`}
                    onClick={onClose}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-panel-border bg-panel/50 py-2 text-[12px] font-semibold text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Go to CSV / Bulk Loader tab
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
