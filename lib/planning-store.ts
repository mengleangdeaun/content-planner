import { randomUUID } from "node:crypto";
import { ActivityEntry, Campaign, ContentTask } from "./types";
import { Fields, Row, SheetError } from "./sheets/core";
import { appendRows, loadAll, patchRow, updateWhere } from "./sheets/table";
import { isValidDate } from "./workflow";

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

const MAX_TITLE_LENGTH = 300;
const MAX_COMMENT_LENGTH = 5000; // A sheet cell holds 50,000 characters at most.
const CAMPAIGN_STATUSES = ["Planned", "Active", "Completed", "Archived"];
const TASK_STATUSES = ["open", "in_progress", "done", "archived"];

// ==========================================
// Campaigns
// ==========================================
function checkCampaign(input: Partial<Campaign>) {
  for (const date of [input.start_date, input.end_date]) {
    if (date && !isValidDate(date)) throw new SheetError("Dates must be in YYYY-MM-DD format.", 400);
  }
  if (input.start_date && input.end_date && input.start_date > input.end_date) {
    throw new SheetError("The end date must be on or after the start date.", 400);
  }
  if (input.status && !CAMPAIGN_STATUSES.includes(input.status)) {
    throw new SheetError("That campaign status is not valid.", 400);
  }
}

export async function saveCampaign(input: Partial<Campaign>, actorEmail: string): Promise<Campaign> {
  const name = input.name?.trim();
  if (!name) throw new SheetError("Campaign name is required.", 400);
  checkCampaign(input);

  const fields: Fields = {
    name: name.slice(0, MAX_TITLE_LENGTH),
    goal: input.goal?.trim() ?? "",
    start_date: input.start_date ?? "",
    end_date: input.end_date ?? "",
    status: input.status ?? "Planned",
    owner_email: input.owner_email ?? actorEmail,
  };
  if (input.id) return (await patchRow("Campaigns", input.id, fields)) as unknown as Campaign;

  const record = { ...fields, id: newId("CMP"), created_at: now() };
  await appendRows("Campaigns", [record]);
  return record as unknown as Campaign;
}

export async function getCampaignRow(id: string): Promise<Row | undefined> {
  return (await loadAll()).Campaigns.rows.find((row) => row.id === id);
}

/**
 * Adds and removes posts in one go: one write sets the campaign on the added posts, one clears it
 * on the removed ones, and one records each change in Activity. A post is in at most one campaign,
 * so adding a post moves it from wherever it was.
 */
export async function linkCampaignPosts(
  campaignId: string,
  add: string[],
  remove: string[],
  actorEmail: string
): Promise<{ added: number; removed: number; movedFrom: string[] }> {
  const previous = new Map((await loadAll()).Content_Planner.rows.map((row) => [row.id, row.campaign_id ?? ""]));
  const toAdd = new Set(add.filter((id) => previous.get(id) !== campaignId));
  const toRemove = new Set(remove.filter((id) => !toAdd.has(id) && previous.get(id) === campaignId));

  const added = toAdd.size
    ? await updateWhere("Content_Planner", (row) => toAdd.has(row.id), { campaign_id: campaignId })
    : 0;
  // Only where the post still points here: someone may have moved it since the page loaded.
  const removed = toRemove.size
    ? await updateWhere("Content_Planner", (row) => toRemove.has(row.id) && row.campaign_id === campaignId, { campaign_id: "" })
    : 0;

  const events: ActivityEvent[] = [
    ...[...toAdd].map((id) => ({ kind: "field" as const, entity_id: id, body: "campaign_id", from_value: previous.get(id) ?? "", to_value: campaignId })),
    ...[...toRemove].map((id) => ({ kind: "field" as const, entity_id: id, body: "campaign_id", from_value: campaignId, to_value: "" })),
  ];
  // The links are saved, so a failed history entry must not report them as failed.
  await logActivity(actorEmail, events).catch((error) => console.error("Could not record activity:", error));

  const movedFrom = [...toAdd].map((id) => previous.get(id) ?? "").filter(Boolean);
  return { added, removed, movedFrom };
}

