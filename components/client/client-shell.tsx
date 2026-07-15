"use client";

// Client Portal shell — calm, spacious, emerald, light-default (DESIGN.md). Fixed
// left sidebar: brand, icon nav (Dashboard / Review / My Jobs / Profile) with a
// live Review badge, a weekly applications meter, an identity chip (avatar + name),
// a light/dark toggle, and sign-out. Theme-aware via the --accent / --panel /
// --foreground tokens so it reads on both light and dark. Full-height so pages
// like the My Jobs board can fill the viewport.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClientPortal } from "@/components/client/client-portal-context";
import { Logo } from "@/components/ui/logo";
import { auth } from "@/lib/api";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/client", label: "Dashboard", icon: <IconDashboard />, exact: true },
  { href: "/client/review", label: "Review", icon: <IconReview /> },
  { href: "/client/jobs", label: "My Jobs", icon: <IconJobs /> },
  { href: "/client/profile", label: "Profile", icon: <IconProfile /> },
];

export function ClientShell({
  dark,
  toggleTheme,
  children,
}: {
  dark: boolean;
  toggleTheme: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { client, reviewQueue } = useClientPortal();

  const used = client.filledApps;
  const total = client.quotaApps;
  const pct = total ? Math.min(1, used / total) * 100 : 0;

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col border-r border-panel-border bg-panel">
        <div className="px-5 py-4">
          <Logo size={30} />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-3">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            const showBadge =
              item.href === "/client/review" && reviewQueue.length > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
                  active
                    ? "font-semibold text-foreground"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground",
                )}
                style={
                  active
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--accent) 12%, transparent)",
                        boxShadow: "inset 2px 0 0 var(--accent)",
                      }
                    : undefined
                }
              >
                <span
                  className="shrink-0"
                  style={{ color: active ? "var(--accent-strong)" : undefined }}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {reviewQueue.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-panel-border px-4 py-4">
          {/* Weekly delivery */}
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted">Applications this week</span>
              <span className="font-medium tabular-nums">
                {used}/{total}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-border">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
              />
            </div>
          </div>

          {/* Identity + theme toggle */}
          <div className="flex items-center gap-2.5 border-t border-panel-border pt-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: "color-mix(in srgb, var(--accent) 16%, transparent)",
                color: "var(--accent-strong)",
              }}
            >
              {initials(client.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-foreground">
                {client.name}
              </span>
              <span className="block text-[10.5px] text-muted">Client</span>
            </span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {dark ? <IconSun /> : <IconMoon />}
            </button>
          </div>

          <button
            onClick={async () => {
              await auth.logout();
              router.replace("/login");
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <IconLogout /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

// "Ashley Bennett" → "AB"
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Icons (flat, 18px stroke) ─────────────────────────────────────────
function svg(path: React.ReactNode, size = 18) {
  return (
    <svg
      width={size}
      height={size}
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
function IconDashboard() {
  return svg(
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>,
  );
}
function IconReview() {
  return svg(
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.4 8.4 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8v.5z" />
      <path d="M9 11.5l2 2 4-4" />
    </>,
  );
}
function IconJobs() {
  return svg(
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>,
  );
}
function IconProfile() {
  return svg(
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>,
  );
}
function IconMoon() {
  return svg(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />, 16);
}
function IconSun() {
  return svg(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
    16,
  );
}
function IconLogout() {
  return svg(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>,
    15,
  );
}
