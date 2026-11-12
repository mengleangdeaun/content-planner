"use client";

import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowRight, CalendarDays, ExternalLink, Flag, ListChecks, MessageSquare, Pencil, Plus, UserRound } from "lucide-react";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDisplayDate, formatShortDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { ContentStatusBadge } from "./content-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CONTROL_HEIGHT } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { TaskItem } from "@/features/planning/components/task-list";
import { addComment, fetchActivity } from "@/features/planning/services/planning-service";
import { canComment } from "@/lib/auth/permissions";
import { linkOverSelection, parseComment, shortUrl } from "@/lib/comment-links";
import { ActivityEntry, ContentWithInsight } from "@/lib/types";
import { groupByDay, relativeDayLabel } from "@/lib/workflow";

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function ContentTasksPanel({ contentId }: { contentId: string }) {
  const { tasks, onAddTask, showToast } = useWorkspace();
  const { can } = useAuth();
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Newest first, so a task just added appears right under the box it was typed in.
  const postTasks = tasks
    .filter((task) => task.content_id === contentId)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setIsSaving(true);
      await onAddTask({ content_id: contentId, title });
      setTitle("");
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to add task"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {can("tasks.manage") && (
        <form onSubmit={add} className="flex gap-2">
          <Input
            aria-label="New task"
            placeholder="Add a task..."
            value={title}
            enterKeyHint="done"
            autoCapitalize="sentences"
            onChange={(e) => setTitle(e.target.value)}
            className={CONTROL_HEIGHT}
          />
          <Button type="submit" disabled={isSaving || !title.trim()} className={cn("gap-1.5", CONTROL_HEIGHT)}>
            <Plus /> Add
          </Button>
        </form>
      )}

      {postTasks.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<ListChecks />}
          title="No tasks yet"
          description={can("tasks.manage") ? "Add the steps this post needs above." : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {postTasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      )}
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  assignee_email: "assignee",
  reviewer_email: "reviewer",
  due_date: "due date",
  publish_date: "publish date",
  campaign_id: "campaign",
};

const FIELD_ICONS: Record<string, React.ReactNode> = {
  assignee_email: <UserRound />,
  reviewer_email: <UserRound />,
  due_date: <CalendarDays />,
  publish_date: <CalendarDays />,
  campaign_id: <Flag />,
};

const VALUE_CHIP = "rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground";

// Reopening a post shows its timeline instantly. It is fetched again only when the post has
// changed or the copy is over a minute old, which also picks up teammates' comments.
const ACTIVITY_FRESH_MS = 60 * 1000;
const activityCache = new Map<string, { version: string; fetchedAt: number; entries: ActivityEntry[] }>();

