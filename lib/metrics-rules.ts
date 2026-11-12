// Pure checks for logged post metrics. No runtime imports, so `node --test` can load it.

export const REQUIRED_METRICS = ["views_impressions", "engagements", "clicks"] as const;
export const OPTIONAL_METRICS = ["reach", "comments", "shares", "saves"] as const;

const MAX_COUNT = 1e12;

const isDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());

// A count is a whole number of 0 or more, given as a number or as digits.
function isCount(value: unknown): boolean {
  if (typeof value !== "number" && typeof value !== "string") return false;
  if (typeof value === "string" && value.trim() === "") return false;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= MAX_COUNT;
}

const isBlank = (value: unknown) => value === undefined || value === null || value === "";

/** Returns what is wrong with a metrics entry, or null. `today` is "YYYY-MM-DD". */
export function checkInsight(input: Record<string, unknown>, today: string): string | null {
  for (const key of REQUIRED_METRICS) {
    if (!isCount(input[key])) return "Impressions, engagements and clicks must be whole numbers of 0 or more.";
  }
  for (const key of OPTIONAL_METRICS) {
    if (!isBlank(input[key]) && !isCount(input[key])) {
      return "Reach, comments, shares and saves must be whole numbers of 0 or more.";
    }
  }
  const date = input.captured_at;
  if (!isBlank(date)) {
    if (typeof date !== "string" || !isDate(date)) return "The counted-on date must be in YYYY-MM-DD format.";
    if (date > today) return "The counted-on date cannot be in the future.";
  }
  return null;
}
