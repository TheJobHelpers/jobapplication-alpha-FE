"use client";

// Today — the internal home, now a role-aware overview + work queue. The top
// band shows performance insight for the current role (computed in lib/insights
// from real data); below it, the ordered action queue (unchanged). Merges
// UI-created clients/members + stage overrides from the store so the numbers
// match the rest of the app.

import Link from "next/link";
import { useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { Panel } from "@/components/ui/panel";
import {
  CURRENT_WEEK,
  type ApplicationJob,
  type Client,
  type TeamMember,
} from "@/lib/api";
import {
  CATEGORY_META,
  countByCategory,
  deriveAttention,
  scopeAttention,
  URGENCY_RANK,
  type AttentionCategory,
  type AttentionItem,
} from "@/lib/attention";
import {
  computeInsights,
  type FunnelSeg,
  type StatTile,
  type Tone,
} from "@/lib/insights";
import { roleLabel } from "@/lib/permissions";

const TONE_TEXT: Record<Tone, string> = {
  default: "text-zinc-100",
  positive: "text-status-offer",
  warning: "text-status-interview",
  danger: "text-status-blocked",
};

// How many attention rows to show before "Show all" — keeps the list scannable
// even with dozens of clients.
const ATTENTION_LIMIT = 7;

export function TodayView({
  jobs,
  clients,
  team,
}: {
  jobs: ApplicationJob[];
  clients: Client[];
  team: TeamMember[];
}) {
  const { user } = useCurrentUser();
  const { clients: createdClients, members: createdMembers, stageById } = useStore();

  // Merge UI-created records + stage overrides so Today agrees with the roster
  // and team pages.
  const allClients: Client[] = [...createdClients, ...clients].map((c) =>
    stageById[c.id] ? { ...c, stage: stageById[c.id] } : c,
  );
  const allTeam: TeamMember[] = [...createdMembers, ...team];

  const insights = computeInsights(user, jobs, allClients, allTeam);

  // React Compiler memoizes; no manual useMemo needed.
  const attention = scopeAttention(deriveAttention(jobs, allClients), user);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Week {CURRENT_WEEK} · {roleLabel(user)}
        </p>
        <h1 className="mt-1 text-[16px] font-semibold">{insights.title}</h1>
        <p className="mt-1 text-[13px] text-muted">{insights.subtitle}</p>
      </header>

      {/* Stat tiles */}
      {insights.tiles.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {insights.tiles.map((t) => (
            <StatCard key={t.label} tile={t} />
          ))}
        </div>
      )}

      {/* Pipeline funnel */}
      {insights.funnel && insights.funnel.length > 0 && (
        <Funnel segs={insights.funnel} label={insights.funnelLabel} />
      )}

      {insights.note && (
        <p className="mb-6 text-[11.5px] text-zinc-500">{insights.note}</p>
      )}

      <AttentionSection items={attention} />
    </div>
  );
}

// Categorized, filterable, capped triage. Scales to many clients: a summary chip
// row (counts as filters) and a capped list with "Show all".
function AttentionSection({ items }: { items: AttentionItem[] }) {
  const [filter, setFilter] = useState<AttentionCategory | null>(null);
  const [showAll, setShowAll] = useState(false);

  const counts = countByCategory(items);
  const present = (Object.keys(CATEGORY_META) as AttentionCategory[]).filter(
    (c) => counts[c],
  );

  const list = filter ? items.filter((i) => i.category === filter) : items;
  const sorted = [...list].sort(
    (a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency],
  );

  const visible = showAll ? sorted : sorted.slice(0, ATTENTION_LIMIT);
  const hidden = sorted.length - visible.length;

  return (
    <section>
      <div className="mb-2 mt-2 flex items-baseline justify-between">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Needs attention
        </h2>
        <span className="text-[11px] text-zinc-500">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {items.length === 0 ? (
        <Panel className="px-4 py-6 text-center text-[13px] text-muted">
          All clear. Nothing needs your attention right now.
        </Panel>
      ) : (
        <>
          {/* Filter chips (counts double as the triage summary) */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Chip
              active={filter === null}
              onClick={() => setFilter(null)}
              label="All"
              count={items.length}
            />
            {present.map((c) => (
              <Chip
                key={c}
                active={filter === c}
                onClick={() => setFilter(filter === c ? null : c)}
                label={CATEGORY_META[c].label}
                count={counts[c] ?? 0}
                color={CATEGORY_META[c].color}
              />
            ))}
          </div>

          <Panel className="divide-y divide-panel-border overflow-hidden">
            {visible.map((item) => (
              <AttentionRow key={item.id} item={item} />
            ))}
          </Panel>

          {(hidden > 0 || showAll) && sorted.length > ATTENTION_LIMIT && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 text-[12px] font-semibold text-[var(--accent)] hover:underline"
            >
              {showAll ? "Show less" : `Show all ${sorted.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
        active
          ? "border-zinc-500 bg-zinc-800/80 text-zinc-100"
          : "border-panel-border text-muted hover:border-zinc-600 hover:text-zinc-300"
      }`}
    >
      {color && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
      <span className="font-mono tabular-nums text-zinc-500">{count}</span>
    </button>
  );
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <div
      className="flex items-center gap-4 py-3 pl-4 pr-3"
      style={{ boxShadow: `inset 3px 0 0 0 ${CATEGORY_META[item.category].color}` }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-zinc-100">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">{item.detail}</p>
      </div>

      {item.meta && (
        <span className="hidden whitespace-nowrap text-[11px] text-zinc-500 sm:block">
          {item.meta}
        </span>
      )}

      {item.action?.href && (
        <Link
          href={item.action.href}
          className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
        >
          {item.action.label}
        </Link>
      )}
    </div>
  );
}

function StatCard({ tile }: { tile: StatTile }) {
  const tone: Tone = tile.tone ?? "default";
  const barColor =
    tone === "positive"
      ? "var(--status-offer)"
      : tone === "warning"
        ? "var(--status-interview)"
        : tone === "danger"
          ? "var(--status-blocked)"
          : "var(--accent)";
  return (
    <Panel className="p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {tile.label}
      </p>
      <p
        className={`mt-1.5 font-mono text-[24px] leading-none tabular-nums ${TONE_TEXT[tone]}`}
      >
        {tile.value}
      </p>
      {tile.meter !== undefined && (
        <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-[var(--panel-border)]">
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.min(1, Math.max(0, tile.meter)) * 100}%`,
              backgroundColor: barColor,
            }}
          />
        </span>
      )}
      {tile.sub && (
        <p className="mt-2 text-[11px] text-zinc-500">{tile.sub}</p>
      )}
    </Panel>
  );
}

function Funnel({ segs, label }: { segs: FunnelSeg[]; label?: string }) {
  const total = Math.max(
    1,
    segs.reduce((s, x) => s + x.count, 0),
  );
  return (
    <Panel className="mb-6 p-4">
      {label && (
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </p>
      )}
      {/* proportional bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--panel-border)]">
        {segs.map((s) =>
          s.count > 0 ? (
            <span
              key={s.label}
              style={{
                width: `${(s.count / total) * 100}%`,
                backgroundColor: s.color,
              }}
              title={`${s.label}: ${s.count}`}
            />
          ) : null,
        )}
      </div>
      {/* legend / counts */}
      <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-6">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <div className="min-w-0">
              <p className="font-mono text-[14px] leading-none tabular-nums text-zinc-100">
                {s.count}
              </p>
              <p className="truncate text-[10px] text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