export function ContentActivityPanel({ item }: { item: ContentWithInsight }) {
  const { showToast, people, campaigns } = useWorkspace();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();
  const [activity, setActivity] = useState<ActivityEntry[] | null>(
    () => activityCache.get(item.id)?.entries ?? null
  );
  const [comment, setComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const version = item.updated_at ?? "";

  const load = useCallback(
    () =>
      fetchActivity(item.id)
        .then((entries) => {
          activityCache.set(item.id, { version, fetchedAt: Date.now(), entries });
          setActivity(entries);
        })
        .catch((err: unknown) => showToast(errorText(err, "Failed to load activity"))),
    [item.id, version, showToast]
  );

  // updated_at changes with every edit, so status and field changes refresh the timeline.
  useEffect(() => {
    const cached = activityCache.get(item.id);
    if (cached && cached.version === version && Date.now() - cached.fetchedAt < ACTIVITY_FRESH_MS) return;
    load();
  }, [item.id, version, load]);

  const personName = (email: string) => people.find((p) => p.email === email)?.name ?? email;

  const showValue = (entry: ActivityEntry, value: string) => {
    if (!value) return "none";
    if (entry.body === "campaign_id") return campaigns.find((c) => c.id === value)?.name ?? value;
    if (entry.body.endsWith("_date")) return formatShortDate(value);
    return entry.body.endsWith("_email") ? personName(value) : value;
  };

  // What happened, with status pills and value chips so changes can be read at a glance.
  const describe = (entry: ActivityEntry) => {
    const arrow = <ArrowRight aria-label="to" className="inline size-3 shrink-0" />;
    if (entry.kind === "created") {
      return (
        <>
          created this post as <ContentStatusBadge status={entry.to_value} />
        </>
      );
    }
    if (entry.kind === "status") {
      return (
        <>
          moved this <ContentStatusBadge status={entry.from_value} /> {arrow} <ContentStatusBadge status={entry.to_value} />
        </>
      );
    }
    return (
      <>
        changed {FIELD_LABELS[entry.body] ?? entry.body} <span className={VALUE_CHIP}>{showValue(entry, entry.from_value)}</span>{" "}
        {arrow} <span className={VALUE_CHIP}>{showValue(entry, entry.to_value)}</span>
      </>
    );
  };

  const marker = (entry: ActivityEntry) => {
    if (entry.kind === "comment") {
      return (
        <PersonAvatar
          name={personName(entry.actor_email)}
          avatarUrl={people.find((p) => p.email === entry.actor_email)?.avatar_url}
          className="relative"
        />
      );
    }
    const icon =
      entry.kind === "created" ? <Plus /> : entry.kind === "status" ? <ArrowRight /> : (FIELD_ICONS[entry.body] ?? <Pencil />);
    return (
      <span aria-hidden className="relative flex size-7 shrink-0 items-center justify-center rounded-full border bg-popover text-muted-foreground [&_svg]:size-3.5">
        {icon}
      </span>
    );
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const groups = groupByDay(activity ?? [], (entry) => {
    const at = new Date(entry.at);
    return Number.isNaN(at.getTime()) ? "" : format(at, "yyyy-MM-dd");
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await addComment(item.id, comment);
      setComment("");
      await load();
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to add comment"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {canComment(currentUser) && (
        <form onSubmit={submit} className="flex gap-3">
          <PersonAvatar name={currentUser.name} avatarUrl={currentUser.avatar_url} className="mt-1" />
          <div className="min-w-0 flex-1 space-y-2">
            <Textarea
              aria-label="Add a comment"
              rows={2}
              placeholder="Add a comment..."
              value={comment}
              autoCapitalize="sentences"
              onChange={(e) => setComment(e.target.value)}
              onPaste={(e) => {
                // A URL pasted over selected words becomes a named link; any other paste is untouched.
                const box = e.currentTarget;
                const named = linkOverSelection(comment, box.selectionStart, box.selectionEnd, e.clipboardData.getData("text"));
                if (!named) return;
                e.preventDefault();
                setComment(named.text);
                requestAnimationFrame(() => box.setSelectionRange(named.caret, named.caret));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit();
              }}
              className="resize-none"
            />
            <div className="flex items-center justify-end gap-3">
              <span className="text-xs text-muted-foreground">
                Select words and paste a link to name it{!isMobile && " · Ctrl + Enter to post"}
              </span>
              <Button type="submit" variant="outline" disabled={isSaving || !comment.trim()} className={CONTROL_HEIGHT}>
                {isSaving ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {activity === null ? (
        <div className="space-y-4" aria-label="Loading activity" role="status">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-7 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <EmptyState size="sm" icon={<MessageSquare />} title="No activity yet" />
      ) : (
        <ol className="space-y-5">
          {groups.map((group) => (
            <li key={group.day} className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground">
                {group.day ? (relativeDayLabel(group.day, today) ?? formatDisplayDate(group.day)) : "Earlier"}
              </h4>
              {/* The rail runs behind the markers, which have a solid background to sit on top of it. */}
              <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-px before:bg-border">
                {group.entries.map((entry) => {
                  const at = new Date(entry.at);
                  const valid = !Number.isNaN(at.getTime());
                  const time = (
                    <time dateTime={entry.at} title={valid ? at.toLocaleString() : undefined} className="shrink-0 text-xs text-muted-foreground">
                      {valid ? at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                    </time>
                  );
                  const name = <span className="font-medium text-foreground">{personName(entry.actor_email)}</span>;
                  return (
                    <li key={entry.id} className="relative flex gap-3 text-sm">
                      {marker(entry)}
                      {entry.kind === "comment" ? (
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="flex items-baseline justify-between gap-2">
                            {name}
                            {time}
                          </p>
                          <div
                            className={cn(
                              "rounded-lg border p-3 break-words whitespace-pre-wrap text-foreground",
                              entry.actor_email === currentUser.email ? "border-primary/30 bg-primary/5" : "bg-muted/40"
                            )}
                          >
                            <CommentBody text={entry.body} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-start justify-between gap-2 pt-1">
                          <p className="min-w-0 leading-6 break-words text-muted-foreground">
                            {name} {describe(entry)}
                          </p>
                          {time}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** A comment's text with its links made clickable. Only parsed http(s) URLs ever reach href. */
function CommentBody({ text }: { text: string }) {
  return (
    <>
      {parseComment(text).map((segment, i) =>
        segment.type === "text" ? (
          <React.Fragment key={i}>{segment.text}</React.Fragment>
        ) : (
          <a
            key={i}
            href={segment.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={segment.url}
            className="font-medium break-all text-primary underline underline-offset-2 hover:decoration-2"
          >
            {segment.label ?? shortUrl(segment.url)}
            <ExternalLink aria-hidden className="ml-0.5 inline size-3 align-[-1px]" />
          </a>
        )
      )}
    </>
  );
}
