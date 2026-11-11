"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT, Field, FormActions, FormError } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { resolveChannelId } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, isTaskOverdue, taskProgress } from "@/lib/workflow";
import { TASK_GRID, TaskRow } from "./task-row";

const ALL = "all";
const NONE = "none";

export function TasksView() {
  const { tasks, items, channels, people } = useWorkspace();
  const { can, currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [assignee, setAssignee] = useState(ALL);
  const [channelId, setChannelId] = useState(ALL);
  const [myTasks, setMyTasks] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  // Tasks on archived posts are finished business, so they drop out of the counts too.
  const rows = useMemo(
    () =>
      tasks.flatMap((task) => {
        const post = items.find((item) => item.id === task.content_id);
        return post && post.status !== "Archived" ? [{ task, post }] : [];
      }),
    [tasks, items]
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows
      .filter(({ task, post }) => {
        if (status !== ALL && task.status !== status) return false;
        if (assignee !== ALL && (task.assignee_email || NONE) !== assignee) return false;
        if (channelId !== ALL && resolveChannelId(post, channels) !== channelId) return false;
        if (myTasks && task.assignee_email !== currentUser.email) return false;
        return !query || task.title.toLowerCase().includes(query) || post.title.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const finished = Number(a.task.status === "done") - Number(b.task.status === "done");
        if (finished !== 0) return finished;
        // Tasks with no due date go last.
        return (a.task.due_date || "9999").localeCompare(b.task.due_date || "9999");
      });
  }, [rows, search, status, assignee, channelId, myTasks, channels, currentUser.email]);

  const all = rows.map((row) => row.task);
  const progress = taskProgress(all);
  const stats = [
    { label: "To Do", value: all.filter((t) => t.status === "open").length },
    { label: "In Progress", value: all.filter((t) => t.status === "in_progress").length },
    { label: "Done", value: progress.done },
    { label: "Overdue", value: all.filter((t) => isTaskOverdue(t, today)).length, alert: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track the work behind every post, across all channels.</p>
        </div>
        {can("tasks.manage") && (
          <Button onClick={() => setIsAdding(true)} className="gap-2 self-start font-medium sm:self-auto">
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        )}
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={cn("text-2xl font-semibold text-foreground", stat.alert && stat.value > 0 && "text-destructive")}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.done} of {progress.total} done</span>
            <span>{progress.percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Overall task progress"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_9rem_11rem_11rem_auto]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks or posts..."
            value={search}
            enterKeyHint="search"
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-9", CONTROL_HEIGHT)}
          />
        </div>
        <ResponsiveSelect
          aria-label="Filter by status"
          value={status}
          onValueChange={setStatus}
          options={[{ value: ALL, label: "All statuses" }, ...TASK_STATUSES]}
        />
        <ResponsiveSelect
          aria-label="Filter by assignee"
          value={assignee}
          onValueChange={setAssignee}
          options={[
            { value: ALL, label: "All assignees" },
            { value: NONE, label: "Unassigned" },
            ...people.map((p) => ({ value: p.email, label: p.name })),
          ]}
        />
        <ResponsiveSelect
          aria-label="Filter by channel"
          value={channelId}
          onValueChange={setChannelId}
          options={[
            { value: ALL, label: "All channels" },
            ...channels.map((c) => ({ value: c.id, label: `${c.platform} — ${c.account_name}` })),
          ]}
        />
        <Button
          variant={myTasks ? "secondary" : "outline"}
          aria-pressed={myTasks}
          onClick={() => setMyTasks(!myTasks)}
          className={CONTROL_HEIGHT}
        >
          My Tasks
        </Button>
      </div>

      <div className="space-y-2">
        <div className={cn("hidden gap-2 px-3 text-xs font-medium text-muted-foreground md:grid", TASK_GRID)}>
          <span>Task</span>
          <span>Status</span>
          <span>Assignee</span>
          <span>Due</span>
        </div>
        {visible.map(({ task, post }) => (
          <TaskRow key={task.id} task={task} post={post} />
        ))}
        {visible.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No tasks yet. Add one here or from a post." : "No tasks match these filters."}
          </Card>
        )}
      </div>

      {isAdding && <NewTaskDialog onClose={() => setIsAdding(false)} />}
    </div>
  );
}

function NewTaskDialog({ onClose }: { onClose: () => void }) {
  const { items, people, onAddTask, showToast } = useWorkspace();
  const posts = items.filter((item) => item.status !== "Archived" && item.status !== "Published");
  const [contentId, setContentId] = useState(posts[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(NONE);
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contentId) return setError("Choose a post for this task.");
    try {
      setIsSaving(true);
      await onAddTask({
        content_id: contentId,
        title,
        assignee_email: assignee === NONE ? "" : assignee,
        due_date: dueDate,
      });
      showToast("Task added");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title="New task"
      description="Add a piece of work to a post."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" form="task-form" disabled={isSaving}>{isSaving ? "Saving..." : "Add task"}</Button>
          </FormActions>
        </div>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-3">
        <Field label="Task" htmlFor="task-title" required>
          <Input
            id="task-title"
            className={CONTROL_HEIGHT}
            placeholder="e.g. Design poster"
            value={title}
            autoCapitalize="sentences"
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>
        <Field label="Post" htmlFor="task-post" required>
          <ResponsiveSelect
            id="task-post"
            value={contentId}
            onValueChange={setContentId}
            placeholder="Select a post"
            options={posts.map((p) => ({ value: p.id, label: `${p.title} · ${p.account_name}` }))}
          />
        </Field>
        <Field label="Assignee" htmlFor="task-assignee">
          <ResponsiveSelect
            id="task-assignee"
            value={assignee}
            onValueChange={setAssignee}
            options={[{ value: NONE, label: "Unassigned" }, ...people.map((p) => ({ value: p.email, label: p.name }))]}
          />
        </Field>
        <Field label="Due date" htmlFor="task-due">
          <ResponsiveDatePicker id="task-due" value={dueDate} onChange={setDueDate} placeholder="No due date" />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
