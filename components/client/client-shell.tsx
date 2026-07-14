"use client";

// Client Portal shell — calm, spacious, emerald, light-default (DESIGN.md). Fixed
// left sidebar with the four areas (Dashboard / Review / My Jobs / Profile), a live
// count on Review, a weekly applications meter, a light/dark toggle, and sign-out.
// Full-height layout so pages like the My Jobs board can fill the viewport.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClientPortal } from "@/components/client/client-portal-context";
import { Logo } from "@/components/ui/logo";
import { auth } from "@/lib/api";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/client", label: "Dashboard", exact: true },
  { href: "/client/review", label: "Review" },
  { href: "/client/jobs", label: "My Jobs" },
  { href: "/client/profile", label: "Profile" },
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

        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors",
                  active
                    ? "font-semibold text-foreground"
                    : "text-muted hover:text-foreground",
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
                <span>{item.label}</span>
                {item.href === "/client/review" && reviewQueue.length > 0 && (
                  <span className="rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {reviewQueue.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-panel-border px-4 py-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Applications this week</span>
              <span className="tabular-nums">
                {used}/{total}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-panel-border">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="truncate text-[12px] text-muted">{client.name}</span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-md p-1 text-muted hover:text-foreground"
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

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
