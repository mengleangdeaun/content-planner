"use client";

import React from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { ContentTask, ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, isTaskOverdue } from "@/lib/workflow";

const NONE = "none";

export const TASK_GRID = "md:grid-cols-[minmax(0,1fr)_9rem_10rem_10rem_2.25rem]";

interface TaskRowProps {
  task: ContentTask;
  /** Set on the Tasks page: links to the post, and lays the row out as table columns on desktop. */
  post?: ContentWithInsight;
}

export function TaskRow({ task, post }: TaskRowProps) {
  const { people, onUpdateTask, openDetailDrawer } = useWorkspace();
  const { can } = useAuth();
  const canManage = can("tasks.manage");
  const done = task.status === "done";
  const overdue = isTaskOverdue(task, format(new Date(), "yyyy-MM-dd"));

  const remove = () => {
    if (confirm(`Remove "${task.title}"?`)) onUpdateTask(task, { status: "archived" });
  };
  const removeButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Remove ${task.title}`}
      onClick={remove}
      className="h-11 w-11 shrink-0 text-muted-foreground md:h-9 md:w-9"
    >
      <Trash2 />
    </Button>
  );

  return (
    <div className={cn("grid grid-cols-1 items-center gap-2 rounded-lg border bg-card p-3", post && TASK_GRID)}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("text-sm font-medium break-words", done ? "text-muted-foreground line-through" : "text-foreground")}>
            {task.title}
          </p>
          {post && (
            <button
              type="button"
              onClick={() => openDetailDrawer(post, "tasks")}
              className="block max-w-full truncate text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {post.title} · {post.account_name}
            </button>
          )}
          {overdue && (
            <Badge variant="outline" className="mt-1 border-destructive/40 text-[10px] text-destructive">
              Overdue
            </Badge>
          )}
        </div>
        {canManage && <div className={post ? "md:hidden" : undefined}>{removeButton}</div>}
      </div>

      <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-3", post && "md:contents")}>
        <ResponsiveSelect
          aria-label={`Status of ${task.title}`}
          value={task.status}
          disabled={!canManage}
          options={TASK_STATUSES}
          onValueChange={(status) => onUpdateTask(task, { status: status as ContentTask["status"] })}
        />
        <ResponsiveSelect
          aria-label={`Assignee of ${task.title}`}
          value={task.assignee_email || NONE}
          disabled={!canManage}
          options={[{ value: NONE, label: "Unassigned" }, ...people.map((p) => ({ value: p.email, label: p.name }))]}
          onValueChange={(email) => onUpdateTask(task, { assignee_email: email === NONE ? "" : email })}
        />
        <ResponsiveDatePicker
          aria-label={`Due date of ${task.title}`}
          value={task.due_date}
          disabled={!canManage}
          placeholder="No due date"
          onChange={(due_date) => onUpdateTask(task, { due_date })}
        />
      </div>

      {post && canManage && <div className="hidden md:block">{removeButton}</div>}
    </div>
  );
}
