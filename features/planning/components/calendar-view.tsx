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
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, NoResults } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { resolveChannelId } from "@/lib/auth/permissions";
import { ContentFilters, EMPTY_FILTERS, filterContent, hasActiveFilters } from "@/lib/content-filter";
import { ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BOARD_STATUSES, isOverdue, relativeDayLabel } from "@/lib/workflow";
import { statusStyle } from "@/features/content/components/status-style";
import { TYPE_COLOR_CLASSES, TypeBadge } from "@/features/taxonomies/components/type-badge";
import { ContentFilterBar } from "@/features/content/components/content-filter-bar";

const WEEK = { weekStartsOn: 1 } as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Month cells show this many posts; the rest sit behind "+N more", which opens that week.
const CELL_LIMIT = 3;
const NO_COLOR = "bg-muted-foreground/40";

type Mode = "month" | "week" | "list";
type ColorBy = "status" | "type";

export function CalendarView() {
  const { items, channels, contentTypes, openDetailDrawer, openPostForm, onReschedule } = useWorkspace();
  const { can, currentUser } = useAuth();
  const isMobile = useIsMobile();
  // Phones start on the list: a 7-column grid does not fit their width.
  const [chosenMode, setMode] = useState<Mode | null>(null);
  const mode = chosenMode ?? (isMobile ? "list" : "month");
  const [cursor, setCursor] = useState(() => new Date());
  const [filters, setFilters] = useState<ContentFilters>(EMPTY_FILTERS);
  const [colorBy, setColorBy] = useState<ColorBy>("status");
  const [dragging, setDragging] = useState<ContentWithInsight | null>(null);
  const [dropDate, setDropDate] = useState<string | null>(null);

  const canMove = can("content.edit");
  const canCreate = can("content.create");
  const today = format(new Date(), "yyyy-MM-dd");
  const filtered = hasActiveFilters(filters);

  const days = useMemo(() => {
    if (mode === "week") return eachDayOfInterval({ start: startOfWeek(cursor, WEEK), end: endOfWeek(cursor, WEEK) });
    if (mode === "list") return eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) });
    return eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), WEEK), end: endOfWeek(endOfMonth(cursor), WEEK) });
  }, [cursor, mode]);

  const byDate = useMemo(() => {
    const visible = filterContent(items, filters, {
      channelIdOf: (item) => resolveChannelId(item, channels),
      inDateRange: () => true,
      isOverdue: (item) => isOverdue(item, today),
      currentEmail: currentUser.email,
    });
    const map = new Map<string, ContentWithInsight[]>();
    for (const item of visible) {
      if (!item.publish_date) continue;
      map.set(item.publish_date, [...(map.get(item.publish_date) ?? []), item]);
    }
    for (const list of map.values()) list.sort((a, b) => (a.publish_time ?? "").localeCompare(b.publish_time ?? ""));
    return map;
  }, [items, channels, filters, today, currentUser.email]);

  // Posts in the visible range (for month view, only the month itself, not the spill-over days).
  const inView = useMemo(
    () =>
      days
        .filter((day) => mode !== "month" || isSameMonth(day, cursor))
        .flatMap((day) => byDate.get(format(day, "yyyy-MM-dd")) ?? []),
    [days, byDate, mode, cursor]
  );

  const typeColor = (name: string) => {
    const color = contentTypes.find((t) => t.name === name)?.badge_color;
    return (color && TYPE_COLOR_CLASSES[color]?.swatch) || NO_COLOR;
  };
  const dotOf = (post: ContentWithInsight) => (colorBy === "status" ? statusStyle(post.status).dot : typeColor(post.content_type));

  // Only keys that appear in view, with their counts, in a stable order.
  const legend = useMemo(() => {
    const keys = colorBy === "status" ? [...BOARD_STATUSES, "Archived"] : contentTypes.map((t) => t.name);
    const count = (key: string) => inView.filter((p) => (colorBy === "status" ? p.status : p.content_type) === key).length;
    const known = keys.map((key) => ({ key, count: count(key) })).filter((entry) => entry.count > 0);
    const others = inView.length - known.reduce((sum, entry) => sum + entry.count, 0);
    return others > 0 ? [...known, { key: "Other", count: others }] : known;
  }, [colorBy, contentTypes, inView]);

  const step = (direction: 1 | -1) =>
    setCursor((current) => (mode === "week" ? addWeeks(current, direction) : addMonths(current, direction)));

  const title =
    mode === "week"
      ? `${format(days[0], "MMM d")} – ${format(days[days.length - 1], "MMM d, yyyy")}`
      : format(cursor, "MMMM yyyy");

  const openWeek = (day: Date) => {
    setCursor(day);
    setMode("week");
  };

  const drop = (date: string) => {
    if (dragging && dragging.publish_date !== date) onReschedule(dragging, date);
    setDragging(null);
    setDropDate(null);
  };

  const chip = (post: ContentWithInsight) => (
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
      title={`${post.title} · ${post.status} · ${post.content_type} · ${post.platform} ${post.account_name}`}
      className="flex w-full cursor-pointer items-center gap-1.5 rounded border bg-card px-1.5 py-1 text-left text-xs hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", dotOf(post))} />
      {post.publish_time && <span className="shrink-0 text-muted-foreground tabular-nums">{post.publish_time}</span>}
      <span className="truncate text-foreground">{post.title}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Calendar"
        description={
          !canMove
            ? "See what is planned for each day."
            : isMobile
              ? "Tap a post to open it and change its date."
              : "Drag a post to another day to reschedule it."
        }
        actions={
          canCreate && (
            <Button onClick={() => openPostForm({ mode: "create" })} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              New post
            </Button>
          )
        }
      />

      <div className="space-y-3">
        <ContentFilterBar
          filters={filters}
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onReset={() => setFilters(EMPTY_FILTERS)}
          hasActiveFilters={filtered}
        />
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button variant="outline" size="icon" aria-label="Previous" onClick={() => step(-1)} className="h-10 w-10 md:h-8 md:w-8">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Next" onClick={() => step(1)} className="h-10 w-10 md:h-8 md:w-8">
            <ChevronRight />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())} className="h-10 text-xs md:h-8">
            Today
          </Button>
          <h2 className="text-sm font-semibold text-foreground" aria-live="polite">
            {title}
            <span className="ml-2 font-normal text-muted-foreground">
              · {inView.length} post{inView.length === 1 ? "" : "s"}
              {filtered && " (filtered)"}
            </span>
          </h2>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Segmented
              label="Color posts by"
              value={colorBy}
              onChange={setColorBy}
              options={[
                { value: "status", label: "Status" },
                { value: "type", label: "Type" },
              ]}
            />
            <Segmented
              label="Calendar view"
              value={mode}
              onChange={setMode}
              options={[
                { value: "month", label: "Month" },
                { value: "week", label: "Week" },
                { value: "list", label: "List" },
              ]}
            />
          </div>
        </div>

        {legend.length > 0 && mode !== "list" && (
          <ul aria-label={`Colors by ${colorBy}`} className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {legend.map(({ key, count }) => (
              <li key={key} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", key === "Other" ? NO_COLOR : colorBy === "status" ? statusStyle(key).dot : typeColor(key))}
                />
                <span className="text-foreground">{key}</span>
                <span className="tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {filtered && inView.length === 0 && (
        <Card className="p-0">
          <NoResults size="sm" onClear={() => setFilters(EMPTY_FILTERS)} description={`No posts in ${title} match these filters.`} />
        </Card>
      )}

      {mode === "list" ? (
        !filtered || inView.length > 0 ? (
          <CalendarList
            days={days}
            byDate={byDate}
            today={today}
            dotOf={dotOf}
            emptyTitle={`Nothing planned for ${title}`}
            onAdd={canCreate ? () => openPostForm({ mode: "create" }) : undefined}
          />
        ) : null
      ) : (
        // The grid needs about 760px; narrower screens scroll it sideways inside this box.
        <div className="overflow-x-auto">
          <div className="min-w-190 overflow-hidden rounded-lg border">
            <div className="grid grid-cols-7 border-b bg-muted/40">
              {WEEKDAYS.map((day) => (
                <div key={day} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const date = format(day, "yyyy-MM-dd");
                const posts = byDate.get(date) ?? [];
                const shown = mode === "month" ? posts.slice(0, CELL_LIMIT) : posts;
                const hidden = posts.length - shown.length;
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
                      drop(date);
                    }}
                    className={cn(
                      "group min-w-0 space-y-1 border-r border-b p-1.5 [&:nth-child(7n)]:border-r-0",
                      mode === "month" ? "min-h-28" : "min-h-80",
                      // One background only: two would compete by stylesheet order, not class order.
                      dropDate === date
                        ? "bg-primary/10"
                        : mode === "month" && !isSameMonth(day, cursor)
                          ? "bg-muted/30"
                          : date < today && "bg-muted/10"
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
                          aria-label={`Add post on ${format(day, "MMMM d")}`}
                          onClick={() => openPostForm({ mode: "create", preset: { publish_date: date } })}
                          className="h-5 w-5 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {shown.map(chip)}
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => openWeek(day)}
                        className="w-full rounded px-1.5 py-0.5 text-left text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        +{hidden} more
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-md border p-0.5" role="group" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "secondary" : "ghost"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="h-9 px-3 text-xs md:h-7"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

/** The month as a list of days that have posts. The default on phones. */
function CalendarList({
  days,
  byDate,
  today,
  dotOf,
  emptyTitle,
  onAdd,
}: {
  days: Date[];
  byDate: Map<string, ContentWithInsight[]>;
  today: string;
  dotOf: (post: ContentWithInsight) => string;
  emptyTitle: string;
  onAdd?: () => void;
}) {
  const { openDetailDrawer } = useWorkspace();
  const filled = days.map((day) => ({ day, date: format(day, "yyyy-MM-dd") })).filter(({ date }) => byDate.has(date));

  if (filled.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={<CalendarDays />}
          title={emptyTitle}
          description="Posts with a publish date this month will show up here."
          action={
            onAdd && (
              <Button variant="outline" size="sm" onClick={onAdd} className="h-10 gap-1.5 md:h-8">
                <Plus /> New post
              </Button>
            )
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filled.map(({ day, date }) => {
        const posts = byDate.get(date)!;
        const relative = relativeDayLabel(date, today);
        return (
          <section key={date} aria-label={format(day, "EEEE, MMMM d")} className="space-y-1.5">
            <h3 className="flex items-baseline gap-2 text-xs font-semibold text-muted-foreground">
              <span className={cn(date === today && "text-primary")}>{relative ?? format(day, "EEEE")}</span>
              <span className="font-normal">{format(day, "MMM d")}</span>
              <span className="font-normal">· {posts.length}</span>
            </h3>
            <Card className="gap-0 divide-y p-0">
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => openDetailDrawer(post)}
                  className="flex w-full min-w-0 items-start gap-3 px-3 py-2.5 text-left outline-none first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <span className="w-11 shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums">{post.publish_time || "—"}</span>
                  <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", dotOf(post))} />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate text-sm font-medium text-foreground">{post.title}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{post.status}</span>
                      <span aria-hidden>·</span>
                      <span className="truncate">
                        {post.platform} {post.account_name}
                      </span>
                      <TypeBadge name={post.content_type} className="text-[10px]" />
                    </span>
                  </span>
                </button>
              ))}
            </Card>
          </section>
        );
      })}
    </div>
  );
}
