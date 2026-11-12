"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ChartMetric, MetricSummary, groupMetrics, metricValue, trendBuckets } from "@/lib/analytics";
import { ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

const METRICS: { value: ChartMetric; label: string }[] = [
  { value: "views", label: "Impressions" },
  { value: "engagementRate", label: "Engagement rate" },
  { value: "ctr", label: "Click-through rate" },
];

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const formatMetric = (metric: ChartMetric, value: number, short = false) =>
  metric === "views" ? (short ? compact.format(value) : value.toLocaleString()) : `${value.toFixed(2)}%`;

interface Point extends MetricSummary {
  label: string;
  value: number;
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-md border p-0.5" role="group" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "secondary" : "ghost"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="h-9 px-3 text-xs md:h-7"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

// Tooltips enhance; this keeps every value reachable for screen readers too.
function ChartTable({ caption, metric, points }: { caption: string; metric: ChartMetric; points: Point[] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Group</th>
          <th scope="col">{METRICS.find((m) => m.value === metric)?.label}</th>
          <th scope="col">Posts</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.label}>
            <th scope="row">{p.label}</th>
            <td>{formatMetric(metric, p.value)}</td>
            <td>{p.posts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PointTooltip({ active, payload, metric }: { active?: boolean; payload?: { payload: Point }[]; metric: ChartMetric }) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="grid min-w-40 gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <p className="font-medium text-foreground">{point.label}</p>
      <p className="flex justify-between gap-4">
        <span className="text-muted-foreground">{METRICS.find((m) => m.value === metric)?.label}</span>
        <span className="font-medium text-foreground tabular-nums">{formatMetric(metric, point.value)}</span>
      </p>
      <p className="flex justify-between gap-4 text-muted-foreground">
        <span>Posts</span>
        <span className="tabular-nums">{point.posts}</span>
      </p>
      {metric !== "views" && (
        <p className="flex justify-between gap-4 text-muted-foreground">
          <span>Impressions</span>
          <span className="tabular-nums">{point.views.toLocaleString()}</span>
        </p>
      )}
    </div>
  );
}

interface AnalyticsChartsProps {
  posts: ContentWithInsight[];
  channelNameOf: (post: ContentWithInsight) => string;
}

/** One metric at a time, so every bar and point shares a single sensible scale. */
export function AnalyticsCharts({ posts, channelNameOf }: AnalyticsChartsProps) {
  const [metric, setMetric] = useState<ChartMetric>("views");
  const [groupBy, setGroupBy] = useState<"type" | "channel">("type");
  const [unit, setUnit] = useState<"week" | "month">("week");
  const metricLabel = METRICS.find((m) => m.value === metric)!.label;
  const config: ChartConfig = { value: { label: metricLabel, color: "var(--chart-1)" } };

  const groups: Point[] = groupMetrics(posts, groupBy === "type" ? (p) => p.content_type : channelNameOf).map((g) => ({
    ...g,
    label: g.name,
    value: metricValue(g, metric),
  }));
  const trend: Point[] = trendBuckets(posts, unit).map((b) => ({
    ...b,
    label: unit === "week" ? `Week of ${format(new Date(`${b.key}T00:00:00`), "MMM d")}` : format(new Date(`${b.key}-01T00:00:00`), "MMM yyyy"),
    value: metricValue(b, metric),
  }));

  return (
    <section className="space-y-3" aria-label="Charts">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Performance charts</h2>
        <Toggle label="Metric" value={metric} options={METRICS} onChange={setMetric} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{metricLabel} by {groupBy === "type" ? "content type" : "channel"}</h3>
              <p className="text-xs text-muted-foreground">Highest impressions first</p>
            </div>
            <Toggle
              label="Compare by"
              value={groupBy}
              options={[
                { value: "type", label: "Content type" },
                { value: "channel", label: "Channel" },
              ]}
              onChange={setGroupBy}
            />
          </div>
          <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(160, groups.length * 40 + 24) }}>
            <BarChart data={groups} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="label" width={128} tickLine={false} axisLine={false} interval={0} />
              <ChartTooltip cursor={false} content={<PointTooltip metric={metric} />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} barSize={16}>
                <LabelList
                  dataKey="value"
                  position="right"
                  className="fill-muted-foreground text-xs"
                  formatter={(value: unknown) => formatMetric(metric, Number(value), true)}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
          <ChartTable caption={`${metricLabel} by ${groupBy}`} metric={metric} points={groups} />
        </Card>

        <Card className="gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{metricLabel} over time</h3>
              <p className="text-xs text-muted-foreground">By publish {unit}</p>
            </div>
            <Toggle
              label="Group by"
              value={unit}
              options={[
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
              ]}
              onChange={setUnit}
            />
          </div>
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <LineChart data={trend} margin={{ top: 12, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={(l: string) => l.replace("Week of ", "")} />
              <YAxis
                width={52}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatMetric(metric, v, true)}
              />
              <ChartTooltip content={<PointTooltip metric={metric} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--color-value)", strokeWidth: 2, stroke: "var(--card)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
          <p className={cn("text-xs text-muted-foreground", trend.length > 1 && "sr-only")}>
            {trend.length <= 1 && "Log metrics for posts in more weeks or months to see a trend."}
          </p>
          <ChartTable caption={`${metricLabel} by publish ${unit}`} metric={metric} points={trend} />
        </Card>
      </div>
    </section>
  );
}
