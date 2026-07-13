// Today — the internal home. A work queue, not a stats dashboard (06 UX):
// an ordered list of what needs doing now. Each row carries a 3px urgency
// stripe and a one-click action (DESIGN.md §Component rules 2, 5).

import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { api, CURRENT_WEEK, type TodayItem } from "@/lib/api";
import { URGENCY_COLOR } from "@/lib/urgency";

const URGENCY_ORDER: Record<TodayItem["urgency"], number> = {
  danger: 0,
  warning: 1,
  positive: 2,
  info: 3,
};

export default async function TodayPage() {
  const items = await api.getTodayItems();
  const queue = [...items].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency],
  );

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Week {CURRENT_WEEK}
        </p>
        <h1 className="mt-1 text-[16px] font-semibold">Today</h1>
        <p className="mt-1 text-[13px] text-muted">
          {queue.length} things need your attention.
        </p>
      </header>

      <Panel className="divide-y divide-panel-border overflow-hidden">
        {queue.map((item) => (
          <QueueRow key={item.id} item={item} />
        ))}
      </Panel>
    </div>
  );
}

function QueueRow({ item }: { item: TodayItem }) {
  return (
    <div
      className="flex items-center gap-4 py-3 pl-4 pr-3"
      style={{ boxShadow: `inset 3px 0 0 0 ${URGENCY_COLOR[item.urgency]}` }}
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

      {item.action &&
        (item.action.href ? (
          <Link
            href={item.action.href}
            className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/60"
          >
            {item.action.label}
          </Link>
        ) : (
          <span className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-400">
            {item.action.label}
          </span>
        ))}
    </div>
  );
}
