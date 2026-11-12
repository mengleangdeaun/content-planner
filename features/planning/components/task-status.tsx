"use client";

import React from "react";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useWorkspace } from "@/context/workspace-context";
import { ContentTask } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TASK_STATUSES } from "@/lib/workflow";

// Same look as post statuses: a tinted pill with a dot. Full class strings, so Tailwind can see them.
const TASK_STATUS_STYLE: Record<string, { dot: string; pill: string }> = {
  open: {
    dot: "bg-slate-400",
    pill: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
  },
  in_progress: {
    dot: "bg-blue-500",
    pill: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  },
  done: {
    dot: "bg-green-600",
    pill: "border-green-400 bg-green-100 text-green-900 dark:border-green-700 dark:bg-green-900/60 dark:text-green-200",
  },
};

interface TaskStatusSelectProps {
  task: ContentTask;
  disabled?: boolean;
  className?: string;
}

export function TaskStatusSelect({ task, disabled, className }: TaskStatusSelectProps) {
  const { onUpdateTask } = useWorkspace();
  const style = TASK_STATUS_STYLE[task.status] ?? TASK_STATUS_STYLE.open;
  return (
    <ResponsiveSelect
      aria-label={`Status of ${task.title}`}
      value={task.status}
      disabled={disabled}
      className={className}
      prefix={<span className={cn("size-2 shrink-0 rounded-full", style.dot)} />}
      toneClassName={cn("rounded-full font-medium shadow-none", style.pill)}
      options={TASK_STATUSES}
      onValueChange={(status) => status !== task.status && onUpdateTask(task, { status: status as ContentTask["status"] })}
    />
  );
}
