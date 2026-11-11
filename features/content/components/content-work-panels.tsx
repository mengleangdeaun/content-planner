"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { TaskRow } from "@/features/planning/components/task-row";
import { addComment, fetchActivity } from "@/features/planning/services/planning-service";
import { canComment } from "@/lib/auth/permissions";
import { ActivityEntry, ContentWithInsight } from "@/lib/types";
import { taskProgress } from "@/lib/workflow";

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function ContentTasksPanel({ contentId }: { contentId: string }) {
  const { tasks, onAddTask, showToast } = useWorkspace();
  const { can } = useAuth();
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const postTasks = tasks.filter((task) => task.content_id === contentId);
  const progress = taskProgress(postTasks);

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
      {progress.total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.done} of {progress.total} done</span>
            <span>{progress.percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Task progress"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {postTasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
        {postTasks.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No tasks yet.</p>}
      </div>

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
          <Button type="submit" variant="outline" disabled={isSaving || !title.trim()} className={CONTROL_HEIGHT}>
            Add
          </Button>
        </form>
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

// Reopening a post shows its timeline instantly. It is fetched again only when the post has
// changed or the copy is over a minute old, which also picks up teammates' comments.
const ACTIVITY_FRESH_MS = 60 * 1000;
const activityCache = new Map<string, { version: string; fetchedAt: number; entries: ActivityEntry[] }>();

export function ContentActivityPanel({ item }: { item: ContentWithInsight }) {
  const { showToast, people, campaigns } = useWorkspace();
  const { currentUser } = useAuth();
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
    return entry.body.endsWith("_email") ? personName(value) : value;
  };

  const describe = (entry: ActivityEntry) => {
    if (entry.kind === "created") return `created this as ${entry.to_value}`;
    if (entry.kind === "status") return `moved this from ${entry.from_value} to ${entry.to_value}`;
    if (entry.kind === "field") {
      return `changed ${FIELD_LABELS[entry.body] ?? entry.body} from ${showValue(entry, entry.from_value)} to ${showValue(entry, entry.to_value)}`;
    }
    return "commented";
  };

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
        <form onSubmit={submit} className="space-y-2">
          <Textarea
            aria-label="Add a comment"
            rows={2}
            placeholder="Add a comment..."
            value={comment}
            autoCapitalize="sentences"
            onChange={(e) => setComment(e.target.value)}
            className="resize-none"
          />
          <Button type="submit" variant="outline" disabled={isSaving || !comment.trim()} className={CONTROL_HEIGHT}>
            {isSaving ? "Posting..." : "Post comment"}
          </Button>
        </form>
      )}

      {activity === null ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Loading activity...</p>
      ) : (
        <ol className="space-y-3">
          {activity.map((entry) => (
            <li key={entry.id} className="text-sm">
              <span className="font-medium text-foreground">{personName(entry.actor_email)}</span>{" "}
              <span className="text-muted-foreground">{describe(entry)}</span>
              <time dateTime={entry.at} className="block text-xs text-muted-foreground">
                {new Date(entry.at).toLocaleString()}
              </time>
              {entry.kind === "comment" && (
                <p className="mt-1 rounded-md border bg-muted/40 p-2.5 break-words whitespace-pre-wrap text-foreground">
                  {entry.body}
                </p>
              )}
            </li>
          ))}
          {activity.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground">No activity yet.</li>}
        </ol>
      )}
    </div>
  );
}
