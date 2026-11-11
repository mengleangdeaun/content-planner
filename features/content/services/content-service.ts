import {
  ContentItem,
  ContentWithInsight,
  ChannelAccount,
  ContentTypeConfig,
  ContentStatus,
  Campaign,
  ContentTask,
  ChannelSnapshot,
  Person,
} from "@/lib/types";

export interface ContentFetchResponse {
  data: ContentWithInsight[];
  channels: ChannelAccount[];
  contentTypes: ContentTypeConfig[];
  campaigns: Campaign[];
  tasks: ContentTask[];
  channelSnapshots: ChannelSnapshot[];
  people: Person[];
}

export type NewContentInput = Omit<ContentItem, "id" | "platform" | "account_name"> & {
  channel_ids: string[];
};

export type ContentUpdateInput = Partial<ContentItem> &
  Pick<ContentItem, "id"> & { expected_updated_at?: string };

export async function fetchContentData(fresh = false): Promise<ContentFetchResponse> {
  const res = await fetch(`/api/content${fresh ? "?fresh=true" : ""}`);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Failed to fetch content (${res.status})`);
  }
  return res.json();
}

export async function createContentItems(
  newItem: NewContentInput
): Promise<ContentItem[]> {
  const res = await fetch("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newItem),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to create content piece");
  }
  return json.items;
}

export async function updateContentItem(
  item: ContentUpdateInput
): Promise<ContentItem> {
  const res = await fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to update content piece");
  }
  return json.item;
}

export async function updateItemStatus(
  item: ContentWithInsight,
  newStatus: ContentStatus
): Promise<ContentItem> {
  // Send only the status, so this cannot overwrite someone else's edit to other fields.
  return updateContentItem({ id: item.id, status: newStatus });
}

