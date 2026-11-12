// Pure calculations behind the Dashboard. No runtime imports, so `node --test` can load it.

const DAY_MS = 86_400_000;
const isDay = (value?: string) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
const toDay = (value: string) => Math.floor(Date.parse(`${value}T00:00:00Z`) / DAY_MS);

/**
 * How many days a date preset covers, matching `isDateInFilter`. Null when the period has no end,
 * such as "All dates" or a custom range missing a date, so no target can be set for it.
 */
export function periodDays(preset: string, today: string, customStart = "", customEnd = ""): number | null {
  switch (preset) {
    case "today":
      return 1;
    case "this-week":
      return 7;
    case "this-month": {
      const [year, month] = today.split("-").map(Number);
      return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }
    case "next-7-days": // Today plus the next 7 days.
      return 8;
    case "past-30-days": // The past 30 days plus today.
      return 31;
    case "custom":
      if (!isDay(customStart) || !isDay(customEnd)) return null;
      return Math.max(0, toDay(customEnd) - toDay(customStart) + 1);
    default:
      return null;
  }
}

/** A weekly quota scaled to the period, rounded up so a short period still asks for one post. */
export function periodTarget(weeklyQuota: number, days: number): number {
  return Math.ceil((Math.max(0, weeklyQuota || 0) * days) / 7);
}

/** Posts per status, in the order given. */
export function statusCounts(posts: { status: string }[], statuses: readonly string[]) {
  return statuses.map((status) => ({ status, count: posts.filter((p) => p.status === status).length }));
}

/** In Review posts this person should look at: theirs to review, or unassigned ones if they can approve. */
export function needsReview<P extends { status: string; reviewer_email?: string }>(
  posts: P[],
  member: { email: string; permissions: readonly string[] }
): P[] {
  const canApprove = member.permissions.includes("content.approve");
  return posts.filter(
    (p) => p.status === "In Review" && (p.reviewer_email ? p.reviewer_email === member.email : canApprove)
  );
}

const OPEN_TASK = ["open", "in_progress"];
const FINISHED_POST = ["Published", "Archived"];

/** Unfinished posts and open tasks on those posts, per person. Busiest first. */
export function workload(
  posts: { id: string; status: string; assignee_email?: string }[],
  tasks: { content_id: string; status: string; assignee_email: string }[]
): { email: string; posts: number; tasks: number }[] {
  const byEmail = new Map<string, { email: string; posts: number; tasks: number }>();
  const entry = (email: string) => {
    if (!byEmail.has(email)) byEmail.set(email, { email, posts: 0, tasks: 0 });
    return byEmail.get(email)!;
  };
  const postIds = new Set(posts.map((p) => p.id));
  for (const post of posts) {
    if (post.assignee_email && !FINISHED_POST.includes(post.status)) entry(post.assignee_email).posts++;
  }
  for (const task of tasks) {
    if (task.assignee_email && OPEN_TASK.includes(task.status) && postIds.has(task.content_id)) {
      entry(task.assignee_email).tasks++;
    }
  }
  return [...byEmail.values()].sort((a, b) => b.posts + b.tasks - (a.posts + a.tasks) || a.email.localeCompare(b.email));
}
