"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ChannelAccount, ContentTask, ContentTypeConfig, ContentWithInsight } from "@/lib/types";
import { DATE_PRESET_OPTIONS, DateFilterPreset, isDateInFilter } from "@/lib/date-utils";
import { Member, resolveChannelId } from "@/lib/auth/permissions";
import { needsReview, periodDays, periodTarget, statusCounts, workload } from "@/lib/dashboard";
import { channelHealth, typeShares } from "@/lib/settings-rules";
import { BOARD_STATUSES, isOverdue } from "@/lib/workflow";
import { summarize, trendBuckets } from "@/lib/analytics";

export interface DashboardFilters {
  datePreset: DateFilterPreset;
  customStart: string;
  customEnd: string;
  channelIds: string[];
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  datePreset: "this-week",
  customStart: "",
  customEnd: "",
  channelIds: [],
};

export function hasDashboardFilters(f: DashboardFilters): boolean {
  return f.datePreset !== DEFAULT_DASHBOARD_FILTERS.datePreset || f.channelIds.length > 0;
}

const READY = ["Approved", "Scheduled", "Published"];
const byPublish = (a: ContentWithInsight, b: ContentWithInsight) =>
  `${a.publish_date} ${a.publish_time ?? ""}`.localeCompare(`${b.publish_date} ${b.publish_time ?? ""}`);

interface DashboardInput {
  items: ContentWithInsight[];
  channels: ChannelAccount[];
  tasks: ContentTask[];
  contentTypes: ContentTypeConfig[];
  member: Member;
  filters: DashboardFilters;
}

/** Filters posts once; every section reads from the result. */
export function useDashboard({ items, channels, tasks, contentTypes, member, filters }: DashboardInput) {
  return useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { datePreset, customStart, customEnd, channelIds } = filters;
    const inChannels = (channelId: string) => channelIds.length === 0 || channelIds.includes(channelId);

    // "Needs attention" and "Next 7 days" are about now, so they ignore the period.
    const live = items.filter((item) => item.status !== "Archived" && inChannels(resolveChannelId(item, channels)));
    const inPeriod = live.filter((item) => isDateInFilter(item.publish_date, datePreset, customStart, customEnd));
    const liveIds = new Set(live.map((item) => item.id));

    const days = periodDays(datePreset, today, customStart, customEnd);
    const shownChannels = channels.filter((c) => c.status !== "Archived" && inChannels(c.id));
    const targets = shownChannels.map((channel) => {
      const posts = live.filter((item) => resolveChannelId(item, channels) === channel.id);
      const health = channelHealth(channel, posts, today);
      // With no end date there is no target, so the channel keeps its usual weekly view.
      if (days === null) return { channel, health };
      const planned = inPeriod.filter((item) => resolveChannelId(item, channels) === channel.id).length;
      const quota = periodTarget(channel.weekly_target_quota, days);
      const state = channel.status === "Paused" ? "paused" : planned >= quota ? "on-track" : "behind";
      return { channel, health: { ...health, planned, quota, state } as typeof health };
    });
    const target = days === null
      ? null
      : shownChannels.filter((c) => c.status === "Active").reduce((sum, c) => sum + periodTarget(c.weekly_target_quota, days), 0);

    const withMetrics = inPeriod.filter((item) => item.insight);

    return {
      today,
      periodLabel: DATE_PRESET_OPTIONS.find((o) => o.value === datePreset)?.label ?? "This period",
      hasEnd: days !== null,
      stats: {
        planned: inPeriod.length,
        target,
        ready: inPeriod.filter((item) => READY.includes(item.status)).length,
        published: inPeriod.filter((item) => item.status === "Published").length,
        overdue: inPeriod.filter((item) => isOverdue(item, today)).length,
      },
      attention: {
        overdue: live.filter((item) => isOverdue(item, today)).sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
        review: needsReview(live, member).sort(byPublish),
        // Undated tasks sort last.
        myTasks: tasks
          .filter((t) => t.assignee_email === member.email && (t.status === "open" || t.status === "in_progress") && liveIds.has(t.content_id))
          .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999")),
      },
      upcoming: live.filter((item) => isDateInFilter(item.publish_date, "next-7-days")).sort(byPublish),
      targets,
      pipeline: statusCounts(inPeriod, BOARD_STATUSES),
      mix: typeShares(inPeriod, contentTypes).filter((t) => t.count > 0 || t.targetPct > 0),
      workload: workload(inPeriod, tasks),
      performance: { summary: summarize(withMetrics), trend: trendBuckets(withMetrics, "week") },
    };
  }, [items, channels, tasks, contentTypes, member, filters]);
}

export type DashboardData = ReturnType<typeof useDashboard>;
