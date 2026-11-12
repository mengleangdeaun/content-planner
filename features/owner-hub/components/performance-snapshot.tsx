"use client";

import React from "react";
import { format } from "date-fns";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Eye, MousePointerClick, TrendingUp } from "lucide-react";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { EmptyState } from "@/components/shared/empty-state";
import { StatsCard } from "@/components/shared/stats-card";
import type { NavView } from "@/components/layout/app-sidebar";
import { DashboardData } from "../hooks/use-dashboard";
import { DashboardSection, SectionLink } from "./dashboard-section";

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const config: ChartConfig = { views: { label: "Impressions", color: "var(--chart-1)" } };

interface Point {
  label: string;
  views: number;
  posts: number;
}

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="grid min-w-36 gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <p className="font-medium text-foreground">{point.label}</p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">Impressions</span>
        <span className="font-medium text-foreground tabular-nums">{point.views.toLocaleString()}</span>
      </p>
      <p className="flex justify-between gap-4 text-muted-foreground">
        <span>Posts</span>
        <span className="tabular-nums">{point.posts}</span>
      </p>
    </div>
  );
}

/** Headline metrics for posts in the period, with a weekly impressions trend. Only for people who can see metrics. */
export function PerformanceSnapshot({ data, onNavigate }: { data: DashboardData; onNavigate: (view: NavView) => void }) {
  const { summary, trend } = data.performance;
  const points: Point[] = trend.map((b) => ({
    label: `Week of ${format(new Date(`${b.key}T00:00:00`), "MMM d")}`,
    views: b.views,
    posts: b.posts,
  }));

  return (
    <DashboardSection
      title="Performance"
      description={`${summary.posts} post${summary.posts === 1 ? "" : "s"} with metrics · ${data.periodLabel}`}
      action={<SectionLink label="Open Analytics" onClick={() => onNavigate("analytics")} />}
    >
      {summary.posts === 0 ? (
        <EmptyState size="sm" icon={<TrendingUp />} title="No metrics in this period" description="Log metrics for published posts to see results here." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <StatsCard label="Impressions" value={compact.format(summary.views)} icon={<Eye />} />
            <StatsCard label="Engagement rate" value={`${summary.engagementRate.toFixed(2)}%`} icon={<TrendingUp />} hint={`${summary.engagements.toLocaleString()} engagements`} />
            <StatsCard label="Click-through rate" value={`${summary.ctr.toFixed(2)}%`} icon={<MousePointerClick />} hint={`${summary.clicks.toLocaleString()} clicks`} />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Impressions by publish week</p>
            <ChartContainer config={config} className="aspect-auto h-56 w-full">
              <LineChart data={points} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={(l: string) => l.replace("Week of ", "")} />
                <YAxis width={48} tickLine={false} axisLine={false} tickFormatter={(v: number) => compact.format(v)} />
                <ChartTooltip content={<PointTooltip />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "var(--color-views)", strokeWidth: 2, stroke: "var(--card)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
            {points.length <= 1 && (
              <p className="text-xs text-muted-foreground">Metrics from more weeks will show a trend.</p>
            )}
            {/* Every value stays reachable for screen readers. */}
            <table className="sr-only">
              <caption>Impressions by publish week</caption>
              <thead>
                <tr>
                  <th scope="col">Week</th>
                  <th scope="col">Impressions</th>
                  <th scope="col">Posts</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.label}>
                    <th scope="row">{p.label}</th>
                    <td>{p.views.toLocaleString()}</td>
                    <td>{p.posts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardSection>
  );
}
