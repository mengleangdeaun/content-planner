"use client";

import React from "react";
import { Share2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { NavView } from "@/components/layout/app-sidebar";
import { ChannelHealthBar } from "@/features/channels/components/channel-health-bar";
import { DashboardData } from "../hooks/use-dashboard";
import { DashboardSection, SectionLink } from "./dashboard-section";

/** Planned posts per channel against its weekly quota, scaled to the period. */
export function ChannelTargets({ data, onNavigate }: { data: DashboardData; onNavigate: (view: NavView) => void }) {
  const periodLabel = data.hasEnd ? data.periodLabel.toLowerCase() : "this week";
  return (
    <DashboardSection
      title="Channel targets"
      description={data.hasEnd ? "Weekly quotas scaled to this period" : "All dates has no end, so this shows this week"}
      action={<SectionLink label="Channels" onClick={() => onNavigate("channels")} />}
    >
      {data.targets.length === 0 ? (
        <EmptyState size="sm" icon={<Share2 />} title="No channels to show" description="Add a channel, or clear the channel filter." />
      ) : (
        <ul className="space-y-4">
          {data.targets.map(({ channel, health }) => (
            <li key={channel.id} className="space-y-1.5">
              <p className="truncate text-sm font-medium text-foreground">
                {channel.platform} — {channel.account_name}
              </p>
              <ChannelHealthBar health={health} periodLabel={periodLabel} />
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
