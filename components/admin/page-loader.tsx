// Full-height centered loader for admin pages while they fetch from the API
// client-side (data is cookie-scoped, so it can't be fetched server-side).
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-muted">
      Loading…
    </div>
  );
}
