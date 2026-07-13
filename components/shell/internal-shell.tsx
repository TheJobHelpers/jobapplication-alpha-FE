"use client";

// Internal Portal shell — flat ops console (DESIGN.md). Fixed nav rail with the
// role-aware IA (Today / Clients / Pipeline / Team / Admin), the command
// palette (Ctrl+K), and a global Quick-Add job slide-over (S). Team + Admin
// hide for JA/JS members. A "viewing as" switcher makes role differences
// visible.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CommandPalette } from "@/components/shell/command-palette";
import { QuickAdd } from "@/components/shell/quick-add";
import { useCurrentUser } from "@/components/shell/role-context";
import { cn } from "@/lib/cn";
import { STAFF_SESSION_KEY, writeSession } from "@/lib/session";
import {
  canSeeAdmin,
  canSeeTeam,
  roleLabel,
  USER_PRESETS,
  type CurrentUser,
} from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  show?: (u: CurrentUser) => boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Today", icon: <IconToday /> },
  { href: "/admin/clients", label: "Clients", icon: <IconClients /> },
  { href: "/admin/pipeline", label: "Pipeline", icon: <IconPipeline /> },
  { href: "/admin/team", label: "Team", icon: <IconTeam />, show: canSeeTeam },
  { href: "/admin/settings", label: "Admin", icon: <IconAdmin />, show: canSeeAdmin },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

const noopSubscribe = () => () => {};
// Modifier hint: "⌘K" on Mac, "Ctrl K" elsewhere (and during SSR).
function useCmdLabel() {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );
}

export function InternalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useCurrentUser();
  const [palette, setPalette] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);

  // The Ctrl/Cmd+K handler is cross-platform; only the hint label differs.
  // Read the platform via useSyncExternalStore so the server snapshot is a stable
  // "Ctrl K" (no hydration mismatch) and Mac clients swap to "⌘K" after hydration.
  const cmdLabel = useCmdLabel();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setPalette(false);
        setQuickAdd(false);
        return;
      }
      if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setQuickAdd((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nav = NAV.filter((item) => !item.show || item.show(user));

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-56 flex-col border-r border-panel-border bg-panel">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)] text-[13px] font-bold text-white">
            J
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold">JA-Alpha</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              Ops Console
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
                  active
                    ? "bg-zinc-800/60 font-semibold text-zinc-100"
                    : "text-muted hover:bg-zinc-800/40 hover:text-zinc-200",
                )}
              >
                <span className={active ? "text-[var(--accent)]" : "text-zinc-500"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 px-2 py-3">
          <button
            onClick={() => setQuickAdd(true)}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] text-muted hover:bg-zinc-800/40 hover:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              <IconPlus /> Add job
            </span>
            <Kbd>S</Kbd>
          </button>
          <button
            onClick={() => setPalette(true)}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] text-muted hover:bg-zinc-800/40 hover:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              <IconCommand /> Command
            </span>
            <Kbd>{cmdLabel}</Kbd>
          </button>

          <button
            onClick={() => {
              writeSession(STAFF_SESSION_KEY, null);
              router.replace("/admin/login");
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-muted hover:bg-zinc-800/40 hover:text-zinc-200"
          >
            <IconLogout /> Log out
          </button>

          {/* Viewing-as switcher — makes role differences visible */}
          <div className="mt-1 border-t border-panel-border px-1 pt-3">
            <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              Viewing as
            </label>
            <select
              value={user.id}
              onChange={(e) => {
                const next = USER_PRESETS.find((p) => p.id === e.target.value);
                if (next) setUser(next);
              }}
              className="mt-1 w-full rounded-md border border-panel-border bg-panel px-2 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-zinc-600"
            >
              {USER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {roleLabel(p)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      <main className="ml-56 flex-1">{children}</main>

      {palette && (
        <CommandPalette
          onClose={() => setPalette(false)}
          onQuickAdd={() => setQuickAdd(true)}
        />
      )}
      {quickAdd && <QuickAdd onClose={() => setQuickAdd(false)} />}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-panel-border px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
      {children}
    </kbd>
  );
}

// ── Icons (16px stroke, flat) ─────────────────────────────────────────
function svg(path: React.ReactNode) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}
function IconToday() {
  return svg(
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>,
  );
}
function IconClients() {
  return svg(
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M15 11a3 3 0 1 0 0-6M3 20a6 6 0 0 1 12 0M17 20a5 5 0 0 0-4-4.9" />
    </>,
  );
}
function IconPipeline() {
  return svg(
    <>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="11" rx="1" />
      <rect x="17" y="4" width="4" height="7" rx="1" />
    </>,
  );
}
function IconTeam() {
  return svg(
    <>
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>,
  );
}
function IconAdmin() {
  return svg(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a1.6 1.6 0 0 0-1.5-1H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 3h.1" />
    </>,
  );
}
function IconPlus() {
  return svg(<path d="M12 5v14M5 12h14" />);
}
function IconCommand() {
  return svg(
    <path d="M9 3a3 3 0 1 0 3 3v12a3 3 0 1 0-3-3h12a3 3 0 1 0-3 3V6a3 3 0 1 0 3 3H6" />,
  );
}
function IconLogout() {
  return svg(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>,
  );
}
