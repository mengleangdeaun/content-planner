"use client";

import React from "react";
import { Award, BarChart2, PanelRightOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ActionButton } from "@/components/shared/action-button";
import { CardList } from "@/components/shared/card-list";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { ContentFormatBadge } from "@/features/content/components/content-format-badge";
import { TypeBadge } from "@/features/taxonomies/components/type-badge";
import { useIsDesktop } from "@/hooks/use-media-query";
import { postRates } from "@/lib/analytics";
import { formatShortDate } from "@/lib/date-utils";
import { ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface RankedPost {
  post: ContentWithInsight;
  rank: number;
}

const num = (n: number) => n.toLocaleString();
const rate = (n: number) => `${n.toFixed(2)}%`;

function Rank({ rank }: { rank: number }) {
  return rank === 1 ? (
    <span className="inline-flex size-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400" aria-label="Rank 1">
      <Award className="size-3.5" />
    </span>
  ) : (
    <span className="text-xs text-muted-foreground tabular-nums">#{rank}</span>
  );
}

function PostCell({ post }: { post: ContentWithInsight }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="line-clamp-2 font-medium text-foreground">{post.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge name={post.content_type} />
        <ContentFormatBadge isPoster={post.is_poster} isVideo={post.is_video} />
        <span className="text-xs text-muted-foreground">
          {post.account_name} · {formatShortDate(post.publish_date)}
        </span>
      </div>
    </div>
  );
}

function Actions({ post, showLabels }: { post: ContentWithInsight; showLabels?: boolean }) {
  const { openMetricsModal, openDetailDrawer } = useWorkspace();
  const { can } = useAuth();
  const variant = showLabels ? "outline" : "ghost";
  return (
    <div className={cn("flex items-center gap-1", showLabels ? "flex-wrap" : "justify-end")}>
      {can("metrics.edit") && (
        <ActionButton icon={<BarChart2 />} label="Log metrics" onClick={() => openMetricsModal(post)} showLabel={showLabels} variant={variant} />
      )}
      <ActionButton icon={<PanelRightOpen />} label="Open post" onClick={() => openDetailDrawer(post)} showLabel={showLabels} variant={variant} />
    </div>
  );
}

const numberCell = "text-right tabular-nums";

const COLUMNS: DataColumn<RankedPost>[] = [
  { key: "rank", header: "Rank", className: "w-14", cell: ({ rank }) => <Rank rank={rank} /> },
  { key: "post", header: "Post", cell: ({ post }) => <PostCell post={post} /> },
  { key: "views", header: "Impressions", className: "w-28", align: "right", cell: ({ post }) => <span className={numberCell}>{num(post.insight?.views_impressions ?? 0)}</span> },
  { key: "eng", header: "Engagements", className: "w-28", align: "right", cell: ({ post }) => <span className={numberCell}>{num(post.insight?.engagements ?? 0)}</span> },
  { key: "clicks", header: "Clicks", className: "w-24", align: "right", cell: ({ post }) => <span className={numberCell}>{num(post.insight?.clicks ?? 0)}</span> },
  { key: "er", header: "Eng. rate", className: "w-24", align: "right", cell: ({ post }) => <span className={numberCell}>{rate(postRates(post).engagementRate)}</span> },
  { key: "ctr", header: "CTR", className: "w-24", align: "right", cell: ({ post }) => <span className={numberCell}>{rate(postRates(post).ctr)}</span> },
  { key: "actions", header: <span className="sr-only">Actions</span>, className: "w-24", align: "right", interactive: true, cell: ({ post }) => <Actions post={post} /> },
];

function PerformanceCard({ row }: { row: RankedPost }) {
  const { post } = row;
  const rates = postRates(post);
  const stats = [
    ["Impressions", num(post.insight?.views_impressions ?? 0)],
    ["Engagements", num(post.insight?.engagements ?? 0)],
    ["Clicks", num(post.insight?.clicks ?? 0)],
    ["Eng. rate", rate(rates.engagementRate)],
    ["CTR", rate(rates.ctr)],
  ];
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <Rank rank={row.rank} />
        <PostCell post={post} />
      </div>
      <dl className="grid grid-cols-3 gap-2 text-xs">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold text-foreground tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto">
        <Actions post={post} showLabels />
      </div>
    </Card>
  );
}

/** Table from 1280px up, cards below. Only one is rendered, chosen with a media query. */
export function PerformanceList({ rows, empty }: { rows: RankedPost[]; empty: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const { openDetailDrawer } = useWorkspace();
  return isDesktop ? (
    <DataTable columns={COLUMNS} rows={rows} getRowKey={(r) => r.post.id} onRowClick={(r) => openDetailDrawer(r.post)} empty={empty} />
  ) : (
    <CardList rows={rows} getRowKey={(r) => r.post.id} renderCard={(r) => <PerformanceCard row={r} />} empty={empty} />
  );
}
