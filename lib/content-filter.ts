// Pure matching for the Content Management filters. No runtime imports, so `node --test` can load it;
// lookups that live elsewhere (channel IDs, date ranges, overdue) are passed in.

export interface ContentFilters {
  search: string;
  channelIds: string[]; // Empty means every channel.
  types: string[];
  statuses: string[];
  campaignIds: string[];
  format: string; // "all", "poster", "video", "both", "poster_only", "video_only"
  myWork: boolean;
  overdueOnly: boolean;
}

export const EMPTY_FILTERS: ContentFilters = {
  search: "",
  channelIds: [],
  types: [],
  statuses: [],
  campaignIds: [],
  format: "all",
  myWork: false,
  overdueOnly: false,
};

interface FilterItem {
  id: string;
  title: string;
  copy_text?: string;
  content_type: string;
  status: string;
  campaign_id?: string;
  assignee_email?: string;
  reviewer_email?: string;
  publish_date: string;
  is_poster: boolean;
  is_video: boolean;
}

interface FilterHelpers<T> {
  channelIdOf: (item: T) => string;
  inDateRange: (date: string) => boolean;
  isOverdue: (item: T) => boolean;
  currentEmail: string;
}

function matchesFormat(item: FilterItem, format: string): boolean {
  if (format === "poster") return item.is_poster;
  if (format === "video") return item.is_video;
  if (format === "both") return item.is_poster && item.is_video;
  if (format === "poster_only") return item.is_poster && !item.is_video;
  if (format === "video_only") return item.is_video && !item.is_poster;
  return true;
}

const allows = (chosen: string[], value: string | undefined) => chosen.length === 0 || chosen.includes(value ?? "");

export function filterContent<T extends FilterItem>(items: T[], filters: ContentFilters, helpers: FilterHelpers<T>): T[] {
  const query = filters.search.trim().toLowerCase();
  return items.filter((item) => {
    // Archived posts stay out of the way unless Archived is chosen.
    if (item.status === "Archived" && !filters.statuses.includes("Archived")) return false;
    if (!allows(filters.statuses, item.status)) return false;
    if (!allows(filters.types, item.content_type)) return false;
    if (!allows(filters.campaignIds, item.campaign_id)) return false;
    if (!allows(filters.channelIds, helpers.channelIdOf(item))) return false;
    if (!matchesFormat(item, filters.format)) return false;
    if (filters.myWork && item.assignee_email !== helpers.currentEmail && item.reviewer_email !== helpers.currentEmail) {
      return false;
    }
    if (filters.overdueOnly && !helpers.isOverdue(item)) return false;
    if (!helpers.inDateRange(item.publish_date)) return false;
    if (!query) return true;
    return [item.title, item.id, item.copy_text].some((text) => text?.toLowerCase().includes(query));
  });
}

export function hasActiveFilters(filters: ContentFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    filters.channelIds.length > 0 ||
    filters.types.length > 0 ||
    filters.statuses.length > 0 ||
    filters.campaignIds.length > 0 ||
    filters.format !== "all" ||
    filters.myWork ||
    filters.overdueOnly
  );
}
