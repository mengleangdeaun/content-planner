"use client";

import React from "react";
import { ContentWithInsight, ContentStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ContentFormatBadge } from "@/features/content";
import { formatDisplayDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { FileText, ExternalLink } from "lucide-react";
import { OwnerHubMetricsState } from "../hooks/use-owner-hub-metrics";

interface OwnerContentLedgerProps {
  metrics: OwnerHubMetricsState;
  onOpenDetailDrawer: (item: ContentWithInsight) => void;
  onStatusChange: (item: ContentWithInsight, newStatus: ContentStatus) => void;
}

export function OwnerContentLedger({
  metrics,
  onOpenDetailDrawer,
  onStatusChange,
}: OwnerContentLedgerProps) {
  const {
    datePeriod,
    datePeriodLabels,
    selectedChannel,
    filterEducationalOnly,
    setFilterEducationalOnly,
    displayRows,
    channelPeriodItems,
  } = metrics;

  const channelLabel = selectedChannel
    ? `${selectedChannel.platform} ${selectedChannel.account_name}`
    : "Channel";

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b bg-muted/20">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {channelLabel} Content Ledger &bull; {datePeriodLabels[datePeriod]}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Production checklist & direct links to attached creative files.
          </p>
        </div>

        {/* Filter Toggle: All vs Educational Only */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={filterEducationalOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterEducationalOnly(true)}
            className="h-8 text-xs font-medium"
          >
            Educational ({metrics.educationalCount})
          </Button>
          <Button
            variant={!filterEducationalOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterEducationalOnly(false)}
            className="h-8 text-xs font-medium"
          >
            All Categories ({channelPeriodItems.length})
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Scheduled Date</TableHead>
            <TableHead className="w-40">Format & Type</TableHead>
            <TableHead className="min-w-[240px]">Working Title</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-28">Creative Doc</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                No content matching this filter for the selected timeframe.
              </TableCell>
            </TableRow>
          ) : (
            displayRows.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer group"
                onClick={() => onOpenDetailDrawer(item)}
              >
                {/* Date */}
                <TableCell>
                  <span className="font-semibold text-sm text-foreground block">
                    {formatDisplayDate(item.publish_date)}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.id}
                  </span>
                </TableCell>

                {/* Format Badges */}
                <TableCell>
                  <div className="flex flex-col gap-1.5 items-start">
                    <Badge variant="outline" className="text-xs font-medium bg-muted/30">
                      {item.content_type}
                    </Badge>
                    <ContentFormatBadge isPoster={item.is_poster} isVideo={item.is_video} />
                  </div>
                </TableCell>

                {/* Title */}
                <TableCell>
                  <span className="font-medium text-foreground block line-clamp-1 group-hover:text-primary transition-colors text-sm">
                    {item.title}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.copy_text || "No caption provided"}
                  </span>
                </TableCell>

                {/* Status Switcher */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="w-28">
                    <Select
                      value={item.status}
                      onValueChange={(val) =>
                        val && onStatusChange(item, val as ContentStatus)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
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
                </TableCell>

                {/* Creative Link */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {item.workspace_file_url ? (
                    <a
                      href={item.workspace_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "h-8 text-xs gap-1.5 px-2.5 text-primary hover:text-primary/80"
                      )}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Doc</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenDetailDrawer(item)}
                    className="h-8 text-xs px-2.5"
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
