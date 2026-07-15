"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { MatchScore } from "@/components/ui/match-score";
import { api, TODAY, type ApplicationJob, type Client } from "@/lib/api";

type Mode = "manual" | "csv" | "paste";

function newId() {
  return `load_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export function LoadJobsTab({
  client,
  onAdd,
}: {
  client: Client;
  onAdd: (jobs: ApplicationJob[]) => void;
}) {
  const [mode, setMode] = useState<Mode>("manual");
  const [text, setText] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ApplicationJob[]>([]);
  const [importing, setImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setPreview([]);
    setSuccessCount(null);
    setText("");
    setCsvFile(null);
  };

  // CSV parsing logic
  const parseCSV = (textStr: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < textStr.length; i++) {
      const char = textStr[i];
      const nextChar = textStr[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(cell.trim());
        cell = "";
      } else if ((char === "\r" || char === "\n") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
        row.push(cell.trim());
        lines.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    if (cell || row.length > 0) {
      row.push(cell.trim());
      lines.push(row);
    }
    return lines.filter((r) => r.length > 0 && r.some((c) => c !== ""));
  };

  const mapHeaders = (headers: string[]) => {
    let titleIdx = -1;
    let companyIdx = -1;
    let locationIdx = -1;
    let salaryIdx = -1;

    headers.forEach((h, idx) => {
      const cleaned = h.toLowerCase().trim();
      if (cleaned.includes("title") || cleaned.includes("job") || cleaned === "role" || cleaned === "position") {
        if (titleIdx === -1) titleIdx = idx;
      } else if (cleaned.includes("company") || cleaned === "employer" || cleaned === "org" || cleaned === "organization") {
        if (companyIdx === -1) companyIdx = idx;
      } else if (cleaned.includes("location") || cleaned === "city" || cleaned === "state" || cleaned === "country") {
        if (locationIdx === -1) locationIdx = idx;
      } else if (cleaned.includes("salary") || cleaned === "pay" || cleaned.includes("comp") || cleaned === "wage" || cleaned.includes("rate")) {
        if (salaryIdx === -1) salaryIdx = idx;
      }
    });

    if (titleIdx === -1 && headers.length > 0) titleIdx = 0;
    if (companyIdx === -1 && headers.length > 1) companyIdx = 1;
    if (locationIdx === -1 && headers.length > 2) locationIdx = 2;
    if (salaryIdx === -1 && headers.length > 3) salaryIdx = 3;

    return { titleIdx, companyIdx, locationIdx, salaryIdx };
  };

  const processCsvFile = (file: File) => {
    setCsvFile(file);
    setSuccessCount(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      if (!contents) return;

      const lines = parseCSV(contents);
      if (lines.length <= 1) {
        alert("The CSV file seems to be empty or contains no headers.");
        return;
      }

      const headers = lines[0];
      const dataRows = lines.slice(1);
      const headersMap = mapHeaders(headers);

      const parsedJobs = dataRows.map((row, idx): ApplicationJob => {
        const title = headersMap.titleIdx !== -1 && row[headersMap.titleIdx] ? row[headersMap.titleIdx] : "";
        const company = headersMap.companyIdx !== -1 && row[headersMap.companyIdx] ? row[headersMap.companyIdx] : "";
        const location = headersMap.locationIdx !== -1 && row[headersMap.locationIdx] ? row[headersMap.locationIdx] : "";
        const salary = headersMap.salaryIdx !== -1 && row[headersMap.salaryIdx] ? row[headersMap.salaryIdx] : "";

        return {
          id: `csv_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
          clientId: client.id,
          clientName: client.name,
          title: title.trim(),
          company: company.trim(),
          location: location.trim() || "—",
          salary: salary.trim() || undefined,
          status: "sourced",
          addedVia: "import",
          updatedAt: TODAY,
          matchScore: Math.floor(Math.random() * 29) + 70, // 70 to 98
        };
      });

      setPreview(parsedJobs);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCsvFile(file);
    }
  };

  // Bulk paste logic
  const parsePastedRows = (textStr: string): ApplicationJob[] => {
    return textStr
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line, idx): ApplicationJob | null => {
        const [head, location, salary] = line.split("|").map((s) => s.trim());
        const [title, company] = head.split("@").map((s) => s.trim());
        if (!title) return null;
        return {
          id: `paste_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
          clientId: client.id,
          clientName: client.name,
          company: company || "—",
          title,
          location: location || "—",
          salary: salary || undefined,
          status: "sourced",
          addedVia: "import",
          updatedAt: TODAY,
          matchScore: Math.floor(Math.random() * 29) + 70,
        };
      })
      .filter((j): j is ApplicationJob => j !== null);
  };

  const handlePreviewPaste = () => {
    setSuccessCount(null);
    setPreview(parsePastedRows(text));
  };

  // Persist jobs to API shortlist
  const handleImport = async (jobsToImport?: ApplicationJob[]) => {
    const targets = jobsToImport || preview;
    if (targets.length === 0) return;
    setImporting(true);
    try {
      const validJobs = targets.filter((j) => j.title.trim() && j.company.trim() && j.company !== "—");
      if (validJobs.length === 0) {
        alert("No valid jobs to import. Please make sure Job Title and Company are filled.");
        setImporting(false);
        return;
      }

      const created = await api.createJobs(
        validJobs.map((d) => ({
          clientId: client.id,
          company: d.company,
          title: d.title,
          location: d.location,
          salary: d.salary,
          matchScore: d.matchScore,
          status: d.status,
          addedVia: d.addedVia,
        }))
      );
      onAdd(created);
      setPreview([]);
      setSuccessCount(created.length);
      setText("");
      setCsvFile(null);
    } catch (e) {
      console.error("Import failed:", e);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mt-4 space-y-5 animate-[fadein_.15s_ease]">
      <div className="flex gap-4">
        {/* Toggle Mode */}
        <div className="flex gap-1 rounded-md border border-panel-border bg-panel/30 p-0.5 text-[12px] w-80">
          <button
            onClick={() => handleModeChange("manual")}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "manual" ? "bg-[var(--accent)] text-white" : "text-muted hover:text-zinc-200"
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => handleModeChange("csv")}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "csv" ? "bg-[var(--accent)] text-white" : "text-muted hover:text-zinc-200"
            }`}
          >
            CSV Upload
          </button>
          <button
            onClick={() => handleModeChange("paste")}
            className={`flex-1 rounded px-3 py-1.5 font-medium transition-colors ${
              mode === "paste" ? "bg-[var(--accent)] text-white" : "text-muted hover:text-zinc-200"
            }`}
          >
            Bulk Paste
          </button>
        </div>
      </div>

      <Panel className="p-5">
        {mode === "manual" && (
          <ManualEntryForm
            clientId={client.id}
            clientName={client.name}
            onAdd={(jobs) => handleImport(jobs)}
            disabled={importing}
          />
        )}
        {mode === "csv" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-panel-border rounded-xl p-8 bg-background/25 hover:border-zinc-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <svg
                className="w-8 h-8 text-muted mb-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
              <p className="text-[13px] text-zinc-200 font-medium">
                {csvFile ? `Selected: ${csvFile.name}` : "Upload job roster CSV file"}
              </p>
              <p className="text-[11px] text-muted mt-1">Supports column headers (Title, Company, Location, Salary)</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                {csvFile ? "Choose different file" : "Select CSV file"}
              </Button>
            </div>
          </div>
        )}
        {mode === "paste" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted block mb-1.5">
                Bulk Paste Rows
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder={"Paste rows, one per line:\nSenior Product Manager @ Google | New York, NY | $180k-$220k\nJob Title @ Company | Location | Salary"}
                className="w-full resize-none rounded-lg border border-panel-border bg-background/30 p-3 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-zinc-500 transition-colors"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePreviewPaste}
              disabled={!text.trim()}
            >
              Preview Paste Rows
            </Button>
          </div>
        )}
      </Panel>

      {/* Success Notification */}
      {successCount !== null && (
        <div className="rounded-lg border border-status-offer/30 bg-status-offer/10 p-4 text-xs text-status-offer flex items-center gap-2 animate-[fadein_.2s_ease]">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Successfully imported {successCount} jobs to {client.name}&apos;s shortlist!
        </div>
      )}

      {/* Preview Table Section */}
      {preview.length > 0 && (
        <div className="space-y-3 animate-[fadein_.25s_ease]">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-zinc-200">
              Parsed Preview ({preview.length} job{preview.length > 1 ? "s" : ""})
            </h3>
            <Button
              variant="primary"
              onClick={() => handleImport()}
              disabled={importing}
            >
              {importing ? "Importing..." : `Import ${preview.filter(j => j.title && j.company && j.company !== "—").length} valid jobs`}
            </Button>
          </div>

          <Panel className="overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_2fr_1.5fr_auto] items-center gap-4 border-b border-panel-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              <span>Job Title</span>
              <span>Company</span>
              <span>Location</span>
              <span>Salary</span>
              <span className="text-right">Match</span>
            </div>
            <div className="divide-y divide-panel-border max-h-[40vh] overflow-y-auto pr-1">
              {preview.map((j) => {
                const isValid = j.title.trim() && j.company.trim() && j.company !== "—";
                return (
                  <div
                    key={j.id}
                    className={`grid grid-cols-[2fr_2fr_2fr_1.5fr_auto] items-center gap-4 px-4 py-3 text-xs ${
                      !isValid ? "bg-status-rejected/5 opacity-80" : ""
                    }`}
                  >
                    <span className={`font-semibold ${!j.title.trim() ? "text-status-rejected italic" : "text-zinc-100"}`}>
                      {j.title.trim() || "Missing Job Title"}
                    </span>
                    <span className={`${j.company === "—" || !j.company.trim() ? "text-status-rejected italic font-medium" : "text-zinc-300 font-medium"}`}>
                      {j.company === "—" || !j.company.trim() ? "Missing Company" : j.company}
                    </span>
                    <span className="text-muted">{j.location}</span>
                    <span className="text-muted">{j.salary || "—"}</span>
                    <div className="flex items-center justify-end gap-2.5">
                      <MatchScore score={j.matchScore} className="shrink-0" />
                      {!isValid && (
                        <span className="rounded-full bg-status-rejected/15 px-2 py-0.5 text-[9px] font-semibold text-status-rejected shrink-0">
                          Invalid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function ManualEntryForm({
  clientId,
  clientName,
  onAdd,
  disabled,
}: {
  clientId: string;
  clientName: string;
  onAdd: (jobs: ApplicationJob[]) => void;
  disabled: boolean;
}) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");

  const canAdd = title.trim() && company.trim() && !disabled;

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
        matchScore: Math.floor(Math.random() * 29) + 70,
      },
    ]);
    setTitle("");
    setCompany("");
    setLocation("");
    setSalary("");
  }

  return (
    <div className="space-y-3.5 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Job title *">
          <Input value={title} onChange={setTitle} placeholder="Senior PM, Product Lead" />
        </Labeled>
        <Labeled label="Company *">
          <Input value={company} onChange={setCompany} placeholder="Google, Stripe" />
        </Labeled>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Location">
          <Input value={location} onChange={setLocation} placeholder="Remote (US), New York, NY" />
        </Labeled>
        <Labeled label="Salary">
          <Input value={salary} onChange={setSalary} placeholder="$180k-$220k" />
        </Labeled>
      </div>
      <Button
        variant="primary"
        className="w-full mt-2"
        onClick={submit}
        disabled={!canAdd}
      >
        Add Job to Shortlist
      </Button>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
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
      className="w-full rounded-md border border-panel-border bg-transparent px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-zinc-600 focus:border-zinc-500 transition-colors"
    />
  );
}
