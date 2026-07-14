"use client";

// Resolves a client from the local store (UI-created) first, then fixtures, so
// freshly-onboarded clients open correctly. Replaced by a server fetch once the
// backend exists.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientWorkspace } from "@/components/admin/client-workspace";
import { applyJobOverride, useStore } from "@/components/shell/store-context";
import { Panel } from "@/components/ui/panel";
import { api, type ApplicationJob, type Client } from "@/lib/api";

type Resolved =
  | { state: "loading" }
  | { state: "notfound" }
  | { state: "ready"; client: Client; jobs: ApplicationJob[] };

export function ClientWorkspaceLoader() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { clients: created, jobStatusById, jobMetaById } = useStore();
  const [res, setRes] = useState<Resolved>({ state: "loading" });

  useEffect(() => {
    const local = created.find((c) => c.id === id);
    if (local) {
      setRes({ state: "ready", client: local, jobs: [] });
      return;
    }
    let alive = true;
    api.getClient(id).then((client) => {
      if (!alive) return;
      if (!client) {
        setRes({ state: "notfound" });
        return;
      }
      api.getJobsForClient(id).then((jobs) => {
        if (alive) setRes({ state: "ready", client, jobs });
      });
    });
    return () => {
      alive = false;
    };
  }, [id, created]);

  if (res.state === "loading") {
    return <p className="px-8 py-10 text-[13px] text-muted">Loading…</p>;
  }
  if (res.state === "notfound") {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16">
        <Panel className="p-8 text-center">
          <p className="text-[13px] font-semibold text-zinc-200">
            Client not found.
          </p>
          <Link
            href="/admin/clients"
            className="mt-3 inline-block text-[12.5px] text-[var(--accent)]"
          >
            ← Back to clients
          </Link>
        </Panel>
      </div>
    );
  }
  // Pipeline moves and client decisions persist in the store; apply them so
  // the workspace opens on the same truth the board (and the client) sees —
  // client declines land in History with their reason, feeding the taste panel.
  const jobs = res.jobs.map((j) =>
    applyJobOverride(j, jobStatusById, jobMetaById),
  );
  return <ClientWorkspace client={res.client} initialJobs={jobs} />;
}
