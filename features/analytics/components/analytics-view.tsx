"use client";

import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { DataPagination } from "@/components/shared/data-pagination";
import { NoData, NoResults } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { PostSort, sortByMetric } from "@/lib/analytics";
import { clampPage, pageSlice } from "@/lib/pagination";
import { EMPTY_ANALYTICS_FILTERS, hasAnalyticsFilters, useAnalytics } from "../hooks/use-analytics-calc";
import { AccessRestrictedCard } from "./access-restricted-card";
import { AnalyticsCharts } from "./analytics-charts";
import { AnalyticsFilters } from "./analytics-filters";
import { AnalyticsKpiCards } from "./analytics-kpi-cards";
import { MissingMetrics } from "./missing-metrics";
import { PerformanceList } from "./performance-list";

const SORTS: { value: PostSort; label: string }[] = [
  { value: "views", label: "Impressions" },
  { value: "engagements", label: "Engagements" },
  { value: "clicks", label: "Clicks" },
  { value: "engagementRate", label: "Engagement rate" },
  { value: "ctr", label: "Click-through rate" },
  { value: "newest", label: "Newest" },
];

export function AnalyticsView() {
  const { items, channels } = useWorkspace();
  const { can } = useAuth();
  const [filters, setFilters] = useState(EMPTY_ANALYTICS_FILTERS);
  const [sort, setSort] = useState<PostSort>("views");
  const { withMetrics, summary, missing, channelNameOf } = useAnalytics(items, channels, filters);

  // The page belongs to one set of filters and one sort: any change starts again at page 1.
  const listKey = JSON.stringify([filters, sort]);
  const [paging, setPaging] = useState({ key: listKey, page: 1, size: 25 });
  const page = paging.key === listKey ? clampPage(paging.page, withMetrics.length, paging.size) : 1;
  const ranked = sortByMetric(withMetrics, sort).map((post, i) => ({ post, rank: i + 1 }));

  if (!can("metrics.view")) {
    return <AccessRestrictedCard />;
  }

  const filtered = hasAnalyticsFilters(filters);
  const empty = filtered ? (
    <NoResults onClear={() => setFilters(EMPTY_ANALYTICS_FILTERS)} />
  ) : (
    <NoData
      icon={<BarChart3 />}
      title="No metrics logged yet"
      description="Log impressions, engagements and clicks for published posts to see how they perform."
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Analytics"
        description="See how published posts perform, by content type, channel and over time."
      />

      <AnalyticsFilters filters={filters} onChange={setFilters} />

      <AnalyticsKpiCards summary={summary} />

      {withMetrics.length > 0 ? (
        <AnalyticsCharts posts={withMetrics} channelNameOf={channelNameOf} />
      ) : (
        <Card className="p-0">{empty}</Card>
      )}

      {can("metrics.edit") && <MissingMetrics posts={missing} />}

      <section className="space-y-3" aria-label="Post performance">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Post performance</h2>
          <div className="w-56">
            <ResponsiveSelect
              aria-label="Sort posts"
              value={sort}
              onValueChange={(value) => setSort(value as PostSort)}
              options={SORTS.map((s) => ({ value: s.value, label: `Sort: ${s.label}` }))}
            />
          </div>
        </div>
        <PerformanceList rows={pageSlice(ranked, page, paging.size)} empty={empty} />
        <DataPagination
          page={page}
          pageSize={paging.size}
          total={ranked.length}
          onPageChange={(next) => setPaging({ ...paging, key: listKey, page: next })}
          onPageSizeChange={(size) => setPaging({ key: listKey, page: 1, size })}
        />
      </section>
    </div>
  );
}
