import { ActivityEntry, Campaign, ContentTask } from "@/lib/types";

async function request<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export async function saveCampaign(
  campaign: Partial<Campaign>
): Promise<{ campaign: Campaign; unlinked: number }> {
  return request<{ campaign: Campaign; unlinked: number }>("/api/campaigns", campaign.id ? "PUT" : "POST", campaign);
}

export async function linkCampaignPosts(
  campaignId: string,
  add: string[],
  remove: string[]
): Promise<{ added: number; removed: number; movedFrom: string[] }> {
  return request("/api/campaigns/posts", "POST", { campaign_id: campaignId, add, remove });
}

export type NewTaskInput = Pick<ContentTask, "content_id" | "title"> &
  Partial<Pick<ContentTask, "assignee_email" | "due_date">>;

export async function addTask(fields: NewTaskInput): Promise<ContentTask> {
  const { task } = await request<{ task: ContentTask }>("/api/tasks", "POST", fields);
  return task;
}

export async function updateTask(id: string, fields: Partial<ContentTask>): Promise<ContentTask> {
  const { task } = await request<{ task: ContentTask }>("/api/tasks", "PUT", { id, ...fields });
  return task;
}

export async function fetchActivity(contentId: string): Promise<ActivityEntry[]> {
  const { activity } = await request<{ activity: ActivityEntry[] }>(
    `/api/activity?content_id=${encodeURIComponent(contentId)}`
  );
  return activity;
}

export async function addComment(contentId: string, body: string): Promise<void> {
  await request("/api/activity", "POST", { content_id: contentId, body });
}
