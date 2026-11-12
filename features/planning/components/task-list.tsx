"use client";

import { useConfirm } from "@/components/shared/confirm-dialog";
import React from "react";
import { format } from "date-fns";
import { PanelRightOpen, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ActionButton } from "@/components/shared/action-button";
import { CardList } from "@/components/shared/card-list";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { PersonPicker } from "@/features/team/components/person-picker";
import { useIsDesktop } from "@/hooks/use-media-query";
import { ContentTask, ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isTaskOverdue } from "@/lib/workflow";
import { TaskStatusSelect } from "./task-status";

export interface TaskListRow {
  task: ContentTask;
  /** Left out inside the post drawer, where the post is already open. */
  post?: ContentWithInsight;
}

function TaskTitle({ task }: { task: ContentTask }) {
  const done = task.status === "done";
  const overdue = isTaskOverdue(task, format(new Date(), "yyyy-MM-dd"));
  return (
    <div className="min-w-0 space-y-1">
      <p className={cn("font-medium break-words", done ? "text-muted-foreground line-through" : "text-foreground")}>
        {task.title}
      </p>
      {overdue && (
        <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive">
          Overdue
        </Badge>
      )}
    </div>
  );
}

function PostLink({ post }: { post: ContentWithInsight }) {
  const { openDetailDrawer } = useWorkspace();
  return (
    <button
      type="button"
      onClick={() => openDetailDrawer(post, "tasks")}
      className="block max-w-full min-w-0 text-left outline-none hover:underline focus-visible:underline"
    >
      <span className="block truncate text-sm text-foreground">{post.title}</span>
      <span className="block truncate text-xs text-muted-foreground">
        {post.platform} · {post.account_name}
      </span>
    </button>
  );
}

function TaskAssignee({ task, className }: { task: ContentTask; className?: string }) {
  const { onUpdateTask } = useWorkspace();
  const { can } = useAuth();
  return (
    <PersonPicker
      aria-label={`Assignee of ${task.title}`}
      value={task.assignee_email}
      onChange={(assignee_email) => onUpdateTask(task, { assignee_email })}
      readOnly={!can("tasks.manage")}
      className={className}
    />
  );
}

function TaskDue({ task, className }: { task: ContentTask; className?: string }) {
  const { onUpdateTask } = useWorkspace();
  const { can } = useAuth();
  return (
    <ResponsiveDatePicker
      aria-label={`Due date of ${task.title}`}
      value={task.due_date}
      disabled={!can("tasks.manage")}
      placeholder="No due date"
      displayFormat="MMM d, yyyy"
      onChange={(due_date) => onUpdateTask(task, { due_date })}
      className={className}
    />
  );
}

function TaskActions({ row, showLabels }: { row: TaskListRow; showLabels?: boolean }) {
  const { openDetailDrawer, onUpdateTask } = useWorkspace();
  const { can } = useAuth();
  const variant = showLabels ? "outline" : "ghost";
  const confirm = useConfirm();
  const remove = async () => {
    const ok = await confirm({
      title: `Remove "${row.task.title}"?`,
      description: "The task is archived and no longer counts toward the post's progress.",
      confirmLabel: "Remove task",
    });
    if (ok) onUpdateTask(row.task, { status: "archived" });
  };
  return (
    <div className={cn("flex items-center gap-1", showLabels ? "flex-wrap" : "justify-end")}>
      {row.post && (
        <ActionButton
          icon={<PanelRightOpen />}
          label="Open post"
          onClick={() => openDetailDrawer(row.post!, "tasks")}
          showLabel={showLabels}
          variant={variant}
        />
      )}
      {can("tasks.manage") && (
        <ActionButton icon={<Trash2 />} label="Remove task" onClick={remove} showLabel={showLabels} variant={variant} />
      )}
    </div>
  );
}

