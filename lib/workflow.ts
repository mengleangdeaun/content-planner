// Pure content workflow rules, shared by server and client. No runtime imports, so `node --test` can load it.

export const BOARD_STATUSES = [
  "Draft",
  "In Production",
  "In Review",
  "In Revise",
  "Approved",
  "Scheduled",
  "Published",
] as const;

export const ALL_STATUSES = [...BOARD_STATUSES, "Archived"] as const;

export const PRIORITIES = ["Low", "Normal", "High"] as const;

const NEXT_STATUSES: Record<string, string[]> = {
  Draft: ["In Production", "Archived"],
  "In Production": ["Draft", "In Review", "Archived"],
  "In Review": ["In Production", "In Revise", "Approved", "Archived"],
  "In Revise": ["In Production", "In Review", "Archived"],
  Approved: ["In Revise", "Scheduled", "Archived"],
  Scheduled: ["Approved", "Published", "Archived"],
  Published: ["Archived"],
  Archived: ["Draft"],
};

// Rows typed into the sheet by hand can hold any status, so those may move anywhere valid.
export function nextStatuses(from: string): string[] {
  return NEXT_STATUSES[from] ?? [...ALL_STATUSES];
}

export const LIVE_URL_REQUIRED = "Add the live post URL before marking this as Published.";

// Returns what is wrong with the change, or null if it is allowed.
export function checkStatusChange(from: string, to: string, liveUrl: string): string | null {
  if (to === "Published" && !liveUrl.trim()) return LIVE_URL_REQUIRED;
  if (to === from) return null;
  if (!nextStatuses(from).includes(to)) return `A post cannot move from ${from} to ${to}.`;
  return null;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function isValidDate(value: string): boolean {
  return DATE_PATTERN.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

// Links are rendered as clickable hrefs, so only web addresses may be stored.
export function checkContentFields(fields: Record<string, unknown>): string | null {
  for (const key of ["workspace_file_url", "live_post_url"]) {
    const value = fields[key];
    if (typeof value === "string" && value && !isHttpUrl(value)) return "Links must start with http:// or https://.";
  }
  for (const key of ["publish_date", "due_date"]) {
    const value = fields[key];
    if (typeof value === "string" && value && !isValidDate(value)) return "Dates must be in YYYY-MM-DD format.";
  }
  const time = fields.publish_time;
  if (typeof time === "string" && time && !TIME_PATTERN.test(time)) return "Publish time must be in HH:MM format.";
  const priority = fields.priority;
  if (typeof priority === "string" && priority && !(PRIORITIES as readonly string[]).includes(priority)) {
    return "Priority must be Low, Normal or High.";
  }
  return null;
}

// Dates are compared as YYYY-MM-DD strings, so no timezone shifts apply.
export function isOverdue(item: { due_date?: string; status: string }, today: string): boolean {
  if (!item.due_date || ["Scheduled", "Published", "Archived"].includes(item.status)) return false;
  return item.due_date < today;
}

// "open" is the stored value for To Do, so tasks saved before In Progress existed need no change.
export const TASK_STATUSES = [
  { value: "open", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

export function isTaskOverdue(task: { due_date?: string; status: string }, today: string): boolean {
  if (!task.due_date || task.status === "done" || task.status === "archived") return false;
  return task.due_date < today;
}

/** Splits a list into runs that share a day, keeping the list's order. `dayOf` returns "YYYY-MM-DD". */
export function groupByDay<T>(entries: T[], dayOf: (entry: T) => string): { day: string; entries: T[] }[] {
  const groups: { day: string; entries: T[] }[] = [];
  for (const entry of entries) {
    const day = dayOf(entry);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.entries.push(entry);
    else groups.push({ day, entries: [entry] });
  }
  return groups;
}

/** "Today" or "Yesterday" for those two days, otherwise null so the caller shows the date. */
export function relativeDayLabel(day: string, today: string): "Today" | "Yesterday" | null {
  if (day === today) return "Today";
  const yesterday = new Date(new Date(`${today}T00:00:00Z`).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return day === yesterday ? "Yesterday" : null;
}

export const NO_TASKS ={ done: 0, total: 0, percent: 0 } as const;

export function taskProgress(tasks: { status: string }[]): { done: number; total: number; percent: number } {
  const live = tasks.filter((task) => task.status !== "archived");
  const done = live.filter((task) => task.status === "done").length;
  return { done, total: live.length, percent: live.length ? Math.round((done / live.length) * 100) : 0 };
}
