"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChannelAccount, ContentWithInsight } from "@/lib/types";
import { DateFilterPreset, isDateInFilter } from "@/lib/date-utils";
import { resolveChannelId } from "@/lib/auth/permissions";
import { ContentFilters, EMPTY_FILTERS, filterContent, hasActiveFilters } from "@/lib/content-filter";
import { isOverdue } from "@/lib/workflow";

export interface ContentFilterState {
  filters: ContentFilters;
  setFilters: (patch: Partial<ContentFilters>) => void;
  datePreset: DateFilterPreset;
  setDatePreset: (preset: DateFilterPreset) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  /** Changes whenever any filter changes, so lists can return to page 1. */
  filterKey: string;
  filteredItems: ContentWithInsight[];
}

export function useContentFilter(
  items: ContentWithInsight[],
  channels: ChannelAccount[],
  currentEmail: string
): ContentFilterState {
  const [filters, setAllFilters] = useState<ContentFilters>(EMPTY_FILTERS);
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const filteredItems = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return filterContent(items, filters, {
      channelIdOf: (item) => resolveChannelId(item, channels),
      inDateRange: (date) => isDateInFilter(date, datePreset, customStartDate, customEndDate),
      isOverdue: (item) => isOverdue(item, today),
      currentEmail,
    });
  }, [items, channels, filters, datePreset, customStartDate, customEndDate, currentEmail]);

  const resetFilters = () => {
    setAllFilters(EMPTY_FILTERS);
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  return {
    filters,
    setFilters: (patch) => setAllFilters((current) => ({ ...current, ...patch })),
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    resetFilters,
    hasActiveFilters:
      hasActiveFilters(filters) || datePreset !== "all" || Boolean(customStartDate) || Boolean(customEndDate),
    filterKey: JSON.stringify([filters, datePreset, customStartDate, customEndDate]),
    filteredItems,
  };
}
