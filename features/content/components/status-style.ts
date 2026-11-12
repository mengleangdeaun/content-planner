// One color per status, used by every status badge, dropdown, board column and calendar dot.
// Full class strings, so Tailwind can see them.
interface StatusStyle {
  dot: string;
  pill: string;
}

const STATUS_STYLE: Record<string, StatusStyle> = {
  Draft: {
    dot: "bg-slate-400",
    pill: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
  },
  "In Production": {
    dot: "bg-blue-500",
    pill: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  },
  "In Review": {
    dot: "bg-amber-500",
    pill: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  },
  "In Revise": {
    dot: "bg-orange-500",
    pill: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
  },
  Approved: {
    dot: "bg-emerald-500",
    pill: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  Scheduled: {
    dot: "bg-violet-500",
    pill: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
  },
  Published: {
    dot: "bg-green-600",
    pill: "border-green-400 bg-green-100 text-green-900 dark:border-green-700 dark:bg-green-900/60 dark:text-green-200",
  },
  Archived: {
    dot: "bg-muted-foreground/50",
    pill: "border-border bg-muted text-muted-foreground",
  },
};

// Statuses typed into the sheet by hand fall back to the muted style.
export function statusStyle(status: string): StatusStyle {
  return STATUS_STYLE[status] ?? STATUS_STYLE.Archived;
}
