"use client";

import { useState, useMemo } from "react";
import { ContentWithInsight } from "@/lib/types";

export interface AggregateStats {
  totalViews: number;
  totalEngagements: number;
  totalClicks: number;
  avgEngagementRate: string;
  avgCtr: string;
}

export interface TypeComparisonItem {
  name: string;
  views: number;
  engagements: number;
  clicks: number;
  engagementRate: number;
}

export type SortMetric = "views" | "engagements" | "clicks";

export interface AnalyticsCalcState {
  sortBy: SortMetric;
  setSortBy: (sort: SortMetric) => void;
  itemsWithInsights: ContentWithInsight[];
  aggregate: AggregateStats;
  typeComparisonData: TypeComparisonItem[];
  sortedLedger: ContentWithInsight[];
}

export function useAnalyticsCalc(items: ContentWithInsight[]): AnalyticsCalcState {
  const [sortBy, setSortBy] = useState<SortMetric>("views");

  const itemsWithInsights = useMemo(() => {
    return items.filter((item) => item.insight && item.insight.views_impressions > 0);
  }, [items]);

  const aggregate = useMemo<AggregateStats>(() => {
    let totalViews = 0;
    let totalEngagements = 0;
    let totalClicks = 0;

    itemsWithInsights.forEach((i) => {
      totalViews += i.insight?.views_impressions || 0;
      totalEngagements += i.insight?.engagements || 0;
      totalClicks += i.insight?.clicks || 0;
    });

    const avgEngagementRate =
      totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : "0.00";
    const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

    return {
      totalViews,
      totalEngagements,
      totalClicks,
      avgEngagementRate,
      avgCtr,
    };
  }, [itemsWithInsights]);

  const typeComparisonData = useMemo<TypeComparisonItem[]>(() => {
    const stats: Record<
      string,
      { count: number; views: number; engagements: number; clicks: number }
    > = {};

    itemsWithInsights.forEach((item) => {
      const type = item.content_type || "Standard";
      if (!stats[type]) {
        stats[type] = { count: 0, views: 0, engagements: 0, clicks: 0 };
      }
      stats[type].count += 1;
      stats[type].views += item.insight?.views_impressions || 0;
      stats[type].engagements += item.insight?.engagements || 0;
      stats[type].clicks += item.insight?.clicks || 0;
    });

    return Object.entries(stats).map(([name, data]) => ({
      name,
      views: data.views,
      engagements: data.engagements,
      clicks: data.clicks,
      engagementRate:
        data.views > 0
          ? Number(((data.engagements / data.views) * 100).toFixed(2))
          : 0,
    }));
  }, [itemsWithInsights]);

  const sortedLedger = useMemo(() => {
    return [...itemsWithInsights].sort((a, b) => {
      const aVal =
        sortBy === "views"
          ? a.insight?.views_impressions || 0
          : sortBy === "engagements"
          ? a.insight?.engagements || 0
          : a.insight?.clicks || 0;
      const bVal =
        sortBy === "views"
          ? b.insight?.views_impressions || 0
          : sortBy === "engagements"
          ? b.insight?.engagements || 0
          : b.insight?.clicks || 0;
      return bVal - aVal;
    });
  }, [itemsWithInsights, sortBy]);

  return {
    sortBy,
    setSortBy,
    itemsWithInsights,
    aggregate,
    typeComparisonData,
    sortedLedger,
  };
}

