import { randomUUID } from "node:crypto";
import { ActivityEntry, Campaign, ContentTask } from "./types";
import { Fields, Row, SheetError } from "./sheets/core";
import { appendRows, loadAll, patchRow } from "./sheets/table";
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
