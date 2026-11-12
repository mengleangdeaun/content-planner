"use client";

import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, FoldHorizontal, Inbox } from "lucide-react";
import { ContentStatus, ContentWithInsight } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { statusPermission } from "@/lib/auth/permissions";
import { formatShortDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { BOARD_STATUSES, NO_TASKS, isOverdue, nextStatuses } from "@/lib/workflow";
import { TypeBadge } from "@/features/taxonomies/components/type-badge";
import { ContentStatusSelect } from "./content-status-select";
import { statusStyle } from "./status-style";
import { PersonAvatar } from "@/components/shared/person-avatar";

// Fixed height of about 4-5 cards; a cut-off card shows there is more to scroll.
const COLUMN_HEIGHT = "h-[min(42rem,calc(100dvh-12rem))]";

// Tracks whether there is more board to the left or right, for the arrows and edge fades.
function useScrollEdges() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;
    const update = () =>
      setEdges({
        left: scroller.scrollLeft > 4,
        right: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4,
      });
    // Fires once on observe, and again when the window or the columns change size.
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(track);
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, []);

  const scrollByColumn = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const column = scroller.querySelector<HTMLElement>("[data-board-column]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollBy({ left: direction * ((column?.offsetWidth ?? 256) + 12), behavior: reduceMotion ? "auto" : "smooth" });
  };

  return { scrollerRef, trackRef, edges, scrollByColumn };
}

export function ContentBoard({ items }: { items: ContentWithInsight[] }) {
  const { onStatusChange } = useWorkspace();
  const { can } = useAuth();
  const [dragging, setDragging] = useState<ContentWithInsight | null>(null);
  // Empty columns start as slim strips; opening one keeps it open until the board unmounts.
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const { scrollerRef, trackRef, edges, scrollByColumn } = useScrollEdges();

  const movesFor = (item: ContentWithInsight) =>
    nextStatuses(item.status).filter((status) => can(statusPermission(status)));
  const canDrop = (status: string) => Boolean(dragging && movesFor(dragging).includes(status));
  const toggleOpened = (status: string) =>
    setOpened((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });

  return (
    <div className="space-y-2">
      {(edges.left || edges.right) && (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Scroll board left"
            disabled={!edges.left}
            onClick={() => scrollByColumn(-1)}
            className="h-10 w-10 md:h-8 md:w-8"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Scroll board right"
            disabled={!edges.right}
            onClick={() => scrollByColumn(1)}
            className="h-10 w-10 md:h-8 md:w-8"
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      <div className="relative">
        {/* Scrolls sideways on its own; the page stays the width of the screen. */}
        <div ref={scrollerRef} className="snap-x overflow-x-auto pb-3">
          {/* At least as wide as the board area, so columns stretch to fill spare width on big screens. */}
          <div ref={trackRef} className="flex w-max min-w-full gap-3">
            {BOARD_STATUSES.map((status) => {
              const column = items.filter((item) => item.status === status);
              const style = statusStyle(status);
              const collapsed = column.length === 0 && !opened.has(status);
              const dropProps = {
                onDragOver: (e: React.DragEvent) => {
                  if (canDrop(status)) e.preventDefault();
                },
                onDrop: (e: React.DragEvent) => {
                  e.preventDefault();
                  if (dragging && canDrop(status)) onStatusChange(dragging, status as ContentStatus);
                  setDragging(null);
                },
              };
              const dropStyle = cn(
                canDrop(status) && "border-primary bg-primary/5",
                dragging && !canDrop(status) && dragging.status !== status && "opacity-50"
              );

              if (collapsed) {
                return (
                  <section
                    key={status}
                    data-board-column
                    aria-label={`${status}, empty`}
                    {...dropProps}
                    className={cn(COLUMN_HEIGHT, "w-11 flex-none snap-start rounded-lg border bg-muted/30 transition-colors", dropStyle)}
                  >
                    <button
                      type="button"
                      onClick={() => toggleOpened(status)}
                      aria-label={`Show ${status} column (empty)`}
                      className="flex h-full w-full flex-col items-center gap-2 rounded-lg py-3 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", style.dot)} />
                      <span className="text-xs font-semibold text-foreground [writing-mode:vertical-rl]">{status}</span>
                      <span className="text-xs text-muted-foreground">0</span>
                    </button>
                  </section>
                );
              }

              return (
                <section
                  key={status}
                  data-board-column
                  aria-label={status}
                  {...dropProps}
                  className={cn(
                    COLUMN_HEIGHT,
                    "flex max-w-96 flex-[1_0_15rem] snap-start flex-col gap-2 rounded-lg border bg-muted/30 p-2 transition-colors",
                    dropStyle
                  )}
                >
                  <header className="flex shrink-0 items-center justify-between gap-2 px-1 py-0.5">
                    <h2 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <span aria-hidden className={cn("size-2 rounded-full", style.dot)} />
                      {status}
                    </h2>
                    <span className="flex items-center gap-1">
                      <span className="rounded-full bg-background px-1.5 text-xs font-medium text-muted-foreground">
                        {column.length}
                      </span>
                      {column.length === 0 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Fold ${status} column`}
                          onClick={() => toggleOpened(status)}
                          className="text-muted-foreground"
                        >
                          <FoldHorizontal />
                        </Button>
                      )}
                    </span>
                  </header>

                  {/* Only the cards scroll; the header stays put and the page does not scroll along. */}
                  <div
                    className={cn(
                      "-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-1 pb-1",
                      column.length === 0 && "justify-center"
                    )}
                  >
                    {column.map((item) => (
                      <BoardCard
                        key={item.id}
                        item={item}
                        draggable={movesFor(item).length > 0}
                        onDragStart={() => setDragging(item)}
                        onDragEnd={() => setDragging(null)}
                      />
                    ))}
                    {column.length === 0 && (
                      <EmptyState size="sm" icon={<Inbox />} title={`Nothing ${status.toLowerCase()}`} />
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {/* Soft edges where columns continue off-screen. */}
        {edges.left && (
          <div aria-hidden className="pointer-events-none absolute top-0 bottom-3 left-0 w-10 bg-linear-to-r from-background to-transparent" />
        )}
        {edges.right && (
          <div aria-hidden className="pointer-events-none absolute top-0 right-0 bottom-3 w-10 bg-linear-to-l from-background to-transparent" />
        )}
      </div>
    </div>
  );
}

interface BoardCardProps {
  item: ContentWithInsight;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function BoardCard({ item, draggable, onDragStart, onDragEnd }: BoardCardProps) {
  const { openDetailDrawer, onStatusChange, people, taskProgressById } = useWorkspace();
  const isMobile = useIsMobile();
  const overdue = isOverdue(item, format(new Date(), "yyyy-MM-dd"));
  const progress = taskProgressById.get(item.id) ?? NO_TASKS;
  const assigneePerson = people.find((p) => p.email === item.assignee_email);
  const assignee = assigneePerson?.name ?? item.assignee_email;

  return (
    // A div, because Firefox cannot drag a <button>.
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id); // Firefox starts a drag only with data set.
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={() => openDetailDrawer(item)}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openDetailDrawer(item);
      }}
      className="shrink-0 cursor-pointer space-y-1.5 rounded-md border bg-card p-2.5 text-left shadow-xs transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
      {assignee && (
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <PersonAvatar name={assignee} avatarUrl={assigneePerson?.avatar_url} size="xs" />
          <span className="truncate">{assignee}</span>
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
}
