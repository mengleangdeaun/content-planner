"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, Eye, Heart, MousePointerClick } from "lucide-react";
import { AggregateStats } from "../hooks/use-analytics-calc";

interface AnalyticsKpiCardsProps {
  aggregate: AggregateStats;
}

export function AnalyticsKpiCards({ aggregate }: AnalyticsKpiCardsProps) {
  const { totalViews, totalEngagements, totalClicks, avgEngagementRate, avgCtr } = aggregate;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="p-4 gap-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Gross Impressions</span>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {totalViews.toLocaleString()}
        </div>
        <span className="text-xs text-muted-foreground">Aggregated across posts</span>
      </Card>

      <Card className="p-4 gap-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Total Interactions</span>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {totalEngagements.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-600" />
          <span className="text-emerald-600 font-medium">{avgEngagementRate}%</span>
          <span>avg engagement</span>
        </div>
      </Card>

      <Card className="p-4 gap-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>Outbound Link Clicks</span>
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {totalClicks.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="font-semibold text-primary">{avgCtr}%</span>
          <span>overall CTR</span>
        </div>
      </Card>

      <Card className="p-4 gap-1 border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between text-xs text-primary font-medium">
          <span>Return Efficiency</span>
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-primary">
          {avgEngagementRate}%
        </div>
        <span className="text-xs text-muted-foreground">Average Audience Capture</span>
      </Card>
    </div>
  );
}