function useTaskColumns(): DataColumn<TaskListRow>[] {
  const { can } = useAuth();
  const readOnly = !can("tasks.manage");
  return [
    { key: "task", header: "Task", cell: ({ task }) => <TaskTitle task={task} /> },
    {
      key: "post",
      header: "Post",
      className: "w-64",
      interactive: true,
      cell: ({ post }) => (post ? <PostLink post={post} /> : null),
    },
    {
      key: "status",
      header: "Status",
      // Wide enough for the longest label, "In Progress", with its dot and arrow.
      className: "w-44",
      interactive: true,
      cell: ({ task }) => <TaskStatusSelect task={task} disabled={readOnly} className="h-9 w-full" />,
    },
    {
      key: "assignee",
      header: "Assignee",
      className: "w-40",
      interactive: true,
      cell: ({ task }) => <TaskAssignee task={task} className="h-9" />,
    },
    {
      key: "due",
      header: "Due",
      // "Nov 12, 2026" with its icon fits; keeps the table from scrolling at 1280px.
      className: "w-36",
      interactive: true,
      cell: ({ task }) => <TaskDue task={task} className="h-9" />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-24",
      align: "right",
      interactive: true,
      cell: (row) => <TaskActions row={row} />,
    },
  ];
}

/** One task with its controls. Used on narrow screens and in the post drawer. */
export function TaskCard({ row }: { row: TaskListRow }) {
  const { can } = useAuth();
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <TaskTitle task={row.task} />
      {row.post && <PostLink post={row.post} />}
      {/* Two per row, so the status pill never squeezes "In Progress", even in the narrow drawer. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TaskStatusSelect task={row.task} disabled={!can("tasks.manage")} className="h-9 w-full" />
        <TaskAssignee task={row.task} className="h-9" />
        <div className="sm:col-span-2">
          <TaskDue task={row.task} className="h-9" />
        </div>
      </div>
      <div className="mt-auto">
        <TaskActions row={row} showLabels />
      </div>
    </Card>
  );
}

/** A compact task for the post drawer: tick it done on the first line, adjust the details on the second. */
export function TaskItem({ task }: { task: ContentTask }) {
  const { onUpdateTask } = useWorkspace();
  const { can } = useAuth();
  const canManage = can("tasks.manage");
  const done = task.status === "done";
  return (
    <li className={cn("space-y-2.5 rounded-lg border p-3", done ? "bg-muted/30" : "bg-card")}>
      <div className="flex items-start gap-2.5">
        <Checkbox
          aria-label={`Mark "${task.title}" as done`}
          checked={done}
          disabled={!canManage}
          onCheckedChange={(checked) => onUpdateTask(task, { status: checked ? "done" : "open" })}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <TaskTitle task={task} />
        </div>
        <div className="-my-1 -mr-1 shrink-0">
          <TaskActions row={{ task }} />
        </div>
      </div>
      {/* The status pill keeps a fixed width so "In Progress" is never cut off; the rest share the row and wrap if needed. */}
      <div className="flex flex-wrap gap-2">
        <div className="w-40 shrink-0">
          <TaskStatusSelect task={task} disabled={!canManage} className="h-9 w-full" />
        </div>
        <div className="min-w-32 flex-1">
          <TaskAssignee task={task} className="h-9" />
        </div>
        <div className="min-w-32 flex-1">
          <TaskDue task={task} className="h-9" />
        </div>
      </div>
    </li>
  );
}

/** Table from 1280px up, cards below. Only one is rendered, chosen with a media query. */
export function TaskList({ rows, empty }: { rows: TaskListRow[]; empty: React.ReactNode }) {
  const isDesktop = useIsDesktop();
  const columns = useTaskColumns();
  const { openDetailDrawer } = useWorkspace();

  return isDesktop ? (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.task.id}
      onRowClick={(row) => row.post && openDetailDrawer(row.post, "tasks")}
      empty={empty}
    />
  ) : (
    <CardList rows={rows} getRowKey={(row) => row.task.id} renderCard={(row) => <TaskCard row={row} />} empty={empty} />
  );
}
