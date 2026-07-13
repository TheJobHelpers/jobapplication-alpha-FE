// Tiny className joiner. Keeps a clsx-style ergonomic without adding a dep;
// falsy values are dropped so conditional classes read cleanly.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
