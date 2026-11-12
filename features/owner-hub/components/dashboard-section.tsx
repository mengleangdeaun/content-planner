"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWorkspace } from "@/context/workspace-context";
import { formatShortDate } from "@/lib/date-utils";
import { ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";
import { statusStyle } from "@/features/content/components/status-style";

interface DashboardSectionProps {
  title: string;
  description?: React.ReactNode;
  /** e.g. a "View all" link. */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** The card every dashboard section sits in, so titles and spacing line up. */
export function DashboardSection({ title, description, action, className, children }: DashboardSectionProps) {
  return (
    <Card className={cn("min-w-0 gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function SectionLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="-my-1 -mr-2 shrink-0 gap-1 text-xs text-muted-foreground">
      {label}
      <ArrowRight />
    </Button>
  );
}

/** One post as a compact row that opens its detail drawer. `meta` replaces the default channel and date line. */
export function PostRow({ item, meta }: { item: ContentWithInsight; meta?: React.ReactNode }) {
  const { openDetailDrawer } = useWorkspace();
  return (
    <li>
      <button
        type="button"
        onClick={() => openDetailDrawer(item)}
        className="flex w-full min-w-0 items-start gap-2.5 rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
      >
        <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", statusStyle(item.status).dot)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {meta ?? `${item.status} · ${item.platform} ${item.account_name} · ${formatShortDate(item.publish_date)}`}
          </span>
        </span>
      </button>
    </li>
  );
}

/** A thin horizontal bar. `percent` is clamped to 0-100. */
export function MeterBar({ percent, className, label }: { percent: number; className?: string; label: string }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 overflow-hidden rounded-full bg-muted"
    >
      <div className={cn("h-full rounded-full", className ?? "bg-primary")} style={{ width: `${value}%` }} />
    </div>
  );
}
