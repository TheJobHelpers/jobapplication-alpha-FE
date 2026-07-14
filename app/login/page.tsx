"use client";

// Mock client sign-in. No real auth yet — pick a demo client and go. It's scoped
// with data-portal="client" so it wears the emerald/light look even though it
// lives outside the /client layout. Replaced by real login with the backend.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { api, type Client } from "@/lib/api";
import { CLIENT_SESSION_KEY, writeSession } from "@/lib/session";

export default function ClientLoginPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    let alive = true;
    api.getClients().then((cs) => {
      if (!alive) return;
      setClients(cs);
      setClientId(cs[0]?.id ?? "");
    });
    return () => {
      alive = false;
    };
  }, []);

  const selected = clients.find((c) => c.id === clientId);

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    writeSession(CLIENT_SESSION_KEY, clientId);
    router.replace("/client");
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
              defaultValue="you@example.com"
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-muted">Password</span>
            <input
              type="password"
              defaultValue="demo"
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block border-t border-panel-border pt-3">
            <span className="text-[11px] font-medium text-muted">
              Demo account
            </span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-[13px] outline-none focus:border-zinc-400"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.approvalRequired ? " (reviews jobs)" : " (auto-apply)"}
                </option>
              ))}
            </select>
            {selected && (
              <span className="mt-1 block text-[11px] text-muted">
                {selected.tier} · {selected.stage}
              </span>
            )}
          </label>

          <Button
            variant="primary"
            size="md"
            type="submit"
            className="w-full"
            disabled={!clientId}
          >
            Sign in
          </Button>

          <p className="text-center text-[11px] text-muted">
            Mock sign-in. Choose a demo client until the backend is ready.
          </p>
        </form>
      </div>
    </div>
  );
}
