"use client";

// Command palette (Ctrl/Cmd+K) — navigate + quick actions (09 Pages §Global).
// Searches pages (role-filtered), actions, and clients (fixtures + UI-created).
// Arrow keys move, Enter runs, Esc closes (handled by the shell).

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { api, type Client } from "@/lib/api";
import {
  canCreateClient,
  canSeeAdmin,
  canSeeTeam,
  type CurrentUser,
} from "@/lib/permissions";

interface PaletteItem {
  id: string;
  label: string;
  hint?: string;
  group: "Actions" | "Pages" | "Clients";
  run: () => void;
}

const PAGES: { href: string; label: string; show?: (u: CurrentUser) => boolean }[] = [
  { href: "/admin", label: "Today" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/team", label: "Team", show: canSeeTeam },
  { href: "/admin/settings", label: "Admin", show: canSeeAdmin },
];

export function CommandPalette({
  onClose,
  onQuickAdd,
}: {
  onClose: () => void;
  onQuickAdd: () => void;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { clients: created } = useStore();
  const [base, setBase] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getClients().then(setBase);
  }, []);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };
    const actions: PaletteItem[] = [
      {
        id: "act_add_job",
        label: "Add a job",
        hint: "S",
        group: "Actions",
        run: () => {
          onClose();
          onQuickAdd();
        },
      },
      ...(canCreateClient(user)
        ? [
            {
              id: "act_new_client",
              label: "New client",
              hint: "onboarding wizard",
              group: "Actions" as const,
              run: go("/admin/clients/new"),
            },
          ]
        : []),
    ];
    const pages: PaletteItem[] = PAGES.filter(
      (p) => !p.show || p.show(user),
    ).map((p) => ({
      id: `page_${p.href}`,
      label: p.label,
      hint: p.href,
      group: "Pages",
      run: go(p.href),
    }));
    const clients: PaletteItem[] = [...created, ...base].map((c) => ({
      id: `client_${c.id}`,
      label: c.name,
      hint: `${c.tier} · ${c.ownerName}`,
      group: "Clients",
      run: go(`/admin/clients/${c.id}`),
    }));
    return [...actions, ...pages, ...clients];
  }, [user, created, base, router, onClose, onQuickAdd]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? items.filter(
            (it) =>
              it.label.toLowerCase().includes(q) ||
              it.hint?.toLowerCase().includes(q),
          )
        : items,
    [items, q],
  );

  // Keep the active row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      visible[active]?.run();
    }
  }

  let lastGroup: string | null = null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[18vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border border-panel-border bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0); // filtering restarts the selection at the top
          }}
          onKeyDown={onKeyDown}
          placeholder="Search pages, actions, clients…"
          aria-label="Command palette"
          className="w-full border-b border-panel-border bg-transparent px-4 py-3.5 text-[14px] outline-none placeholder:text-zinc-500"
        />
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-1.5">
          {visible.length === 0 ? (
            <p className="px-4 py-4 text-[12.5px] text-zinc-500">
              Nothing matches “{query}”.
            </p>
          ) : (
            visible.map((it, i) => {
              const header = it.group !== lastGroup ? it.group : null;
              lastGroup = it.group;
              return (
                <div key={it.id}>
                  {header && (
                    <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {header}
                    </p>
                  )}
                  <button
                    data-active={i === active}
                    onClick={it.run}
                    onMouseEnter={() => setActive(i)}
                    className={
                      "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-[13px] " +
                      (i === active
                        ? "bg-zinc-800/60 text-zinc-100"
                        : "text-zinc-300")
                    }
                  >
                    <span className="truncate">{it.label}</span>
                    {it.hint && (
                      <span className="shrink-0 text-[11px] text-zinc-500">
                        {it.hint}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
