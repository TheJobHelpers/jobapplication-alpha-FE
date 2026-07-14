"use client";

// Client portal data layer. Loads the signed-in client + their jobs from the
// backend (/me/*), then layers this session's optimistic status overlay on top.
// Decisions (accept / decline-with-reason / undo) POST to /me/jobs/{id}/* so the
// backend persists them (the team's pipeline reads the same server truth), and
// mirror into the shared overlay for instant feedback. Everything a client
// screen needs comes from useClientPortal(), so pages stay declarative.

import { createContext, useContext, useEffect, useState } from "react";
import { applyJobOverride, useStore } from "@/components/shell/store-context";
import {
  api,
  REJECT_CATEGORY_LABEL,
  type ApplicationJob,
  type Client,
  type RejectCategory,
} from "@/lib/api";

interface ClientPortalCtx {
  client: Client;
  jobs: ApplicationJob[]; // with this session's optimistic decisions applied
  reviewQueue: ApplicationJob[]; // still awaiting the client's decision
  approve: (jobId: string) => void;
  reject: (jobId: string, category: RejectCategory, reason: string) => void;
  undo: (jobId: string) => void; // revert a just-made decision
}

const Ctx = createContext<ClientPortalCtx | null>(null);

export function ClientPortalProvider({
  children,
}: {
  clientId: string; // kept for the gate's call site; /me derives it from the session
  children: React.ReactNode;
}) {
  const [data, setData] = useState<{
    client: Client;
    jobs: ApplicationJob[];
  } | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([api.me.getClient(), api.me.getJobs()]).then(([client, jobs]) => {
      if (alive && client) setData({ client, jobs });
    });
    return () => {
      alive = false;
    };
  }, []);

  // The shared overlay carries team moves AND the client's own optimistic
  // decisions; the backend is the durable source of truth for both.
  const { jobStatusById, jobMetaById, applyLocalJobStatus, logAudit } = useStore();

  if (!data) return <CenterLoader />;

  const jobs = data.jobs.map((j) => applyJobOverride(j, jobStatusById, jobMetaById));
  const reviewQueue = jobs.filter((j) => j.status === "client_review");

  const clientName = data.client.name;
  const entity = (jobId: string) => {
    const j = data.jobs.find((x) => x.id === jobId);
    return j ? `${j.company} · ${j.title}` : jobId;
  };

  const value: ClientPortalCtx = {
    client: data.client,
    jobs,
    reviewQueue,
    approve: (jobId) => {
      applyLocalJobStatus(jobId, "approved");
      logAudit(clientName, "Accepted job", entity(jobId));
      api.me.acceptJob(jobId).catch((e) => console.error("accept failed:", e));
    },
    reject: (jobId, category, reason) => {
      applyLocalJobStatus(jobId, "rejected", { reason, rejectCategory: category });
      logAudit(
        clientName,
        `Declined job (${REJECT_CATEGORY_LABEL[category]})`,
        entity(jobId),
      );
      api.me
        .declineJob(jobId, category, reason)
        .catch((e) => console.error("decline failed:", e));
    },
    undo: (jobId) => {
      // Back to "awaiting review" explicitly (a bare clear would regress a job
      // whose review state came from a server value, not an overlay).
      applyLocalJobStatus(jobId, "client_review", {});
      logAudit(clientName, "Reverted decision", entity(jobId));
      api.me.undoDecision(jobId).catch((e) => console.error("undo failed:", e));
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClientPortal(): ClientPortalCtx {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useClientPortal must be used within <ClientPortalProvider>");
  return ctx;
}

function CenterLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-muted">
      Loading your portal…
    </div>
  );
}
