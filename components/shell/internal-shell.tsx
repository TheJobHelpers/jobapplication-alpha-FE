"use client";

// Internal Portal shell — flat ops console (DESIGN.md). Fixed nav rail with the
// new IA (Today / Clients / Pipeline / Admin), plus a command-palette stub
// (Ctrl+K) and a search-tray stub (S). No glass, no gradient, no pulsing logo.
// The overlays are stubs today; they establish the keyboard model early so
// screens can assume it exists.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { href: "/admin", label: "Today", icon: <IconToday /> },
  { href: "/admin/clients", label: "Clients", icon: <IconClients /> },
  { href: "/admin/pipeline", label: "Pipeline", icon: <IconPipeline /> },
  { href: "/admin/settings", label: "Admin", icon: <IconAdmin /> },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function InternalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [palette, setPalette] = useState(false);
  const [tray, setTray] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
        return;
      }
      if (e.key === "Escape") {
        setPalette(false);
        setTray(false);
        return;
      }
      if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setTray((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Nav rail */}
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
          {NAV.map((item) => {
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
                <span
                  className={active ? "text-[var(--accent)]" : "text-zinc-500"}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 px-2 py-3">
          <button
            onClick={() => setTray(true)}
            className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] text-muted hover:bg-zinc-800/40 hover:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              <IconSearch /> Search
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
            <Kbd>⌘K</Kbd>
          </button>
          <div className="mt-1 flex items-center gap-2.5 border-t border-panel-border px-1 pt-3">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300">
              OA
            </span>
            <div className="leading-tight">
              <p className="text-[12px] font-medium text-zinc-200">Ops Admin</p>
              <p className="text-[10px] uppercase tracking-[0.1em] text-muted">
                admin
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1">{children}</main>

      {palette && <CommandPaletteStub onClose={() => setPalette(false)} />}
      {tray && <SearchTrayStub onClose={() => setTray(false)} />}
    </div>
  );
}

// ── Stubs ─────────────────────────────────────────────────────────────
function CommandPaletteStub({ onClose }: { onClose: () => void }) {
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
          placeholder="Search commands, clients, jobs…"
          className="w-full bg-transparent px-4 py-3.5 text-[14px] outline-none placeholder:text-zinc-500"
        />
        <div className="border-t border-panel-border px-4 py-3 text-[12px] text-muted">
          Command palette — coming soon. Navigation, quick actions, and jump-to
          land here.
        </div>
      </div>
    </div>
  );
}

function SearchTrayStub({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        className="h-full w-[360px] border-l border-panel-border bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">Search</h2>
          <button
            onClick={onClose}
            className="text-[12px] text-muted hover:text-zinc-200"
          >
            Esc
          </button>
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Searches run in the background on a durable queue and stream results
          into the client they were aimed at. Live progress will show here.
        </p>
        <p className="mt-3 text-[11px] text-zinc-500">Coming soon.</p>
      </aside>
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
function IconAdmin() {
  return svg(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15a1.6 1.6 0 0 0-1.5-1H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 3h.1" />
    </>,
  );
}
function IconSearch() {
  return svg(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>,
  );
}
function IconCommand() {
  return svg(
    <path d="M9 3a3 3 0 1 0 3 3v12a3 3 0 1 0-3-3h12a3 3 0 1 0-3 3V6a3 3 0 1 0 3 3H6" />,
  );
}
