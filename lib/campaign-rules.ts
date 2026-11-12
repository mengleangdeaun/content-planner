// Pure campaign helpers, shared by the page and its tests. No runtime imports, so `node --test` can load it.

export const MAX_LINK_BATCH = 200;

export type CampaignSort = "start" | "end" | "name";

export const CAMPAIGN_SORTS: { value: CampaignSort; label: string }[] = [
  { value: "start", label: "Start date" },
  { value: "end", label: "End date" },
  { value: "name", label: "Name" },
];

interface CampaignLike {
  name: string;
  goal?: string;
  status: string;
  start_date?: string;
  end_date?: string;
}

/** What a picker change means: posts to add to the campaign, and posts to take out of it. */
export function linkChanges(currentIds: string[], selectedIds: string[]): { add: string[]; remove: string[] } {
  const current = new Set(currentIds);
  const selected = new Set(selectedIds);
  return {
    add: selectedIds.filter((id) => !current.has(id)),
    remove: currentIds.filter((id) => !selected.has(id)),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Whole days from "YYYY-MM-DD", with no timezone involved.
const toDay = (value: string) =>
  Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))) / DAY_MS;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function campaignTiming(campaign: Pick<CampaignLike, "start_date" | "end_date">, today: string): string {
  const { start_date: start, end_date: end } = campaign;
  if (!start && !end) return "No dates";
  const now = toDay(today);
  if (start && toDay(start) > now) {
    const days = toDay(start) - now;
    return days === 1 ? "Starts tomorrow" : `Starts in ${days} days`;
  }
  if (!end) return "Running";
  const left = toDay(end) - now;
  if (left < 0) return "Ended";
  if (left === 0) return "Ends today";
  return `${plural(left, "day")} left`;
}

export const BREAKDOWN_BUCKETS = [
  { key: "published", label: "Published", statuses: ["Published"] },
  { key: "ready", label: "Ready", statuses: ["Approved", "Scheduled"] },
  { key: "review", label: "In review", statuses: ["In Review"] },
  { key: "progress", label: "In progress", statuses: ["Draft", "In Production", "In Revise"] },
] as const;

export function campaignBreakdown(posts: { status: string }[]) {
  const live = posts.filter((p) => p.status !== "Archived");
  return BREAKDOWN_BUCKETS.map((bucket) => {
    const count = live.filter((p) => (bucket.statuses as readonly string[]).includes(p.status)).length;
    return { key: bucket.key, label: bucket.label, count, percent: live.length ? (count / live.length) * 100 : 0 };
  });
}

export function filterCampaigns<C extends CampaignLike>(
  campaigns: C[],
  filters: { search: string; statuses: string[] }
): C[] {
  const query = filters.search.trim().toLowerCase();
  return campaigns.filter((c) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(c.status)) return false;
    return !query || c.name.toLowerCase().includes(query) || (c.goal ?? "").toLowerCase().includes(query);
  });
}

// Blank dates sort after real ones.
const LAST = "9999-12-31";

export function sortCampaigns<C extends CampaignLike>(campaigns: C[], sort: CampaignSort): C[] {
  return [...campaigns].sort((a, b) => {
    const byName = a.name.localeCompare(b.name);
    if (sort === "name") return byName;
    const key = sort === "start" ? "start_date" : "end_date";
    return (a[key] || LAST).localeCompare(b[key] || LAST) || byName;
  });
}
