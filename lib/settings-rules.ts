// Pure rules for channels and content types, shared by server and client. No runtime imports, so `node --test` can load it.

export const TYPE_COLORS = ["slate", "blue", "teal", "emerald", "amber", "orange", "rose", "violet"] as const;

export const TYPE_FORMATS = [
  { value: "", label: "No default" },
  { value: "poster", label: "Poster" },
  { value: "video", label: "Video" },
  { value: "both", label: "Poster + Video" },
] as const;

export const CHANNEL_STATUSES = ["Active", "Paused", "Archived"] as const;

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDay(value));
const DAY_MS = 24 * 60 * 60 * 1000;
// Whole days since 1970, from "YYYY-MM-DD", with no timezone involved.
const toDay = (value: string) =>
  Date.UTC(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, Number(value.slice(8, 10))) / DAY_MS;

export function formatFlags(format?: string): { poster: boolean; video: boolean } | null {
  if (format === "poster") return { poster: true, video: false };
  if (format === "video") return { poster: false, video: true };
  if (format === "both") return { poster: true, video: true };
  return null;
}

// Returns what is wrong with the content type, or null. `others` are the other live types.
export function checkContentType(
  input: { name?: string; badge_color?: string; target_share_pct?: unknown; default_format?: string },
  others: { name: string }[]
): string | null {
  const name = input.name?.trim();
  if (!name) return "Content type name is required.";
  if (others.some((t) => t.name.trim().toLowerCase() === name.toLowerCase())) {
    return "A content type with that name already exists.";
  }
  if (input.badge_color && !(TYPE_COLORS as readonly string[]).includes(input.badge_color)) {
    return "That color is not available.";
  }
  const target = input.target_share_pct;
  if (target !== undefined && target !== "" && target !== null) {
    const pct = Number(target);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return "Target share must be between 0 and 100.";
  }
  if (input.default_format && !formatFlags(input.default_format)) return "That default format is not valid.";
  return null;
}

// Links are rendered as clickable hrefs, so only web addresses may be stored.
export function checkChannel(input: {
  platform?: string;
  account_name?: string;
  page_url?: string;
  avatar_url?: string;
  weekly_target_quota?: unknown;
  status?: string;
}): string | null {
  if (!input.platform?.trim() || !input.account_name?.trim()) return "Platform and account name are required.";
  for (const url of [input.page_url, input.avatar_url]) {
    if (url && !isHttpUrl(url)) return "Links must start with http:// or https://.";
  }
  const quota = Number(input.weekly_target_quota);
  if (!Number.isInteger(quota) || quota < 1 || quota > 50) return "Weekly target must be a whole number from 1 to 50.";
  if (input.status && !(CHANNEL_STATUSES as readonly string[]).includes(input.status)) return "That status is not valid.";
  return null;
}

export function checkSnapshot(input: { followers?: unknown; captured_at?: string }): string | null {
  const followers = Number(input.followers);
  if (input.followers === "" || !Number.isInteger(followers) || followers < 0) {
    return "Followers must be a whole number of 0 or more.";
  }
  if (input.captured_at && !isDate(input.captured_at)) return "Dates must be in YYYY-MM-DD format.";
  return null;
}

export interface ChannelHealth {
  planned: number;
  quota: number;
  daysSinceLastPost: number | null;
  state: "on-track" | "behind" | "paused";
}

// `posts` are this channel's posts. Weeks run Monday to Sunday.
export function channelHealth(
  channel: { status: string; weekly_target_quota: number },
  posts: { publish_date: string; status: string }[],
  today: string
): ChannelHealth {
  const now = toDay(today);
  const weekStart = now - ((new Date(now * DAY_MS).getUTCDay() + 6) % 7);
  const live = posts.filter((p) => p.status !== "Archived" && isDate(p.publish_date));
  const planned = live.filter((p) => {
    const day = toDay(p.publish_date);
    return day >= weekStart && day <= weekStart + 6;
  }).length;
  const lastPublished = live
    .filter((p) => p.status === "Published" && toDay(p.publish_date) <= now)
    .reduce<number | null>((latest, p) => Math.max(latest ?? -Infinity, toDay(p.publish_date)), null);
  const quota = channel.weekly_target_quota;
  return {
    planned,
    quota,
    daysSinceLastPost: lastPublished === null ? null : now - lastPublished,
    state: channel.status === "Paused" ? "paused" : planned >= quota ? "on-track" : "behind",
  };
}

// Newest snapshot first. The change is against the snapshot before it.
export function followerTrend<S extends { captured_at: string; followers: string | number }>(snapshots: S[]) {
  const sorted = [...snapshots].sort((a, b) => b.captured_at.localeCompare(a.captured_at));
  const latest = sorted[0] ? Number(sorted[0].followers) : null;
  const previous = sorted[1] ? Number(sorted[1].followers) : null;
  return { latest, change: latest !== null && previous !== null ? latest - previous : null, history: sorted };
}

// Share of this month's posts per type, next to each type's target.
export function typeMix(
  posts: { content_type: string; publish_date: string; status: string }[],
  types: { name: string; target_share_pct?: number }[],
  month: string // "YYYY-MM"
) {
  const inMonth = posts.filter((p) => p.status !== "Archived" && p.publish_date.startsWith(month));
  return types.map((type) => {
    const count = inMonth.filter((p) => p.content_type === type.name).length;
    return {
      name: type.name,
      count,
      actualPct: inMonth.length ? Math.round((count / inMonth.length) * 100) : 0,
      targetPct: type.target_share_pct || 0,
    };
  });
}
