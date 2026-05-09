// Format helpers shared across event surfaces.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Always render dates with a year. Accepts:
 *   "2026-06-08"  → "2026-06-08"
 *   "2026-06-08 12:20:00"  → "2026-06-08"
 *   "06-08"  → "<currentYear>-06-08"  (legacy/year-stripped fallback)
 *   Date / number / undefined → safely handled.
 */
export function formatDate(input) {
  if (!input) return "";
  if (typeof input === "string") {
    const m = input.match(ISO_RE);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const md = input.match(/^(\d{2})-(\d{2})$/);
    if (md) return `${new Date().getFullYear()}-${md[1]}-${md[2]}`;
    return input;
  }
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

export function isMealProvided(meal) {
  if (!meal) return false;
  const s = String(meal).trim();
  if (!s) return false;
  return !/不提供|無|沒有|none|no meal/i.test(s);
}
