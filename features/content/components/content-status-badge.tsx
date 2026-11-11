"use client";

import React from "react";
import { ContentStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContentStatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export function ContentStatusBadge({ status, className }: ContentStatusBadgeProps) {
  switch (status) {
    case "Draft":
      return (
        <Badge
          variant="outline"
          className={cn("text-xs text-muted-foreground border-muted-foreground/30 font-medium", className)}
        >
          Draft
        </Badge>
      );
    case "In Production":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium text-blue-600 border-blue-300 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
            className
          )}
        >
          In Production
        </Badge>
      );
    case "In Review":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium text-amber-600 border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
            className
          )}
        >
          In Review
        </Badge>
      );
    case "In Revise":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium text-orange-600 border-orange-300 bg-orange-50/60 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400",
            className
          )}
        >
          In Revise
        </Badge>
      );
    case "Approved":
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium text-emerald-600 border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400",
            className
          )}
        >
          Approved
        </Badge>
      );
    case "Scheduled":
      return (
        <Badge
          variant="secondary"
          className={cn(
            "text-xs font-medium text-purple-700 bg-purple-100 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300",
            className
          )}
        >
          Scheduled
        </Badge>
      );
    case "Published":
      return (
        <Badge
          variant="default"
          className={cn("text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-600/90", className)}
        >
          Published
        </Badge>
      );
    case "Archived":
      return (
        <Badge
          variant="outline"
          className={cn("text-xs text-muted-foreground bg-muted/40 font-medium", className)}
        >
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn("text-xs", className)}>
          {status}
        </Badge>
      );
  }
}

