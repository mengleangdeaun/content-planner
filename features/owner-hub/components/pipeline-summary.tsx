"use client";

import React from "react";
import { Layers } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { NavView } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";
import { statusStyle } from "@/features/content/components/status-style";
import { DashboardData } from "../hooks/use-dashboard";
import { DashboardSection, MeterBar, SectionLink } from "./dashboard-section";

/** Posts in the period per status, in workflow order. */
export function PipelineSummary({ data, onNavigate }: { data: DashboardData; onNavigate: (view: NavView) => void }) {
  const total = data.pipeline.reduce((sum, s) => sum + s.count, 0);
  const max = Math.max(1, ...data.pipeline.map((s) => s.count));
  return (
    <DashboardSection
      title="Pipeline"
      description={`${total} post${total === 1 ? "" : "s"} · ${data.periodLabel}`}
      action={<SectionLink label="View board" onClick={() => onNavigate("pipeline")} />}
    >
      {total === 0 ? (
        <EmptyState size="sm" icon={<Layers />} title="No posts in this period" description="Try a longer period or another channel." />
      ) : (
        <ul className="space-y-2.5">
          {data.pipeline.map(({ status, count }) => (
            <li key={status} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
              <span className="flex items-center gap-2 truncate text-foreground">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", statusStyle(status).dot)} />
                {status}
              </span>
              <MeterBar percent={(count / max) * 100} className={statusStyle(status).dot} label={`${status}: ${count} posts`} />
              <span className={cn("text-right tabular-nums", count === 0 ? "text-muted-foreground" : "font-medium text-foreground")}>
                {count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
