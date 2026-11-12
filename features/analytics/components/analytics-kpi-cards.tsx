"use client";

import React from "react";
import { Eye, Heart, MousePointerClick, TrendingUp } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { MetricSummary } from "@/lib/analytics";

export function AnalyticsKpiCards({ summary }: { summary: MetricSummary }) {
  return (
    <StatsGrid columns={4}>
      <StatsCard
        label="Impressions"
        value={summary.views.toLocaleString()}
        icon={<Eye />}
        hint={`Across ${summary.posts} post${summary.posts === 1 ? "" : "s"} with metrics`}
      />
      <StatsCard
        label="Engagements"
        value={summary.engagements.toLocaleString()}
        icon={<Heart />}
        hint={`${summary.engagementRate}% engagement rate`}
      />
      <StatsCard
        label="Link clicks"
        value={summary.clicks.toLocaleString()}
        icon={<MousePointerClick />}
        hint={`${summary.ctr}% click-through rate`}
      />
      <StatsCard
        label="Engagement rate"
        value={`${summary.engagementRate}%`}
        icon={<TrendingUp />}
        tone="primary"
        hint="Engagements per impression"
      />
    </StatsGrid>
  );
}
