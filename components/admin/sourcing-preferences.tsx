"use client";

// Sourcing preferences — the short matching profile the JS team sources against.
// Staff-editable and persisted; salary + locations can be pulled from a completed
// questionnaire (the fields that map cleanly). Titles / work type / sources are
// staff judgment. Separate from the full CQFO "response profile".

import { useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { Button } from "@/components/ui/button";
import {
  JOB_SOURCE_LABEL,
  type Client,
  type ClientPreferences,
  type JobSource,
  type WorkType,
} from "@/lib/api";
import { canEditClient } from "@/lib/permissions";
import { deriveFromCqfo } from "@/lib/cqfo-derive";

const EMPTY: ClientPreferences = {
  titles: [],
  locations: [],
  workType: "any",
  sources: [],
};

const WORK_TYPES: WorkType[] = ["remote", "hybrid", "onsite", "any"];

function salaryRange(min?: number, max?: number) {
  const k = (n?: number) => (n ? `$${Math.round(n / 1000)}k` : "");
  if (!min && !max) return "—";
  return `${k(min)}–${k(max)}`;
}

export function SourcingPreferences({ client }: { client: Client }) {
  const { user } = useCurrentUser();
  const { preferencesById, questionnaireById, setPreferences, logAudit } =
    useStore();
  const prefs = preferencesById[client.id] ?? client.preferences ?? EMPTY;
  const canEdit = canEditClient(user, client.ownerId);
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Sourcing preferences
        </p>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <EditForm
          client={client}
          initial={prefs}
          onCancel={() => setEditing(false)}
          onSave={(p) => {
            setPreferences(client.id, p);
            logAudit(user.name, "Updated sourcing preferences", client.name);
            setEditing(false);
          }}
          token={questionnaireById[client.id]?.token ?? client.questionnaire?.token}
        />
      ) : (
        <div className="mt-2 divide-y divide-panel-border/20">
          <Row label="Target titles">
            <Chips values={prefs.titles} empty="Not set" />
          </Row>
          <Row label="Locations">
            <Chips values={prefs.locations} empty="Not set" />
          </Row>
          <Row label="Work type">
            <span className="text-[12.5px] capitalize text-zinc-200">
              {prefs.workType}
            </span>
          </Row>
          <Row label="Salary">
            <span className="text-[12.5px] text-zinc-200">
              {salaryRange(prefs.salaryMin, prefs.salaryMax)}
            </span>
          </Row>
          <Row label="Sources">
            <span className="text-[12.5px] text-zinc-200">
              {prefs.sources.length
                ? prefs.sources.map((s) => JOB_SOURCE_LABEL[s]).join(", ")
                : "Not set"}
            </span>
          </Row>
        </div>
      )}
    </div>
  );
}

function EditForm({
  client,
  initial,
  token,
  onSave,
  onCancel,
}: {
  client: Client;
  initial: ClientPreferences;
  token?: string;
  onSave: (p: ClientPreferences) => void;
  onCancel: () => void;
}) {
  const [titles, setTitles] = useState(initial.titles.join(", "));
  const [locations, setLocations] = useState(initial.locations.join(", "));
  const [workType, setWorkType] = useState<WorkType>(initial.workType);
  const [salaryMin, setSalaryMin] = useState(initial.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(initial.salaryMax?.toString() ?? "");
  const [sources, setSources] = useState<JobSource[]>(initial.sources);
  const [pullNote, setPullNote] = useState<string | null>(null);

  function pullFromQuestionnaire() {
    const d = deriveFromCqfo(token);
    if (!d) {
      setPullNote("No usable answers yet — the client hasn't completed the salary/location questions.");
      return;
    }
    if (d.salaryMin) setSalaryMin(String(d.salaryMin));
    if (d.salaryMax) setSalaryMax(String(d.salaryMax));
    if (d.locations) setLocations(d.locations.join(", "));
    setPullNote("Pulled salary and locations from the questionnaire.");
  }

  function toggleSource(s: JobSource) {
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function save() {
    const toList = (v: string) =>
      v.split(",").map((x) => x.trim()).filter(Boolean);
    onSave({
      titles: toList(titles),
      locations: toList(locations),
      workType,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      sources,
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <Labeled label="Target titles" hint="comma-separated">
        <Input value={titles} onChange={setTitles} placeholder="Senior PM, Product Lead" />
      </Labeled>
      <Labeled label="Locations" hint="comma-separated">
        <Input value={locations} onChange={setLocations} placeholder="Remote (US), New York, NY" />
      </Labeled>
      <div className="grid grid-cols-2 gap-3">
        <Labeled label="Work type">
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value as WorkType)}
            className="w-full rounded-md border border-panel-border bg-panel px-2.5 py-1.5 text-[12.5px] capitalize text-zinc-200 outline-none focus:border-zinc-600"
          >
            {WORK_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label="Salary (min / max)">
          <div className="flex items-center gap-1.5">
            <Input value={salaryMin} onChange={setSalaryMin} placeholder="170000" />
            <span className="text-zinc-600">–</span>
            <Input value={salaryMax} onChange={setSalaryMax} placeholder="220000" />
          </div>
        </Labeled>
      </div>
      <Labeled label="Sources">
        <div className="flex gap-3">
          {(Object.keys(JOB_SOURCE_LABEL) as JobSource[]).map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-[12.5px] text-zinc-300">
              <input
                type="checkbox"
                checked={sources.includes(s)}
                onChange={() => toggleSource(s)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              {JOB_SOURCE_LABEL[s]}
            </label>
          ))}
        </div>
      </Labeled>

      <div className="flex items-center justify-between border-t border-panel-border pt-3">
        <button
          onClick={pullFromQuestionnaire}
          className="text-[11.5px] font-semibold text-[var(--accent)] hover:underline"
        >
          ↓ Pull salary &amp; locations from questionnaire
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={save}>
            Save
          </Button>
        </div>
      </div>
      {pullNote && <p className="text-[11px] text-muted">{pullNote}</p>}
    </div>
  );
}

// ── pieces ────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2 flex items-baseline justify-between gap-4 border-b border-panel-border/20 last:border-b-0">
      <span className="text-[11.5px] text-muted">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function Chips({ values, empty }: { values: string[]; empty: string }) {
  if (!values.length) return <span className="text-[12.5px] text-zinc-500">{empty}</span>;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {values.map((v) => (
        <span
          key={v}
          className="rounded-md border border-panel-border px-1.5 py-0.5 text-[11px] text-zinc-300"
        >
          {v}
        </span>
      ))}
    </div>
  );
}

function Labeled({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
        {hint && <span className="font-normal lowercase tracking-normal text-zinc-600">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
