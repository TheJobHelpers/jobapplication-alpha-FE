// Pull the sourcing-relevant answers out of a completed CQFO. The public
// questionnaire autosaves answers under `cqfo:<token>` in localStorage, so the
// workspace can seed a client's sourcing preferences from what they actually
// answered (salary + locations are the fields that map cleanly — see note 09).

export interface CqfoDerived {
  salaryMin?: number;
  salaryMax?: number;
  locations?: string[];
}

function toNumber(v: unknown): number | undefined {
  const n = parseInt(String(v ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// Pure derivation from an answers object — shared by the live questionnaire
// (submit payload) and the localStorage reader below.
export function deriveFromAnswers(answers: Record<string, unknown>): CqfoDerived {
  const out: CqfoDerived = {};

  const salary = answers.salary as { from?: string; to?: string } | undefined;
  out.salaryMin = toNumber(salary?.from);
  out.salaryMax = toNumber(salary?.to);

  // Q12 geographic preferences (yes/no + free-text list).
  const geo = answers.geo_prefs as { answer?: string; detail?: string } | undefined;
  if (geo?.answer === "yes" && geo.detail) {
    const locs = geo.detail
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (locs.length) out.locations = locs;
  }

  return out;
}

export function deriveFromCqfo(token?: string): CqfoDerived | null {
  if (!token || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`cqfo:${token}`);
    if (!raw) return null;
    const answers = (JSON.parse(raw)?.answers ?? {}) as Record<string, unknown>;
    const out = deriveFromAnswers(answers);
    if (
      out.salaryMin === undefined &&
      out.salaryMax === undefined &&
      !out.locations
    ) {
      return null; // nothing usable answered yet
    }
    return out;
  } catch {
    return null;
  }
}
