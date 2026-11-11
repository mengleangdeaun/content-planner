"use client";

import React, { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { resolveChannelId } from "@/lib/auth/permissions";
import { ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEK = { weekStartsOn: 1 } as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_DOT: Record<string, string> = {
  Draft: "bg-muted-foreground",
  "In Production": "bg-blue-500",
  "In Review": "bg-amber-500",
  "In Revise": "bg-orange-500",
  Approved: "bg-emerald-500",
  Scheduled: "bg-purple-500",
  Published: "bg-emerald-700",
};

export function CalendarView() {
  const { items, channels, openDetailDrawer, openPostForm, onReschedule } = useWorkspace();
  const { can } = useAuth();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [channelId, setChannelId] = useState("all");
  const [dragging, setDragging] = useState<ContentWithInsight | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);

  const canMove = can("content.edit");
  const canCreate = can("content.create");
  const today = format(new Date(), "yyyy-MM-dd");

  const days = useMemo(() => {
    const start = mode === "month" ? startOfWeek(startOfMonth(cursor), WEEK) : startOfWeek(cursor, WEEK);
    const end = mode === "month" ? endOfWeek(endOfMonth(cursor), WEEK) : endOfWeek(cursor, WEEK);
    return eachDayOfInterval({ start, end });
  }, [cursor, mode]);

  const byDate = useMemo(() => {
    const map = new Map<string, ContentWithInsight[]>();
    for (const item of items) {
      if (item.status === "Archived" || !item.publish_date) continue;
      if (channelId !== "all" && resolveChannelId(item, channels) !== channelId) continue;
      map.set(item.publish_date, [...(map.get(item.publish_date) ?? []), item]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.publish_time ?? "").localeCompare(b.publish_time ?? ""));
    }
    return map;
  }, [items, channels, channelId]);

  const step = (direction: 1 | -1) =>
    setCursor((current) => (mode === "month" ? addMonths(current, direction) : addWeeks(current, direction)));

  const title =
    mode === "month"
      ? format(cursor, "MMMM yyyy")
      : `${format(days[0], "MMM d")} – ${format(days[days.length - 1], "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Content Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {!canMove
            ? "See what is planned for each day."
            : isMobile
              ? "Tap a post to open it and change its date."
              : "Drag a post to another day to reschedule it."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Previous" onClick={() => step(-1)} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" aria-label="Next" onClick={() => step(1)} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setCursor(new Date())} className="h-8 text-xs">
          Today
        </Button>
        <h2 className="text-sm font-semibold text-foreground" aria-live="polite">{title}</h2>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="w-48">
            <ResponsiveSelect
              aria-label="Filter by channel"
              value={channelId}
              onValueChange={setChannelId}
              className="h-8 w-full"
              options={[
                { value: "all", label: "All Channels" },
                ...channels.map((c) => ({ value: c.id, label: `${c.platform} — ${c.account_name}` })),
              ]}
            />
          </div>
          <div className="flex rounded-md border p-0.5" role="group" aria-label="Calendar range">
            {(["month", "week"] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={mode === option ? "secondary" : "ghost"}
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className="h-7 px-3 text-xs capitalize"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const date = format(day, "yyyy-MM-dd");
              const posts = byDate.get(date) ?? [];
              return (
                <div
                  key={date}
                  onDragOver={(e) => {
                    if (!dragging) return;
                    e.preventDefault();
                    setDropDate(date);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragging) onReschedule(dragging, date);
                    setDragging(null);
                    setDropDate(null);
                  }}
                  className={cn(
                    "group space-y-1 border-b border-r p-1.5",
                    mode === "month" ? "min-h-28" : "min-h-80",
                    mode === "month" && !isSameMonth(day, cursor) && "bg-muted/20",
                    dropDate === date && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs",
                        date === today ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {canCreate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Add post on ${date}`}
                        onClick={() => openPostForm({ mode: "create", preset: { publish_date: date } })}
                        className="h-5 w-5 p-0 text-muted-foreground opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {posts.map((post) => (
                    // A div, because Firefox cannot drag a <button>.
                    <div
                      key={post.id}
                      role="button"
                      tabIndex={0}
                      draggable={canMove && post.status !== "Published"}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", post.id); // Firefox starts a drag only with data set.
                        setDragging(post);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setDropDate(null);
                      }}
                      onClick={() => openDetailDrawer(post)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        openDetailDrawer(post);
                      }}
                      title={`${post.title} (${post.status})`}
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded border bg-card px-1.5 py-1 text-left text-xs hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[post.status] ?? "bg-muted-foreground")} />
                      {post.publish_time && <span className="shrink-0 text-muted-foreground">{post.publish_time}</span>}
                      <span className="truncate text-foreground">{post.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
