"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ChannelAccount, ContentWithInsight } from "@/lib/types";
import { DateFilterPreset, isDateInFilter } from "@/lib/date-utils";
import { resolveChannelId } from "@/lib/auth/permissions";
import { missingMetrics, summarize } from "@/lib/analytics";

export interface AnalyticsFilters {
  datePreset: DateFilterPreset;
  customStart: string;
  customEnd: string;
  channelIds: string[];
  types: string[];
}

export const EMPTY_ANALYTICS_FILTERS: AnalyticsFilters = {
  datePreset: "all",
  customStart: "",
  customEnd: "",
  channelIds: [],
  types: [],
};

export function hasAnalyticsFilters(f: AnalyticsFilters): boolean {
  return f.datePreset !== "all" || f.channelIds.length > 0 || f.types.length > 0;
}

/** Applies the page filters once; the KPIs, charts, waiting list and table all read from this. */
export function useAnalytics(items: ContentWithInsight[], channels: ChannelAccount[], filters: AnalyticsFilters) {
  return useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const inScope = items.filter(
      (item) =>
        item.status !== "Archived" &&
        isDateInFilter(item.publish_date, filters.datePreset, filters.customStart, filters.customEnd) &&
        (filters.channelIds.length === 0 || filters.channelIds.includes(resolveChannelId(item, channels))) &&
        (filters.types.length === 0 || filters.types.includes(item.content_type))
    );
    const withMetrics = inScope.filter((item) => item.insight);
    return {
      withMetrics,
      summary: summarize(withMetrics),
      missing: missingMetrics(inScope, today),
      channelNameOf: (item: ContentWithInsight) => {
        const channel = channels.find((c) => c.id === resolveChannelId(item, channels));
        return channel ? `${channel.platform} — ${channel.account_name}` : `${item.platform} — ${item.account_name}`;
      },
    };
  }, [items, channels, filters]);
}
