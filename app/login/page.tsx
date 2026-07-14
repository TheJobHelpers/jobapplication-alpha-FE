"use client";

// Client sign-in. Email/password → the backend sets a JWT HttpOnly cookie; the
// client gate then probes /auth/me on /client. The demo-account picker just
// prefills a seeded email (all seeded logins share the password "password").
// Scoped with data-portal="client" so it wears the emerald/light look even
// though it lives outside the /client layout.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ApiError, auth } from "@/lib/api";

// Seeded demo clients (id → email in the backend seed). Selecting one prefills
// the email so demos are one click; any seeded login uses password "password".
const DEMO_CLIENTS = [
  { email: "ashley.bennett@example.com", name: "Ashley Bennett (reviews jobs)" },
  { email: "devin.cross@example.com", name: "Devin Cross" },
  { email: "lauren.mitchell@example.com", name: "Lauren Mitchell" },
  { email: "michael.carter@example.com", name: "Michael Carter" },
  { email: "paige.sullivan@example.com", name: "Paige Sullivan" },
  { email: "sam.whitfield@example.com", name: "Sam Whitfield (auto-apply)" },
];

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_CLIENTS[0].email);
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await auth.clientLogin(email, password);
      router.replace("/client");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <div
      data-portal="client"
      className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
    >
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Logo size={34} />
        </div>

        <form
          onSubmit={signIn}
          className="space-y-4 rounded-lg border border-panel-border bg-panel p-6"
        >
          <div>
            <h1 className="text-[17px] font-semibold">Sign in to your portal</h1>
            <p className="mt-1 text-[13px] text-muted">
              Review jobs and track your applications.
            </p>
          </div>

          <label className="block">
            <span className="text-[11px] font-medium text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block border-t border-panel-border pt-3">
            <span className="text-[11px] font-medium text-muted">Demo account</span>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-[13px] outline-none focus:border-zinc-400"
            >
              {DEMO_CLIENTS.map((c) => (
                <option key={c.email} value={c.email}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-500">
              {error}
            </p>
          )}

          <Button
            variant="primary"
            size="md"
            type="submit"
            className="w-full"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-[11px] text-muted">
            Demo logins use the password “password”.
          </p>
        </form>
      </div>
    </div>
  );
}
