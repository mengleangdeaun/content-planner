"use client";

import React, { useRef, useState } from "react";
import { format } from "date-fns";
import {
  BarChart2,
  Check,
  Copy,
  CopyPlus,
  ExternalLink,
  FileText,
  Link2,
  Pencil,
  Share,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDisplayDate } from "@/lib/date-utils";
import { ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NO_TASKS, isOverdue } from "@/lib/workflow";
import { ContentFormatBadge } from "./content-format-badge";
import { ContentStatusBadge } from "./content-status-badge";
import { ContentStatusSelect } from "./content-status-select";
import { ContentActivityPanel, ContentTasksPanel } from "./content-work-panels";
import { TypeBadge } from "@/features/taxonomies/components/type-badge";

const ACTION = "h-10 gap-1.5 md:h-8";
const SECTION_TITLE = "text-sm font-semibold text-foreground";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-foreground">{children}</dd>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value.toLocaleString()}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

// Phone date wheels can fire on every tick, so save once the value settles.
function RescheduleField({ item }: { item: ContentWithInsight }) {
  const { onReschedule } = useWorkspace();
  const [date, setDate] = useState(item.publish_date);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const change = (next: string) => {
    setDate(next);
    clearTimeout(timer.current);
    if (next) timer.current = setTimeout(() => onReschedule(item, next), 800);
  };

  return <ResponsiveDatePicker aria-label="Publish date" value={date} clearable={false} onChange={change} />;
}

export function ContentDetailDrawer() {
  const {
    detailDrawerItem: item,
    detailDrawerTab,
    closeDetailDrawer,
    onStatusChange,
    openMetricsModal,
    openPostForm,
    showToast,
    people,
    campaigns,
    taskProgressById,
  } = useWorkspace();
  const { can } = useAuth();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const personName = (email?: string) =>
    email ? (people.find((p) => p.email === email)?.name ?? email) : "Unassigned";
  const campaign = campaigns.find((c) => c.id === item.campaign_id);
  const overdue = isOverdue(item, format(new Date(), "yyyy-MM-dd"));
  const progress = taskProgressById.get(item.id) ?? NO_TASKS;
  // Drag-and-drop does not work on touch screens, so phones reschedule from here.
  const canRescheduleHere = isMobile && can("content.edit") && item.status !== "Published";

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(item.copy_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) showToast("Could not share this link");
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  };

  const handleEdit = () => {
    closeDetailDrawer();
    openPostForm({ mode: "edit", item });
  };

  // A duplicate starts over as a Draft, without the original's live link.
  const handleDuplicate = () => {
    closeDetailDrawer();
    openPostForm({
      mode: "create",
      preset: { ...item, title: `${item.title} (copy)`, status: "Draft", live_post_url: "" },
    });
  };

  const views = item.insight?.views_impressions || 0;
  const engagements = item.insight?.engagements || 0;
  const clicks = item.insight?.clicks || 0;
  const engagementRate = views > 0 ? ((engagements / views) * 100).toFixed(2) : "0.00";
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : "0.00";

  return (
    <ResponsiveModal
      open
      onClose={closeDetailDrawer}
      variant="side"
      title={item.title}
      description={`${item.platform} · ${item.account_name} · ${item.id}`}
      bodyClassName="pt-0"
      header={
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <ContentStatusBadge status={item.status} />
            <ContentFormatBadge isPoster={item.is_poster} isVideo={item.is_video} />
          </div>
          <div className="flex flex-wrap gap-2">
            {can("content.edit") && (
              <Button variant="outline" size="sm" onClick={handleEdit} className={ACTION}>
                <Pencil /> Edit
              </Button>
            )}
            {can("content.create") && (
              <Button variant="outline" size="sm" onClick={handleDuplicate} className={ACTION}>
                <CopyPlus /> Duplicate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleShare} className={ACTION}>
              {isMobile ? <Share /> : <Link2 />} {isMobile ? "Share" : "Copy link"}
            </Button>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-sm font-medium text-foreground">Status</span>
          <div className="min-w-0 flex-1">
            <ContentStatusSelect item={item} onStatusChange={onStatusChange} className="w-full" />
          </div>
        </div>
      }
    >
      <Tabs key={`${item.id}-${detailDrawerTab}`} defaultValue={detailDrawerTab}>
        {/* Stays visible while the tab's content scrolls. */}
        <div className="sticky top-0 z-10 bg-popover py-3">
          <TabsList className="w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks{progress.total > 0 && ` ${progress.done}/${progress.total}`}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="space-y-5 pb-1">
          {(item.workspace_file_url || item.live_post_url) && (
            <div className="flex flex-col gap-2 sm:flex-row">
              {item.workspace_file_url && (
                <a
                  href={item.workspace_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "default" }), "h-11 flex-1 gap-2 md:h-9")}
                >
                  <FileText /> Open document
                </a>
              )}
              {item.live_post_url && (
                <a
                  href={item.live_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1 gap-2 md:h-9")}
                >
                  <ExternalLink /> Open live post
                </a>
              )}
            </div>
          )}

          <dl className="divide-y rounded-lg border px-3">
            <Detail label="Publish date">
              {canRescheduleHere ? (
                <RescheduleField key={item.publish_date} item={item} />
              ) : (
                formatDisplayDate(item.publish_date)
              )}
            </Detail>
            {item.publish_time && <Detail label="Publish time">{item.publish_time}</Detail>}
            {item.due_date && (
              <Detail label="Due">
                <span className={cn(overdue && "text-destructive")}>
                  {formatDisplayDate(item.due_date)}{overdue && " (overdue)"}
                </span>
              </Detail>
            )}
            <Detail label="Content type">
              <TypeBadge name={item.content_type} />
            </Detail>
            <Detail label="Assignee">{personName(item.assignee_email)}</Detail>
            <Detail label="Reviewer">{personName(item.reviewer_email)}</Detail>
            {item.priority && <Detail label="Priority">{item.priority}</Detail>}
            {campaign && <Detail label="Campaign">{campaign.name}</Detail>}
          </dl>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className={SECTION_TITLE}>Caption</h3>
              {item.copy_text && (
                <Button variant="ghost" size="sm" onClick={handleCopyCaption} className="h-10 gap-1.5 md:h-7">
                  {copied ? <Check className="text-primary" /> : <Copy />} {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 leading-relaxed break-words whitespace-pre-wrap text-foreground">
              {item.copy_text || <span className="text-muted-foreground">No caption yet.</span>}
            </div>
          </section>

          {can("metrics.view") && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className={SECTION_TITLE}>Performance</h3>
                {can("metrics.edit") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      closeDetailDrawer();
                      openMetricsModal(item);
                    }}
                    className="h-10 gap-1.5 md:h-7"
                  >
                    <BarChart2 /> Update
                  </Button>
                )}
              </div>
              {views > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Impressions" value={views} />
                  <Metric label="Engagements" value={engagements} note={`${engagementRate}%`} />
                  <Metric label="Clicks" value={clicks} note={`${ctr}% CTR`} />
                </div>
              ) : (
                <p className="rounded-lg border border-dashed p-3 text-center text-muted-foreground">
                  No metrics logged yet.
                </p>
              )}
            </section>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="pb-1">
          <ContentTasksPanel contentId={item.id} />
        </TabsContent>

        <TabsContent value="activity" className="pb-1">
          <ContentActivityPanel item={item} />
        </TabsContent>
      </Tabs>
    </ResponsiveModal>
  );
}
