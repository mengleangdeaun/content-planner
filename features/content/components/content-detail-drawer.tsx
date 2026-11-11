"use client";

import React, { useState } from "react";
import { ContentStatus } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { ContentFormatBadge } from "./content-format-badge";
import { ContentStatusBadge } from "./content-status-badge";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/date-utils";
import {
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Share2,
  Tag,
  BarChart2,
  FileText,
} from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";

export function ContentDetailDrawer() {
  const {
    detailDrawerItem,
    closeDetailDrawer,
    onStatusChange,
    openMetricsModal,
  } = useWorkspace();
  const { can } = useAuth();

  const [copied, setCopied] = useState(false);

  if (!detailDrawerItem) return null;
  const item = detailDrawerItem;

  const handleCopyText = () => {
    if (item.copy_text) {
      navigator.clipboard.writeText(item.copy_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const views = item.insight?.views_impressions || 0;
  const engagements = item.insight?.engagements || 0;
  const clicks = item.insight?.clicks || 0;
  const engagementRate = views > 0 ? ((engagements / views) * 100).toFixed(2) : "0.00";
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : "0.00";

  return (
    <Sheet open={Boolean(detailDrawerItem)} onOpenChange={(open) => !open && closeDetailDrawer()}>
      <SheetContent side="right" className="flex flex-col justify-between w-full sm:max-w-md p-6 overflow-y-auto">
        <div>
          {/* Header */}
          <SheetHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="font-mono text-xs">
                {item.id}
              </Badge>
              <ContentFormatBadge isPoster={item.is_poster} isVideo={item.is_video} />
              <ContentStatusBadge status={item.status} />
            </div>

            <SheetTitle className="text-lg font-semibold leading-snug">
              {item.title}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Review publication date, caption copy, and connected Google Doc.
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4" />

          {/* Body Content */}
          <div className="space-y-5">
            {/* Primary Action Button: Open Connected Google Doc */}
            <div>
              {item.workspace_file_url ? (
                <a
                  href={item.workspace_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "w-full gap-2 font-medium justify-center text-sm shadow-xs"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span>Open Attached Google Doc / Asset</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Button variant="outline" disabled className="w-full justify-center text-xs text-muted-foreground">
                  No Connected Google Doc URL
                </Button>
              )}
            </div>

            {/* Publication Details */}
            <div className="rounded-lg border bg-card p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Publication Date
                </span>
                <span className="font-semibold text-foreground">
                  {formatDisplayDate(item.publish_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" /> Channel & Account
                </span>
                <span className="font-medium text-foreground">
                  {item.platform} &bull; {item.account_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Category Type
                </span>
                <span className="font-medium text-foreground">
                  {item.content_type}
                </span>
              </div>
            </div>

            {/* Social Caption Text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Caption Copy</span>
                {item.copy_text && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyText}
                    className="h-6 text-xs gap-1 px-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground max-h-48 overflow-y-auto">
                {item.copy_text || <span className="italic text-muted-foreground">No copy entered for this post.</span>}
              </div>
            </div>

            {/* Performance Metrics Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Performance Metrics
                </span>
                {can("metrics.edit") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      closeDetailDrawer();
                      openMetricsModal(item);
                    }}
                    className="h-6 text-xs gap-1 px-2"
                  >
                    <BarChart2 className="h-3 w-3" />
                    <span>Update</span>
                  </Button>
                )}
              </div>

              {item.insight && item.insight.views_impressions > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Card className="p-2.5 space-y-0.5">
                    <span className="text-muted-foreground text-[11px]">Impressions</span>
                    <div className="text-base font-bold text-foreground">
                      {views.toLocaleString()}
                    </div>
                  </Card>
                  <Card className="p-2.5 space-y-0.5">
                    <span className="text-muted-foreground text-[11px]">Engagements</span>
                    <div className="text-base font-bold text-foreground">
                      {engagements.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {engagementRate}% rate
                    </span>
                  </Card>
                  <Card className="p-2.5 space-y-0.5 col-span-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">Outbound Clicks</span>
                      <span className="text-xs font-bold text-primary">{ctr}% CTR</span>
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {clicks.toLocaleString()}
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No weekly analytics logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Status Transition Bar */}
        <div className="pt-4 border-t mt-6 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Change Pipeline Status
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select
                value={item.status}
                onValueChange={(val) =>
                  val && onStatusChange(item, val as ContentStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="In Production">In Production</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="In Revise">In Revise</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="default" onClick={closeDetailDrawer}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

