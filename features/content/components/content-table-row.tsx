"use client";

import React from "react";
import { ContentWithInsight, ContentStatus } from "@/lib/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ContentFormatBadge } from "./content-format-badge";
import { formatDisplayDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { FileText, ExternalLink, BarChart2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface ContentTableRowProps {
  item: ContentWithInsight;
  onOpenDetailDrawer: (item: ContentWithInsight) => void;
  onOpenMetricsModal: (item: ContentWithInsight) => void;
  onStatusChange: (item: ContentWithInsight, newStatus: ContentStatus) => void;
}

export function ContentTableRow({
  item,
  onOpenDetailDrawer,
  onOpenMetricsModal,
  onStatusChange,
}: ContentTableRowProps) {
  const { can } = useAuth();

  return (
    <TableRow className="cursor-pointer group">
      {/* Date & ID */}
      <TableCell onClick={() => onOpenDetailDrawer(item)}>
        <span className="font-medium text-sm text-foreground block">
          {formatDisplayDate(item.publish_date)}
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {item.id}
        </span>
      </TableCell>

      {/* Channel & Account */}
      <TableCell onClick={() => onOpenDetailDrawer(item)}>
        <span className="font-medium text-sm text-foreground block">
          {item.platform}
        </span>
        <span className="text-xs text-muted-foreground">
          {item.account_name}
        </span>
      </TableCell>

      {/* Content Type & Format Badges */}
      <TableCell onClick={() => onOpenDetailDrawer(item)}>
        <div className="flex flex-col gap-1.5 items-start">
          <Badge
            variant="outline"
            className="text-xs bg-muted/40 font-medium"
          >
            {item.content_type}
          </Badge>
          <ContentFormatBadge isPoster={item.is_poster} isVideo={item.is_video} />
        </div>
      </TableCell>

      {/* Title & Copy preview */}
      <TableCell onClick={() => onOpenDetailDrawer(item)}>
        <span className="font-medium text-foreground block line-clamp-1 group-hover:text-primary transition-colors text-sm">
          {item.title}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {item.copy_text || "No caption added"}
        </span>
      </TableCell>

      {/* Status (7-Stage Workflow) */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="w-32">
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

      {/* Workspace Link */}
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
        <div className="flex items-center justify-end gap-1.5">
          {item.status === "Published" && can("metrics.edit") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenMetricsModal(item)}
              className="h-8 text-xs gap-1.5 px-2.5"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Metrics</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenDetailDrawer(item)}
            className="h-8 text-xs px-2.5"
          >
            Details
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
