"use client";

// Shared "Add jobs" form — search is not a portal feature (note 09), so jobs
// enter here by Manual entry or Bulk import. API / extension / agentic sourcing
// are shown as coming-soon. Used by the Client Workspace panel and the global
// Quick-Add slide-over. Calls onAdd with the constructed jobs (status=sourced).

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/ui/match-score";
import { api, TODAY, type ApplicationJob } from "@/lib/api";

function newId() {
  return `add_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export function AddJobsForm({
  clientId,
  clientName,
  onAdd,
}: {
  clientId: string;
  clientName: string;
  onAdd: (jobs: ApplicationJob[]) => void;
}) {
  // Persist the draft rows to the backend, then hand the CREATED jobs (real
  // ids) up so the shortlist / pipeline operate on rows the API knows about.
  async function persistAndAdd(drafts: ApplicationJob[]) {
    try {
      const created = await api.createJobs(
        drafts.map((d) => ({
          clientId,
          company: d.company,
          title: d.title,
          location: d.location,
          salary: d.salary,
          matchScore: d.matchScore,
          status: d.status,
          addedVia: d.addedVia,
        })),
      );
      onAdd(created);
    } catch (e) {
      console.error("Add jobs failed:", e);
    }
  }

  return (
    <div>
      <ManualEntry
        clientId={clientId}
        clientName={clientName}
        onAdd={persistAndAdd}
      />
    </div>
  );
}

function ManualEntry({
  clientId,
  clientName,
  onAdd,
}: {
  clientId: string;
  clientName: string;
  onAdd: (jobs: ApplicationJob[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");

  const canAdd = title.trim() && company.trim();

  function submit() {
    if (!canAdd) return;
    onAdd([
      {
        id: newId(),
        clientId,
        clientName,
        company: company.trim(),
        title: title.trim(),
        location: location.trim() || "—",
        salary: salary.trim() || undefined,
        status: "sourced",
        addedVia: "manual",
        updatedAt: TODAY,
      },
    ]);
    setTitle("");
    setCompany("");
    setLocation("");
    setSalary("");
  }

  return (
    <div className="space-y-2.5">
      <Input value={title} onChange={setTitle} placeholder="Job title *" />
      <Input value={company} onChange={setCompany} placeholder="Company *" />
      <div className="flex gap-2">
        <Input value={location} onChange={setLocation} placeholder="Location" />
        <Input value={salary} onChange={setSalary} placeholder="Salary" />
      </div>
      <Button
        variant="primary"
        className="w-full"
        onClick={submit}
        disabled={!canAdd}
      >
        Add to shortlist
      </Button>
      <div className="border-t border-panel-border mt-4 pt-3.5 space-y-2 text-[11px] text-zinc-500">
        <p>
          Paste a job URL into the title for now; parsing lands with the extension.
        </p>
        <div className="bg-panel-border/20 rounded p-2 border border-panel-border text-zinc-400">
          💡 Need to import a CSV file or paste many jobs at once? Use the <span className="font-semibold text-zinc-200">Load Jobs</span> tab in the main tab list above.
        </div>
      </div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-panel-border bg-transparent px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-zinc-600 focus:border-zinc-600"
    />
  );
}
