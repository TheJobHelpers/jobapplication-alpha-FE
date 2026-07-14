"use client";

// Staff sign-in. Email/password → the backend sets a JWT HttpOnly cookie; we
// then re-probe /auth/me (session.refresh) so the role-aware shell renders for
// whoever signed in.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useStaffSession } from "@/components/shell/role-context";
import { ApiError, auth } from "@/lib/api";

export default function StaffLoginPage() {
  const router = useRouter();
  const { refresh } = useStaffSession();
  const [email, setEmail] = useState("ops@thejobhelpers.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await auth.staffLogin(email, password);
      await refresh();
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Logo size={34} />
        </div>

        <form
          onSubmit={signIn}
          className="space-y-3 rounded-lg border border-panel-border bg-panel p-5"
        >
          <div>
            <h1 className="text-[15px] font-semibold">Sign in</h1>
            <p className="mt-1 text-[12.5px] text-muted">
              Staff access to the internal portal.
            </p>
          </div>

          <label className="block">
            <span className="text-[11px] font-medium text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-600"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-600"
            />
          </label>

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
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

          <p className="text-center text-[11px] text-zinc-500">
            Demo: ops@thejobhelpers.com · password
          </p>
        </form>
      </div>
    </div>
  );
}
