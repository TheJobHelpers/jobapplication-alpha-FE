"use client";

// Shared "Add jobs" form — search is not a portal feature (note 09), so jobs
// enter here by Manual entry or Bulk import. API / extension / agentic sourcing
// are shown as coming-soon. Used by the Client Workspace panel and the global
// Quick-Add slide-over. Calls onAdd with the constructed jobs (status=sourced).

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/ui/match-score";
import { api, TODAY, type ApplicationJob } from "@/lib/api";

type Mode = "manual" | "import" | "soon";

function newId() {
  return `add_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

// "Title @ Company | Location | Salary" — one per line.
function parseRows(text: string, clientId: string, clientName: string): ApplicationJob[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line): ApplicationJob | null => {
      const [head, location, salary] = line.split("|").map((s) => s.trim());
      const [title, company] = head.split("@").map((s) => s.trim());
      if (!title) return null;
      return {
        id: newId(),
        clientId,
        clientName,
        company: company || "—",
        title,
        location: location || "—",
        salary: salary || undefined,
        status: "sourced",
        addedVia: "import",
        updatedAt: TODAY,
      };
    })
    .filter((j): j is ApplicationJob => j !== null);
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
  const [mode, setMode] = useState<Mode>("manual");

  return (
    <div>
      <div className="flex gap-1 rounded-md border border-panel-border p-0.5 text-[12px]">
        <ModeTab active={mode === "manual"} onClick={() => setMode("manual")}>
          Manual
        </ModeTab>
        <ModeTab active={mode === "import"} onClick={() => setMode("import")}>
          Import
        </ModeTab>
        <ModeTab active={mode === "soon"} onClick={() => setMode("soon")}>
          More
        </ModeTab>
      </div>

      <div className="mt-4">
        {mode === "manual" && (
          <ManualEntry
            clientId={clientId}
            clientName={clientName}
            onAdd={onAdd}
          />
        )}
        {mode === "import" && (
          <BulkImport
            clientId={clientId}
            clientName={clientName}
            onAdd={onAdd}
          />
        )}
        {mode === "soon" && <ComingSoonSources />}
      </div>
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
      <p className="text-[11px] text-zinc-500">
        Paste a job URL into the title for now; parsing lands with the extension.
      </p>
    </div>
  );
}

function BulkImport({
  clientId,
  clientName,
  onAdd,
}: {
  clientId: string;
  clientName: string;
  onAdd: (jobs: ApplicationJob[]) => void;
}) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ApplicationJob[]>([]);

  async function loadSample() {
    const sample = await api.getImportSample(clientId);
    setPreview(sample);
  }

  function parsePasted() {
    setPreview(parseRows(text, clientId, clientName));
  }

  return (
    <div className="space-y-2.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={"Paste rows, one per line:\nTitle @ Company | Location | Salary"}
        className="w-full resize-none rounded-md border border-panel-border bg-transparent px-2.5 py-2 text-[12.5px] outline-none placeholder:text-zinc-600 focus:border-zinc-600"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={parsePasted} disabled={!text.trim()}>
          Preview paste
        </Button>
        <Button size="sm" onClick={loadSample}>
          Load sample batch
        </Button>
      </div>

      {preview.length > 0 && (
        <div className="rounded-md border border-panel-border">
          <div className="max-h-40 divide-y divide-panel-border overflow-y-auto">
            {preview.map((j) => (
              <div key={j.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-zinc-200">{j.title}</p>
                  <p className="truncate text-[11px] text-muted">
                    {j.company} · {j.location}
                  </p>
                </div>
                <MatchScore score={j.matchScore} />
              </div>
            ))}
          </div>
          <div className="border-t border-panel-border p-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                onAdd(preview);
                setPreview([]);
                setText("");
              }}
            >
              Import {preview.length} to shortlist
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoonSources() {
  const items = [
    { name: "API sync", blurb: "External sourcing tools push jobs in automatically." },
    { name: "Browser extension", blurb: "One-click capture from a job board into a client." },
    { name: "Agentic sourcing", blurb: "An agent sources and pre-scores matches for review." },
  ];
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div
          key={i.name}
          className="flex items-center justify-between rounded-md border border-panel-border px-3 py-2.5"
        >
          <div>
            <p className="text-[12.5px] text-zinc-300">{i.name}</p>
            <p className="text-[11px] text-muted">{i.blurb}</p>
          </div>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
            Soon
          </span>
        </div>
      ))}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 rounded px-2 py-1 font-medium transition-colors " +
        (active
          ? "bg-[var(--accent)] text-white"
          : "text-muted hover:text-zinc-200")
      }
    >
      {children}
    </button>
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
