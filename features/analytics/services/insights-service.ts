import { ContentInsight } from "@/lib/types";

export type InsightInput = Omit<ContentInsight, "entered_by">;

export async function saveContentInsight(insight: InsightInput): Promise<ContentInsight> {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(insight),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to save performance metrics");
  }
  return json.insight;
}

export async function fetchInsightHistory(contentId: string): Promise<ContentInsight[]> {
  const res = await fetch(`/api/insights?content_id=${encodeURIComponent(contentId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Failed to load metrics history");
  return json.history;
}