/** Archiving a campaign takes its posts out of it; the posts themselves stay. */
export async function unlinkAllPosts(campaignId: string, actorEmail: string): Promise<number> {
  const linked = (await loadAll()).Content_Planner.rows.filter((row) => row.campaign_id === campaignId).map((row) => row.id);
  if (linked.length === 0) return 0;
  return (await linkCampaignPosts(campaignId, [], linked, actorEmail)).removed;
}

// ==========================================
// Tasks
// ==========================================
export async function getTask(id: string): Promise<Row | undefined> {
  return (await loadAll()).Tasks.rows.find((row) => row.id === id);
}

export async function addTask(
  input: { content_id: string; title?: string; assignee_email?: string; due_date?: string },
  actorEmail: string
): Promise<ContentTask> {
  const title = input.title?.trim();
  if (!title) throw new SheetError("Task title is required.", 400);
  if (input.due_date && !isValidDate(input.due_date)) {
    throw new SheetError("Dates must be in YYYY-MM-DD format.", 400);
  }
  const timestamp = now();
  const record = {
    id: newId("TASK"),
    content_id: input.content_id,
    title: title.slice(0, MAX_TITLE_LENGTH),
    assignee_email: input.assignee_email ?? "",
    due_date: input.due_date ?? "",
    status: "open",
    created_by: actorEmail,
    created_at: timestamp,
    updated_at: timestamp,
  };
  await appendRows("Tasks", [record]);
  return record as unknown as ContentTask;
}

export async function updateTask(
  id: string,
  input: { title?: string; status?: string; assignee_email?: string; due_date?: string }
): Promise<ContentTask> {
  if (input.status !== undefined && !TASK_STATUSES.includes(input.status)) {
    throw new SheetError("That task status is not valid.", 400);
  }
  if (input.title !== undefined && !input.title.trim()) {
    throw new SheetError("Task title is required.", 400);
  }
  if (input.due_date && !isValidDate(input.due_date)) {
    throw new SheetError("Dates must be in YYYY-MM-DD format.", 400);
  }
  const row = await patchRow("Tasks", id, {
    title: input.title?.trim().slice(0, MAX_TITLE_LENGTH),
    status: input.status,
    assignee_email: input.assignee_email,
    due_date: input.due_date,
  });
  return row as unknown as ContentTask;
}

// ==========================================
// Activity: comments and audit events in one timeline
// ==========================================
export async function getActivity(contentId: string): Promise<ActivityEntry[]> {
  return (await loadAll()).Activity.rows
    .filter((row) => row.id && row.entity === "content" && row.entity_id === contentId)
    .map((row) => row as unknown as ActivityEntry)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export type ActivityEvent = Pick<ActivityEntry, "kind" | "entity_id"> &
  Partial<Pick<ActivityEntry, "from_value" | "to_value" | "body">>;

export async function logActivity(actorEmail: string, events: ActivityEvent[]): Promise<void> {
  if (events.length === 0) return;
  const at = now();
  await appendRows(
    "Activity",
    events.map((event) => ({
      id: newId("ACT"),
      at,
      actor_email: actorEmail,
      entity: "content",
      from_value: "",
      to_value: "",
      body: "",
      ...event,
    }))
  );
}

export async function addComment(
  contentId: string,
  body: string | undefined,
  actorEmail: string
): Promise<void> {
  const text = body?.trim();
  if (!text) throw new SheetError("Write a comment first.", 400);
  if (text.length > MAX_COMMENT_LENGTH) {
    throw new SheetError(`Comments can be up to ${MAX_COMMENT_LENGTH} characters.`, 400);
  }
  await logActivity(actorEmail, [{ kind: "comment", entity_id: contentId, body: text }]);
}
