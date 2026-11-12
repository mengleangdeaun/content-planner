"use client";

import React from "react";
import { Tags } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { NavView } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";
import { DashboardData } from "../hooks/use-dashboard";
import { DashboardSection, SectionLink } from "./dashboard-section";

// Within 5 points of the target counts as on target.
const TOLERANCE = 5;

/** Each type's share of the period's posts, with its target marked on the same bar. */
export function ContentMix({ data, onNavigate }: { data: DashboardData; onNavigate: (view: NavView) => void }) {
  return (
    <DashboardSection
      title="Content mix"
      description={`Share of posts by type · ${data.periodLabel}`}
      action={<SectionLink label="Content types" onClick={() => onNavigate("taxonomies")} />}
    >
      {data.mix.length === 0 ? (
        <EmptyState size="sm" icon={<Tags />} title="No posts in this period" description="The mix appears once posts are planned." />
      ) : (
        <ul className="space-y-3.5">
          {data.mix.map((type) => {
            const off = type.targetPct > 0 && Math.abs(type.actualPct - type.targetPct) > TOLERANCE;
            return (
              <li key={type.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-foreground">{type.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    <span className="font-medium text-foreground">{type.actualPct}%</span>
                    {type.targetPct > 0 ? ` of ${type.targetPct}% target` : " · no target"}
                    {` · ${type.count} post${type.count === 1 ? "" : "s"}`}
                  </span>
                </div>
                <div
                  role="meter"
                  aria-label={`${type.name}: ${type.actualPct}%${type.targetPct ? `, target ${type.targetPct}%` : ""}`}
                  aria-valuenow={type.actualPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="relative h-1.5 rounded-full bg-muted"
                >
                  <div
                    className={cn("h-full rounded-full", off ? "bg-amber-500" : "bg-primary")}
                    style={{ width: `${Math.min(100, type.actualPct)}%` }}
                  />
                  {type.targetPct > 0 && (
                    // The target as a tick, so actual and target read on one bar.
                    <span
                      aria-hidden
                      className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
                      style={{ left: `${Math.min(100, type.targetPct)}%` }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
