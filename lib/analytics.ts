// Pure calculations behind the Analytics page. No runtime imports, so `node --test` can load it.

export interface MetricPost {
  id: string;
  title: string;
  status: string;
  publish_date: string;
  insight?: { views_impressions: number; engagements: number; clicks: number };
}

export interface MetricSummary {
  posts: number;
  views: number;
  engagements: number;
  clicks: number;
  /** Percent, e.g. 3.75 for 3.75%. */
  engagementRate: number;
  ctr: number;
}

export type ChartMetric = "views" | "engagementRate" | "ctr";
export type PostSort = "views" | "engagements" | "clicks" | "engagementRate" | "ctr" | "newest";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 10000) / 100 : 0);

export function summarize(posts: MetricPost[]): MetricSummary {
  let views = 0;
  let engagements = 0;
  let clicks = 0;
  for (const p of posts) {
    views += p.insight?.views_impressions ?? 0;
    engagements += p.insight?.engagements ?? 0;
    clicks += p.insight?.clicks ?? 0;
  }
  return { posts: posts.length, views, engagements, clicks, engagementRate: pct(engagements, views), ctr: pct(clicks, views) };
}

export function postRates(p: MetricPost): { engagementRate: number; ctr: number } {
  const views = p.insight?.views_impressions ?? 0;
  return { engagementRate: pct(p.insight?.engagements ?? 0, views), ctr: pct(p.insight?.clicks ?? 0, views) };
}

/** Totals and rates per group (content type, channel...), biggest audience first. */
export function groupMetrics<P extends MetricPost>(posts: P[], keyOf: (post: P) => string): (MetricSummary & { name: string })[] {
  const groups = new Map<string, P[]>();
  for (const p of posts) {
    const key = keyOf(p) || "Other";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups.entries()]
    .map(([name, list]) => ({ name, ...summarize(list) }))
    .sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Monday of the week containing a "YYYY-MM-DD" date, with no timezone involved.
function weekStart(date: string): string {
  const t = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
  const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * DAY_MS;
  return new Date(monday).toISOString().slice(0, 10);
}

/** Posts grouped by publish week (key = that Monday) or month (key = "YYYY-MM"), oldest first. */
export function trendBuckets(posts: MetricPost[], unit: "week" | "month"): (MetricSummary & { key: string })[] {
  const dated = posts.filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.publish_date));
  return groupMetrics(dated, (p) => (unit === "week" ? weekStart(p.publish_date) : p.publish_date.slice(0, 7)))
    .map(({ name, ...summary }) => ({ key: name, ...summary }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/** Published posts, live by today, that have no metrics yet. Oldest first, so the longest-waiting comes first. */
export function missingMetrics<P extends MetricPost>(posts: P[], today: string): (P & { daysSince: number })[] {
  const day = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))) / DAY_MS;
  return posts
    .filter((p) => p.status === "Published" && !p.insight && p.publish_date && p.publish_date <= today)
    .sort((a, b) => a.publish_date.localeCompare(b.publish_date))
    .map((p) => ({ ...p, daysSince: day(today) - day(p.publish_date) }));
}

export function metricValue(summary: Pick<MetricSummary, "views" | "engagementRate" | "ctr">, metric: ChartMetric): number {
  return metric === "views" ? summary.views : summary[metric];
}

export function sortByMetric<P extends MetricPost>(posts: P[], sort: PostSort): P[] {
  const value = (p: P): number | string => {
    if (sort === "newest") return p.publish_date;
    if (sort === "engagementRate" || sort === "ctr") return postRates(p)[sort];
    const key = sort === "views" ? "views_impressions" : sort;
    return p.insight?.[key] ?? 0;
  };
  return [...posts].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    const diff = typeof va === "string" ? (vb as string).localeCompare(va) : (vb as number) - va;
    return diff || a.title.localeCompare(b.title);
  });
}
