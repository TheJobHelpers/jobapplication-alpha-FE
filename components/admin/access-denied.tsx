import { Panel } from "@/components/ui/panel";

// Shown when the current (mock) role can't see a page. Switch role in the nav
// rail's "Viewing as" to access it.
export function AccessDenied({ need }: { need: string }) {
  return (
    <div className="mx-auto max-w-2xl px-8 py-16">
      <Panel className="p-8 text-center">
        <p className="text-[13px] font-semibold text-zinc-200">
          This area is for {need}.
        </p>
        <p className="mt-2 text-[12.5px] text-muted">
          Your current role can&apos;t see it. Use “Viewing as” in the sidebar to
          switch role.
        </p>
      </Panel>
    </div>
  );
}
