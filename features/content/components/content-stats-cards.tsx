"use client";

import React, { useMemo } from "react";
import { ContentWithInsight } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Layers, FileEdit, Clock, CheckCircle2 } from "lucide-react";

interface ContentStatsCardsProps {
  items: ContentWithInsight[];
}

export function ContentStatsCards({ items }: ContentStatsCardsProps) {
  const stats = useMemo(() => {
    return {
      total: items.length,
      inProduction: items.filter(
        (i) => i.status === "Draft" || i.status === "In Production" || i.status === "In Revise"
      ).length,
      inReview: items.filter((i) => i.status === "In Review").length,
      approved: items.filter((i) => i.status === "Approved").length,
      scheduled: items.filter((i) => i.status === "Scheduled").length,
      published: items.filter((i) => i.status === "Published").length,
      posters: items.filter((i) => i.is_poster).length,
      videos: items.filter((i) => i.is_video).length,
      both: items.filter((i) => i.is_poster && i.is_video).length,
    };
  }, [items]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card className="p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Total Pipeline</span>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {stats.total}
        </div>
        <div className="text-xs text-muted-foreground flex gap-1.5 pt-0.5 flex-wrap">
          <span>{stats.posters} Posters</span>
          <span>&bull;</span>
          <span>{stats.videos} Videos</span>
          {stats.both > 0 && (
            <>
              <span>&bull;</span>
              <span className="text-primary font-medium">{stats.both} Both</span>
            </>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>In Production & Revise</span>
          <FileEdit className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {stats.inProduction}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {stats.inReview > 0 ? (
            <span className="text-amber-600 font-medium">{stats.inReview} awaiting review</span>
          ) : (
            <span>Actively being drafted</span>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Approved & Ready</span>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {stats.approved + stats.scheduled}
        </div>
        <div className="text-xs text-muted-foreground">
          <span>{stats.approved} Approved &bull; {stats.scheduled} Scheduled</span>
        </div>
      </Card>

      <Card className="p-4 space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Published Live</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {stats.published}
        </div>
        <span className="text-xs text-muted-foreground">Live across channels</span>
      </Card>
    </div>
  );
}
