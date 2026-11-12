"use client";

import React from "react";
import { CalendarCheck, CheckCircle2, Eye, FileEdit, Layers } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { ContentWithInsight } from "@/lib/types";

const GROUPS = [
  { label: "In progress", statuses: ["Draft", "In Production", "In Revise"], icon: <FileEdit />, hint: "Draft, production, revise" },
  { label: "In review", statuses: ["In Review"], icon: <Eye />, hint: "Waiting for approval" },
  { label: "Ready", statuses: ["Approved", "Scheduled"], icon: <CalendarCheck />, hint: "Approved or scheduled" },
  { label: "Published", statuses: ["Published"], icon: <CheckCircle2 />, hint: "Live across channels" },
] as const;

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((s) => b.includes(s));

interface ContentStatsCardsProps {
  items: ContentWithInsight[];
  /** The Status filter currently applied. */
  statuses: string[];
  onStatusesChange: (statuses: string[]) => void;
}

// Each card is a shortcut for the Status filter; clicking the active card again clears it.
export function ContentStatsCards({ items, statuses, onStatusesChange }: ContentStatsCardsProps) {
  const count = (group: readonly string[]) => items.filter((i) => group.includes(i.status)).length;
  const posters = items.filter((i) => i.is_poster).length;
  const videos = items.filter((i) => i.is_video).length;

  return (
    <StatsGrid columns={5}>
      <StatsCard
        label="Total"
        value={items.length}
        icon={<Layers />}
        hint={`${posters} posters · ${videos} videos`}
        active={statuses.length === 0}
        onClick={() => onStatusesChange([])}
      />
      {GROUPS.map((group) => {
        const active = sameSet(statuses, group.statuses);
        const value = count(group.statuses);
        return (
          <StatsCard
            key={group.label}
            label={group.label}
            value={value}
            icon={group.icon}
            hint={group.hint}
            tone={group.label === "In review" && value > 0 ? "warning" : "default"}
            active={active}
            onClick={() => onStatusesChange(active ? [] : [...group.statuses])}
          />
        );
      })}
    </StatsGrid>
  );
}
