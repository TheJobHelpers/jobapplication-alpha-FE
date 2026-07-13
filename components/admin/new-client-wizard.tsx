"use client";

// New Client onboarding — a Typeform-style wizard: Client info → Documents →
// Questionnaire → Review. Creates the client at stage "onboarding". Search is
// not involved; the CQFO questionnaire is either emailed (public link) or filled
// manually later (vault notes 06/07/09). Manager/admin only.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { genToken } from "@/components/admin/questionnaire-panel";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { Button } from "@/components/ui/button";
import { api, type Client, type TeamMember } from "@/lib/api";
import { canCreateClient } from "@/lib/permissions";

const STEPS = ["Client info", "Documents", "Questionnaire", "Review"];
const TIER_QUOTA: Record<string, number> = { "Tier 1": 12, "Tier 2": 10, "Tier 3": 8 };

type DocState = { resume: string; cover: string; doc360: string };
type QMode = "send" | "manual" | "skip" | null;

export function NewClientWizard() {
  const { user } = useCurrentUser();
  const {
    addClient,
    sendQuestionnaire,
    setQuestionnaireStatus,
    upsertDocument,
    logAudit,
  } = useStore();
  const router = useRouter();

  const [team, setTeam] = useState<TeamMember[]>([]);
  useEffect(() => {
    api.getTeam().then((t) =>
      setTeam(t.filter((m) => m.role === "team_member" || m.role === "manager")),
    );
  }, []);

  const [step, setStep] = useState(0);

  // Step 1 — client info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [tier, setTier] = useState("Tier 2");
  const [ownerId, setOwnerId] = useState("");
  const [quota, setQuota] = useState(10);
  const [approval, setApproval] = useState(true);

  // Step 2 — documents
  const [docs, setDocs] = useState<DocState>({ resume: "", cover: "", doc360: "" });

  // Step 3 — questionnaire
  const [qMode, setQMode] = useState<QMode>("send");

  if (!canCreateClient(user)) return <AccessDenied need="managers and admins" />;

  const infoValid = name.trim() && email.trim() && ownerId;
  const canNext = step === 0 ? infoValid : true;

  function chooseTier(t: string) {
    setTier(t);
    setQuota(TIER_QUOTA[t]);
  }

  function create() {
    const owner = team.find((m) => m.id === ownerId);
    const client: Client = {
      id: `c_new_${Date.now()}`,
      name: name.trim(),
      stage: "onboarding",
      tier,
      ownerId,
      ownerName: owner?.name ?? "—",
      quotaApps: quota,
      filledApps: 0,
      approvalRequired: approval,
    };
    addClient(client);
    logAudit(user.name, "Created client", client.name);
    // Files picked in step 2 land on the client's document record.
    const today = new Date().toISOString().slice(0, 10);
    (
      [
        ["resume", docs.resume],
        ["cover_letter", docs.cover],
        ["doc360", docs.doc360],
      ] as const
    ).forEach(([kind, fileName]) => {
      if (fileName)
        upsertDocument(client.id, {
          kind,
          fileName,
          uploadedAt: today,
          uploadedBy: user.name,
        });
    });
    // Track the questionnaire milestone from the start based on the choice.
    if (qMode === "send") sendQuestionnaire(client.id, genToken(client.id));
    else if (qMode === "manual") setQuestionnaireStatus(client.id, "in_progress");
    router.push(`/admin/clients/${client.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      {/* progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            New client · {STEPS[step]}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-zinc-500">
            {step + 1} / {STEPS.length}
          </p>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-panel-border">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <Step title="Who's the client?" hint="The essentials to get them set up.">
          <Field label="Full name *">
            <Input value={name} onChange={setName} placeholder="e.g. Jordan Reyes" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email *">
              <Input value={email} onChange={setEmail} placeholder="jordan@email.com" type="email" />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={setPhone} placeholder="(555) 123-4567" />
            </Field>
          </div>
          <Field label="Location">
            <Input value={location} onChange={setLocation} placeholder="City, State" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tier">
              <div className="flex gap-1.5">
                {Object.keys(TIER_QUOTA).map((t) => (
                  <button
                    key={t}
                    onClick={() => chooseTier(t)}
                    className={
                      "flex-1 rounded-md border px-2 py-1.5 text-[12.5px] transition-colors " +
                      (tier === t
                        ? "border-[var(--accent)] text-zinc-100"
                        : "border-panel-border text-muted hover:text-zinc-200")
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Weekly quota">
              <Input value={String(quota)} onChange={(v) => setQuota(Number(v) || 0)} placeholder="10" type="number" />
            </Field>
          </div>
          <Field label="Owner *">
            <Select value={ownerId} onChange={setOwnerId}>
              <option value="">Select an owner…</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.memberType ? ` · ${m.memberType.toUpperCase()}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-[12.5px] text-zinc-300">
            <input
              type="checkbox"
              checked={approval}
              onChange={(e) => setApproval(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Client must approve sourced jobs before we apply
          </label>
        </Step>
      )}

      {step === 1 && (
        <Step title="Documents" hint="Upload what you have — you can add the rest later.">
          <DocSlot label="Resume" value={docs.resume} onPick={(f) => setDocs({ ...docs, resume: f })} />
          <DocSlot label="Cover letter" value={docs.cover} onPick={(f) => setDocs({ ...docs, cover: f })} />
          <DocSlot label="360 document" value={docs.doc360} onPick={(f) => setDocs({ ...docs, doc360: f })} />
          <p className="text-[11.5px] text-muted">
            The CQFO document is generated from the questionnaire in the next step.
          </p>
        </Step>
      )}

      {step === 2 && (
        <Step title="Onboarding questionnaire" hint="The CQFO captures preferences that guide weekly applications.">
          <Choice
            active={qMode === "send"}
            onClick={() => setQMode("send")}
            title="Email a questionnaire link"
            blurb="Send the client a Typeform-style link (one question per screen). Answers flow back into their profile automatically."
          />
          <Choice
            active={qMode === "manual"}
            onClick={() => setQMode("manual")}
            title="Enter answers manually"
            blurb="For form-averse clients — you'll fill the CQFO in the client's Profile tab after creating."
          />
          <Choice
            active={qMode === "skip"}
            onClick={() => setQMode("skip")}
            title="Skip for now"
            blurb="Create the client and handle the questionnaire later."
          />
          {qMode === "send" && email && (
            <div className="rounded-md border border-panel-border bg-panel p-3 text-[12px]">
              <p className="text-muted">Link that will be emailed to {email}:</p>
              <p className="mt-1 truncate font-mono text-[11.5px] text-[var(--accent)]">
                {`https://app.ja-alpha.com/q/tok_${email.replace(/[^a-z0-9]/gi, "").slice(0, 8)}`}
              </p>
            </div>
          )}
        </Step>
      )}

      {step === 3 && (
        <Step title="Review & create" hint="Confirm and we'll set them to Onboarding.">
          <Summary label="Name" value={name} />
          <Summary label="Contact" value={[email, phone].filter(Boolean).join(" · ")} />
          <Summary label="Location" value={location || "—"} />
          <Summary label="Tier · quota" value={`${tier} · ${quota}/wk`} />
          <Summary label="Owner" value={team.find((m) => m.id === ownerId)?.name ?? "—"} />
          <Summary label="Approval" value={approval ? "Required" : "Off"} />
          <Summary
            label="Documents"
            value={
              [docs.resume && "Resume", docs.cover && "Cover", docs.doc360 && "360"]
                .filter(Boolean)
                .join(", ") || "None yet"
            }
          />
          <Summary
            label="Questionnaire"
            value={
              qMode === "send"
                ? "Link emailed"
                : qMode === "manual"
                  ? "Manual entry"
                  : "Deferred"
            }
          />
        </Step>
      )}

      {/* nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => (step === 0 ? router.push("/admin/clients") : setStep(step - 1))}
          className="text-[12.5px] text-muted hover:text-zinc-200"
        >
          {step === 0 ? "Cancel" : "← Back"}
        </button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => setStep(step + 1)} disabled={!canNext}>
            Continue
          </Button>
        ) : (
          <Button variant="primary" onClick={create}>
            Create client
          </Button>
        )}
      </div>
    </div>
  );
}

// ── pieces ────────────────────────────────────────────────────────────
function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-[20px] font-semibold">{title}</h1>
      <p className="mt-1 text-[13px] text-muted">{hint}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
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
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-zinc-600 focus:border-zinc-600"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-[13px] text-zinc-200 outline-none focus:border-zinc-600"
    >
      {children}
    </select>
  );
}

function DocSlot({
  label,
  value,
  onPick,
}: {
  label: string;
  value: string;
  onPick: (filename: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-panel-border px-3 py-2.5">
      <div>
        <p className="text-[12.5px] text-zinc-200">{label}</p>
        <p className="text-[11px] text-muted">{value || "No file selected"}</p>
      </div>
      <label className="cursor-pointer rounded-md border border-zinc-700 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-200 hover:bg-zinc-800/60">
        {value ? "Replace" : "Upload"}
        <input
          type="file"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0]?.name ?? "")}
        />
      </label>
    </div>
  );
}

function Choice({
  active,
  onClick,
  title,
  blurb,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  blurb: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "block w-full rounded-lg border p-3.5 text-left transition-colors " +
        (active
          ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]"
          : "border-panel-border hover:border-zinc-600")
      }
    >
      <p className="text-[13px] font-medium text-zinc-100">{title}</p>
      <p className="mt-0.5 text-[12px] text-muted">{blurb}</p>
    </button>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-panel-border pb-2">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="text-right text-[13px] text-zinc-200">{value}</span>
    </div>
  );
}
