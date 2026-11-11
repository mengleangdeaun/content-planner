"use client";

import { useState, useMemo } from "react";
import { ContentWithInsight, ChannelAccount } from "@/lib/types";
import { isDateInFilter, DateFilterPreset } from "@/lib/date-utils";

export interface OwnerHubMetricsState {
  datePeriod: DateFilterPreset;
  setDatePeriod: (period: DateFilterPreset) => void;
  customStart: string;
  setCustomStart: (date: string) => void;
  customEnd: string;
  setCustomEnd: (date: string) => void;
  selectedChannelId: string;
  setSelectedChannelId: (id: string) => void;
  selectedChannel: ChannelAccount | undefined;
  filterEducationalOnly: boolean;
  setFilterEducationalOnly: (only: boolean) => void;
  channelPeriodItems: ContentWithInsight[];
  displayRows: ContentWithInsight[];
  educationalCount: number;
  promotionalCount: number;
  scheduledOrPublishedCount: number;
  posterCount: number;
  videoCount: number;
  datePeriodLabels: Record<DateFilterPreset, string>;
}

export const DATE_PERIOD_LABELS: Record<DateFilterPreset, string> = {
  all: "All Time",
  today: "Today",
  "this-week": "This Week (Current Period)",
  "this-month": "This Month",
  "next-7-days": "Next 7 Days",
  "past-30-days": "Past 30 Days",
  custom: "Custom Date Range",
};

export function useOwnerHubMetrics(
  items: ContentWithInsight[],
  channels: ChannelAccount[]
): OwnerHubMetricsState {
  const [datePeriod, setDatePeriod] = useState<DateFilterPreset>("this-week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [filterEducationalOnly, setFilterEducationalOnly] = useState(true);

  // Default to Facebook ABC if present, otherwise first channel
  const defaultChannelId = useMemo(() => {
    const fbAbc = channels.find(
      (c) => c.platform.toLowerCase() === "facebook" && c.account_name.toLowerCase() === "abc"
    );
    return fbAbc?.id || channels[0]?.id || "CHAN-101";
  }, [channels]);

  const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannelId);

  const selectedChannel = useMemo(() => {
    return channels.find((c) => c.id === selectedChannelId) || channels[0];
  }, [channels, selectedChannelId]);

  // Filter items matching the selected channel & date period
  const channelPeriodItems = useMemo(() => {
    if (!selectedChannel) return [];
    return items.filter(
      (item) =>
        item.platform === selectedChannel.platform &&
        item.account_name === selectedChannel.account_name &&
        isDateInFilter(item.publish_date, datePeriod, customStart, customEnd)
    );
  }, [items, selectedChannel, datePeriod, customStart, customEnd]);

  // Strategic KPI: Educational Content Planned
  const educationalCount = useMemo(() => {
    return channelPeriodItems.filter((item) => item.content_type === "Educational").length;
  }, [channelPeriodItems]);

  const promotionalCount = useMemo(() => {
    return channelPeriodItems.filter((item) => item.content_type === "Promotional").length;
  }, [channelPeriodItems]);

  const scheduledOrPublishedCount = useMemo(() => {
    return channelPeriodItems.filter(
      (item) => item.status === "Approved" || item.status === "Scheduled" || item.status === "Published"
    ).length;
  }, [channelPeriodItems]);

  const posterCount = useMemo(() => {
    return channelPeriodItems.filter((item) => item.is_poster).length;
  }, [channelPeriodItems]);

  const videoCount = useMemo(() => {
    return channelPeriodItems.filter((item) => item.is_video).length;
  }, [channelPeriodItems]);

  // Filtered Table Rows
  const displayRows = useMemo(() => {
    if (filterEducationalOnly) {
      return channelPeriodItems.filter((item) => item.content_type === "Educational");
    }
    return channelPeriodItems;
  }, [channelPeriodItems, filterEducationalOnly]);

  return {
    datePeriod,
    setDatePeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    selectedChannelId,
    setSelectedChannelId,
    selectedChannel,
    filterEducationalOnly,
    setFilterEducationalOnly,
    channelPeriodItems,
    displayRows,
    educationalCount,
    promotionalCount,
    scheduledOrPublishedCount,
    posterCount,
    videoCount,
    datePeriodLabels: DATE_PERIOD_LABELS,
  };
}

