"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { ContentStatus, ContentWithInsight } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { statusPermission } from "@/lib/auth/permissions";
import { formatShortDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { BOARD_STATUSES, isOverdue, nextStatuses, taskProgress } from "@/lib/workflow";
import { ContentStatusSelect } from "./content-status-select";
import { TypeBadge } from "@/features/taxonomies/components/type-badge";

export function ContentBoard({ items }: { items: ContentWithInsight[] }) {
  const { openDetailDrawer, onStatusChange, people, tasks } = useWorkspace();
  const { can } = useAuth();
  const isMobile = useIsMobile();
  const [dragging, setDragging] = useState<ContentWithInsight | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const movesFor = (item: ContentWithInsight) =>
    nextStatuses(item.status).filter((status) => can(statusPermission(status)));
  const canDrop = (status: string) => Boolean(dragging && movesFor(dragging).includes(status));
  const personName = (email?: string) => people.find((p) => p.email === email)?.name ?? email;

  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {BOARD_STATUSES.map((status) => {
        const column = items.filter((item) => item.status === status);
        return (
          <section
            key={status}
            aria-label={status}
            onDragOver={(e) => canDrop(status) && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging && canDrop(status)) onStatusChange(dragging, status as ContentStatus);
              setDragging(null);
            }}
            className={cn(
              "flex w-64 shrink-0 flex-col gap-2 rounded-lg border bg-muted/30 p-2 transition-colors",
              canDrop(status) && "border-primary bg-primary/5",
              dragging && !canDrop(status) && dragging.status !== status && "opacity-50"
            )}
          >
            <header className="flex items-center justify-between px-1 py-0.5">
              <h2 className="text-xs font-semibold text-foreground">{status}</h2>
              <span className="text-xs text-muted-foreground">{column.length}</span>
            </header>

            {column.map((item) => {
              const overdue = isOverdue(item, today);
              const progress = taskProgress(tasks.filter((task) => task.content_id === item.id));
              return (
                // A div, because Firefox cannot drag a <button>.
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  draggable={movesFor(item).length > 0}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", item.id); // Firefox starts a drag only with data set.
                    setDragging(item);
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => openDetailDrawer(item)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    openDetailDrawer(item);
                  }}
                  className="cursor-pointer space-y-1.5 rounded-md border bg-card p-2.5 text-left shadow-xs transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="line-clamp-2 block text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.platform} · {item.account_name}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <TypeBadge name={item.content_type} className="text-[10px]" />
                    <span>{formatShortDate(item.publish_date)}</span>
                    {item.priority === "High" && (
                      <Badge variant="outline" className="text-[10px] text-orange-600">High</Badge>
                    )}
                    {overdue && (
                      <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive">
                        Overdue
                      </Badge>
                    )}
                  </span>
                  {item.assignee_email && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {personName(item.assignee_email)}
                    </span>
                  )}
                  {progress.total > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      Tasks {progress.done}/{progress.total}
                    </span>
                  )}
                  {/* Drag-and-drop does not work on touch screens, so phones move cards with this. */}
                  {isMobile && (
                    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <ContentStatusSelect item={item} onStatusChange={onStatusChange} />
                    </div>
                  )}
                </div>
              );
            })}

            {column.length === 0 && (
              <p className="px-1 py-4 text-center text-xs text-muted-foreground">No posts</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
