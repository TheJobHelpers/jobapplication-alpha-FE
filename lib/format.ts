// Small presentation helpers shared across the client pages (dashboard, review,
// profile) so relative-time and salary formatting read identically everywhere.

export function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatSalaryRange(min?: number, max?: number): string | null {
  const k = (n: number) =>
    n % 1000 === 0 ? `$${n / 1000}k` : `$${Math.round(n / 1000)}k`;
  if (min && max) return `${k(min)}–${k(max)}`;
  if (min) return `${k(min)}+`;
  if (max) return `up to ${k(max)}`;
  return null;
}
