import { ContentInsight } from "@/lib/types";

export async function saveContentInsight(insight: ContentInsight): Promise<void> {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(insight),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to save performance metrics");
  }
}

