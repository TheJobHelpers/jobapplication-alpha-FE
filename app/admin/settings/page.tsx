"use client";

// Admin — settings & audit. Admins get everything; managers the quotas slice.
// Fetched client-side (cookie-scoped). The audit endpoint is admin-only, so
// managers 403 on it — tolerated (SettingsView hides the audit section for them).

import { useEffect, useState } from "react";
import { PageLoader } from "@/components/admin/page-loader";
import { SettingsView } from "@/components/admin/settings-view";
import { api, type AuditEntry, type QuotaTier, type TeamMember } from "@/lib/api";

export default function SettingsPage() {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [tiers, setTiers] = useState<QuotaTier[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => {
    api.getTeam().then(setTeam).catch(() => setTeam([]));
    api.getQuotaTiers().then(setTiers).catch(() => setTiers([]));
    // Admin-only; managers 403 here and just don't see the audit section.
    api.getAuditLog().then(setAudit).catch(() => setAudit([]));
  }, []);

  if (!team) return <PageLoader />;
  return <SettingsView team={team} audit={audit} tiers={tiers} />;
}
