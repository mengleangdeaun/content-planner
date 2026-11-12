"use client";

import React, { useState } from "react";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspace } from "@/context/workspace-context";
import { formatShortDate } from "@/lib/date-utils";
import { ContentWithInsight } from "@/lib/types";

const SHOWN = 5;

/** Published posts still waiting for their first numbers, longest-waiting first. */
export function MissingMetrics({ posts }: { posts: (ContentWithInsight & { daysSince: number })[] }) {
  const { openMetricsModal, openDetailDrawer } = useWorkspace();
  const [showAll, setShowAll] = useState(false);
  if (posts.length === 0) return null;
  const shown = showAll ? posts : posts.slice(0, SHOWN);

  return (
    <Card className="gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Waiting for metrics ({posts.length})</h2>
        <p className="text-xs text-muted-foreground">Published posts with no numbers logged yet.</p>
      </div>
      <ul className="divide-y rounded-md border">
        {shown.map((post) => (
          <li key={post.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => openDetailDrawer(post)}
              className="min-w-0 flex-1 text-left outline-none hover:underline focus-visible:underline"
            >
              <span className="block truncate text-sm text-foreground">{post.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {post.account_name} · published {formatShortDate(post.publish_date)} ·{" "}
                {post.daysSince === 0 ? "today" : `${post.daysSince} day${post.daysSince === 1 ? "" : "s"} ago`}
              </span>
            </button>
            <Button variant="outline" size="sm" onClick={() => openMetricsModal(post)} className="h-10 gap-1.5 md:h-8">
              <BarChart2 /> Log metrics
            </Button>
          </li>
        ))}
      </ul>
      {posts.length > SHOWN && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="h-9 self-start px-2 text-xs md:h-7">
          {showAll ? "Show fewer" : `Show all ${posts.length}`}
        </Button>
      )}
    </Card>
  );
}
