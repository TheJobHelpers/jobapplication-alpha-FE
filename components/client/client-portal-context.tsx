"use client";

// Client portal data layer. Loads the signed-in client + their jobs from the
// mock API, then layers the shared store's status overrides on top. Decisions
// (accept / decline-with-reason) write to the SAME store the internal portal
// reads, so the team's pipeline sees an acceptance the moment it happens —
// that's the flow: review → accepted → team applies. Everything a client
// screen needs comes from useClientPortal(), so pages stay declarative.

import { createContext, useContext, useEffect, useState } from "react";
import { applyJobOverride, useStore } from "@/components/shell/store-context";
import {
  api,
  REJECT_CATEGORY_LABEL,
  type ApplicationJob,
  type Client,
  type JobStatus,
  type RejectCategory,
} from "@/lib/api";
import { CLIENT_DECISIONS_KEY, useSession, writeSession } from "@/lib/session";

interface Decision {
  status: "approved" | "rejected";
  category?: RejectCategory;
  reason?: string;
  at: string;
}
type Decisions = Record<string, Decision>;

interface ClientPortalCtx {
  client: Client;
  jobs: ApplicationJob[]; // with the client's decisions applied
  reviewQueue: ApplicationJob[]; // still awaiting the client's decision
  approve: (jobId: string) => void;
  reject: (jobId: string, category: RejectCategory, reason: string) => void;
  undo: (jobId: string) => void; // revert a just-made decision
}

const Ctx = createContext<ClientPortalCtx | null>(null);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function safeParse(raw: string | null | undefined): Decisions {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Decisions;
  } catch {
    return {};
  }
}

function applyDecision(job: ApplicationJob, d?: Decision): ApplicationJob {
  if (!d) return job;
  if (d.status === "approved") {
    return { ...job, status: "approved" as JobStatus };
  }
  return {
    ...job,
    status: "rejected" as JobStatus,
    rejectCategory: d.category,
    reason: d.reason,
  };
}

export function ClientPortalProvider({
  clientId,
  children,
}: {
  clientId: string;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<{
    client: Client;
    jobs: ApplicationJob[];
  } | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.getClient(clientId),
      api.getJobsForClient(clientId),
    ]).then(([client, jobs]) => {
      if (alive && client) setData({ client, jobs });
    });
    return () => {
      alive = false;
    };
  }, [clientId]);

  const decisions = safeParse(useSession(CLIENT_DECISIONS_KEY));
  // The shared store carries team moves (assigned → applying → applied → …)
  // AND the client's own decisions, so both portals read one truth. The
  // session-stored decisions remain as a fallback for records made before the
  // store carried them.
  const { jobStatusById, jobMetaById, setJobStatus, logAudit } = useStore();

  if (!data) return <CenterLoader />;

  const jobs = data.jobs.map((j) => {
    if (jobStatusById[j.id])
      return applyJobOverride(j, jobStatusById, jobMetaById);
    return applyDecision(j, decisions[j.id]);
  });
  const reviewQueue = jobs.filter((j) => j.status === "client_review");

  function persist(next: Decisions) {
    writeSession(CLIENT_DECISIONS_KEY, JSON.stringify(next));
  }

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
      persist({ ...decisions, [jobId]: { status: "approved", at: today() } });
      setJobStatus(jobId, "approved");
      logAudit(clientName, "Accepted job", entity(jobId));
    },
    reject: (jobId, category, reason) => {
      persist({
        ...decisions,
        [jobId]: { status: "rejected", category, reason, at: today() },
      });
      setJobStatus(jobId, "rejected", { reason, rejectCategory: category });
      logAudit(
        clientName,
        `Declined job (${REJECT_CATEGORY_LABEL[category]})`,
        entity(jobId),
      );
    },
    undo: (jobId) => {
      const next = { ...decisions };
      delete next[jobId];
      persist(next);
      // Back to "awaiting review" explicitly (not a bare clear) — the job may
      // only have been in review via a store override in the first place.
      setJobStatus(jobId, "client_review", {});
      logAudit(clientName, "Reverted decision", entity(jobId));
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
