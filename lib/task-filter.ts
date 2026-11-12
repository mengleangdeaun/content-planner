// Pure filtering and sorting for the Tasks page. No runtime imports, so `node --test` can load it;
// the channel lookup is passed in.

export const UNASSIGNED = "none";

export interface TaskFilters {
  search: string;
  statuses: string[]; // Empty means every status.
  assignees: string[]; // Emails, or UNASSIGNED.
  channelIds: string[];
  myTasks: boolean;
  overdueOnly: boolean;
}

export const EMPTY_TASK_FILTERS: TaskFilters = {
  search: "",
  statuses: [],
  assignees: [],
  channelIds: [],
  myTasks: false,
  overdueOnly: false,
};

export type TaskSort = "due" | "newest" | "post";

export const TASK_SORTS: { value: TaskSort; label: string }[] = [
  { value: "due", label: "Due date" },
  { value: "newest", label: "Newest first" },
  { value: "post", label: "Post publish date" },
];

interface TaskLike {
  title: string;
  status: string;
  assignee_email?: string;
  due_date?: string;
  created_at?: string;
}

interface PostLike {
  title: string;
  publish_date: string;
}

export interface TaskRowLike {
  task: TaskLike;
  post: PostLike;
}

// Dates are compared as YYYY-MM-DD strings, so no timezone shifts apply.
const isOverdue = (task: TaskLike, today: string) =>
  Boolean(task.due_date) && task.status !== "done" && task.status !== "archived" && task.due_date! < today;

const allows = (chosen: string[], value: string) => chosen.length === 0 || chosen.includes(value);

export function filterTasks<R extends TaskRowLike>(
  rows: R[],
  filters: TaskFilters,
  helpers: { channelIdOf: (row: R) => string; today: string; currentEmail: string }
): R[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    const { task, post } = row;
    if (!allows(filters.statuses, task.status)) return false;
    if (!allows(filters.assignees, task.assignee_email || UNASSIGNED)) return false;
    if (!allows(filters.channelIds, helpers.channelIdOf(row))) return false;
    if (filters.myTasks && task.assignee_email !== helpers.currentEmail) return false;
    if (filters.overdueOnly && !isOverdue(task, helpers.today)) return false;
    return !query || task.title.toLowerCase().includes(query) || post.title.toLowerCase().includes(query);
  });
}

export function hasActiveTaskFilters(filters: TaskFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    filters.statuses.length > 0 ||
    filters.assignees.length > 0 ||
    filters.channelIds.length > 0 ||
    filters.myTasks ||
    filters.overdueOnly
  );
}

// Blank dates sort after real ones, whichever way the list is ordered.
const LAST = "9999-12-31";

export function sortTasks<R extends TaskRowLike>(rows: R[], sort: TaskSort): R[] {
  const byTitle = (a: R, b: R) => a.task.title.localeCompare(b.task.title);
  return [...rows].sort((a, b) => {
    if (sort === "newest") {
      return (b.task.created_at ?? "").localeCompare(a.task.created_at ?? "") || byTitle(a, b);
    }
    if (sort === "post") {
      return (a.post.publish_date || LAST).localeCompare(b.post.publish_date || LAST) || byTitle(a, b);
    }
    // Due date: unfinished first, then soonest due.
    const finished = Number(a.task.status === "done") - Number(b.task.status === "done");
    return finished || (a.task.due_date || LAST).localeCompare(b.task.due_date || LAST) || byTitle(a, b);
  });
}
