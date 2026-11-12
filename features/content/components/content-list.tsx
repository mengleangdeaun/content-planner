"use client";

import React from "react";
import { format } from "date-fns";
import { BarChart2, FileText, PanelRightOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ActionButton } from "@/components/shared/action-button";
import { CardList } from "@/components/shared/card-list";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { TypeBadge } from "@/features/taxonomies/components/type-badge";
import { useIsDesktop } from "@/hooks/use-media-query";
import { formatShortDate } from "@/lib/date-utils";
import { ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NO_TASKS, isOverdue } from "@/lib/workflow";
import { ContentFormatBadge } from "./content-format-badge";
import { ContentStatusSelect } from "./content-status-select";
import { AssigneePicker } from "./assignee-picker";

// Due date and task progress, shown under the status in both layouts.
function WorkSummary({ item }: { item: ContentWithInsight }) {
  const { taskProgressById } = useWorkspace();
  const progress = taskProgressById.get(item.id) ?? NO_TASKS;
  const overdue = isOverdue(item, format(new Date(), "yyyy-MM-dd"));
  if (!item.due_date && progress.total === 0) return null;
  return (
    <div className="space-y-0.5 text-xs">
      {item.due_date && (
        <p className={cn(overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
          {overdue ? "Overdue" : "Due"} {formatShortDate(item.due_date)}
        </p>
      )}
      {progress.total > 0 && (
        <p className="text-muted-foreground">
          Tasks {progress.done}/{progress.total}
        </p>
      )}
    </div>
  );
}

function PostActions({ item, showLabels }: { item: ContentWithInsight; showLabels?: boolean }) {
  const { openDetailDrawer, openMetricsModal } = useWorkspace();
  const { can } = useAuth();
  return (
    <div className={cn("flex items-center gap-1", showLabels ? "flex-wrap" : "justify-end")}>
      {item.workspace_file_url && (
        <ActionButton icon={<FileText />} label="Open document" href={item.workspace_file_url} showLabel={showLabels} variant={showLabels ? "outline" : "ghost"} />
      )}
      {item.status === "Published" && can("metrics.edit") && (
        <ActionButton icon={<BarChart2 />} label="Log metrics" onClick={() => openMetricsModal(item)} showLabel={showLabels} variant={showLabels ? "outline" : "ghost"} />
      )}
      <ActionButton icon={<PanelRightOpen />} label="Open details" onClick={() => openDetailDrawer(item)} showLabel={showLabels} variant={showLabels ? "outline" : "ghost"} />
    </div>
  );
}

function useColumns(): DataColumn<ContentWithInsight>[] {
  const { onStatusChange } = useWorkspace();

  return [
    {
      key: "post",
      header: "Post",
      cell: (item) => (
        <div className="min-w-0 space-y-1.5">
          <p className="line-clamp-2 font-medium text-foreground">{item.title}</p>
          {item.copy_text && <p className="line-clamp-1 text-xs text-muted-foreground">{item.copy_text}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge name={item.content_type} />
            <ContentFormatBadge isPoster={item.is_poster} isVideo={item.is_video} />
            <span className="font-mono text-[11px] text-muted-foreground">{item.id}</span>
          </div>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      className: "w-40",
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{item.account_name}</p>
          <p className="truncate text-xs text-muted-foreground">{item.platform}</p>
        </div>
      ),
    },
    {
      key: "publish",
      header: "Publish",
      className: "w-28",
      cell: (item) => (
        <div>
          <p className="font-medium text-foreground">{formatShortDate(item.publish_date)}</p>
          <p className="text-xs text-muted-foreground">{item.publish_time || "No time"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-44",
      interactive: true,
      cell: (item) => (
        <div className="space-y-1.5">
          <ContentStatusSelect item={item} onStatusChange={onStatusChange} className="h-8 w-full text-xs" />
          <WorkSummary item={item} />
        </div>
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      className: "w-40",
      interactive: true,
      cell: (item) => <AssigneePicker item={item} className="h-8 text-xs" />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-32",
      align: "right",
      interactive: true,
      cell: (item) => <PostActions item={item} />,
    },
  ];
}

function ContentCard({ item }: { item: ContentWithInsight }) {
  const { onStatusChange, openDetailDrawer } = useWorkspace();

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <button type="button" onClick={() => openDetailDrawer(item)} className="space-y-1 text-left outline-none focus-visible:underline">
        <p className="line-clamp-2 font-semibold text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {item.platform} · {item.account_name} · {formatShortDate(item.publish_date)}
          {item.publish_time && ` ${item.publish_time}`}
        </p>
      </button>
      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge name={item.content_type} />
        <ContentFormatBadge isPoster={item.is_poster} isVideo={item.is_video} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ContentStatusSelect item={item} onStatusChange={onStatusChange} className="h-9 w-full" />
        <AssigneePicker item={item} className="h-9" />
      </div>
      <WorkSummary item={item} />
      <div className="mt-auto">
        <PostActions item={item} showLabels />
      </div>
    </Card>
  );
}

/** Table from 1280px up, cards below. Only one is rendered, chosen with a media query. */
export function ContentList({ items, empty }: { items: ContentWithInsight[]; empty: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const columns = useColumns();
  const { openDetailDrawer } = useWorkspace();

  return isDesktop ? (
    <DataTable columns={columns} rows={items} getRowKey={(item) => item.id} onRowClick={openDetailDrawer} empty={empty} />
  ) : (
    <CardList rows={items} getRowKey={(item) => item.id} renderCard={(item) => <ContentCard item={item} />} empty={empty} />
  );
}
