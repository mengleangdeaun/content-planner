import { randomUUID } from "node:crypto";
import {
  Campaign,
  ChannelAccount,
  ChannelSnapshot,
  ContentInsight,
  ContentItem,
  ContentStatus,
  ContentTask,
  ContentTypeConfig,
  ContentWithInsight,
  Platform,
} from "./types";
import {
  getSpreadsheetStatus,
  upgradeSpreadsheetStructure,
} from "./google-sheets";
import {
  Fields,
  Row,
  SheetError,
  latestById,
  parseBool,
  parseNumber,
  pickFields,
} from "./sheets/core";
import { SHEET_SCHEMA } from "./sheets/schema";
import { checkStatusChange } from "./workflow";
import { checkChannel, checkContentType, checkSnapshot } from "./settings-rules";
import {
  appendRows,
  isGoogleSheetsConfigured,
  loadAll,
  patchRow,
  updateWhere,
} from "./sheets/table";

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

// Columns the server owns. Clients can never set these directly.
const SERVER_OWNED = ["id", "created_at", "created_by", "updated_at", "archived_at", "group_id"];
const writable = (columns: readonly string[]) =>
  columns.filter((column) => !SERVER_OWNED.includes(column));

const CONTENT_FIELDS = writable(SHEET_SCHEMA.Content_Planner);
const CHANNEL_FIELDS = writable(SHEET_SCHEMA.Social_Channels);
const TYPE_FIELDS = writable(SHEET_SCHEMA.Content_Types);

function toContent(row: Row): ContentItem {
  const formatKnown = row.is_poster !== "" || row.is_video !== "";
  return {
    ...row,
    platform: (row.platform || "Facebook") as Platform,
    content_type: row.content_type || "Educational",
    status: (row.status || "Draft") as ContentStatus,
    is_poster: formatKnown ? parseBool(row.is_poster ?? "") : true,
    is_video: formatKnown ? parseBool(row.is_video ?? "") : false,
  } as unknown as ContentItem;
}

function toInsight(row: Row): ContentInsight {
  return {
    id: row.id,
    views_impressions: parseNumber(row.views_impressions ?? ""),
    engagements: parseNumber(row.engagements ?? ""),
    clicks: parseNumber(row.clicks ?? ""),
  };
}

function toChannel(row: Row): ChannelAccount {
  return {
    ...row,
    platform: (row.platform || "Facebook") as Platform,
    weekly_target_quota: parseNumber(row.weekly_target_quota ?? "") || 3,
    status: row.status === "Paused" || row.status === "Archived" ? row.status : "Active",
  } as unknown as ChannelAccount;
}

function toType(row: Row): ContentTypeConfig {
  return { ...row, target_share_pct: parseNumber(row.target_share_pct ?? "") } as unknown as ContentTypeConfig;
}

const isLive = (row: Row) => Boolean(row.id) && !row.archived_at;

export async function getAllData(forceFresh = false): Promise<{
  data: ContentWithInsight[];
  channels: ChannelAccount[];
  contentTypes: ContentTypeConfig[];
  campaigns: Campaign[];
  tasks: ContentTask[];
  channelSnapshots: ChannelSnapshot[];
}> {
  const tabs = await loadAll(forceFresh);
  const insights = latestById(tabs.Content_Insights.rows.filter((row) => row.id));

  return {
    data: tabs.Content_Planner.rows.filter(isLive).map((row) => {
      const insight = insights.get(row.id);
      return { ...toContent(row), insight: insight ? toInsight(insight) : undefined };
    }),
    channels: tabs.Social_Channels.rows.filter((r) => isLive(r) && r.account_name).map(toChannel),
    contentTypes: tabs.Content_Types.rows
      .filter((r) => isLive(r) && r.name)
      .map(toType),
    campaigns: tabs.Campaigns.rows
      .filter((r) => r.id && r.name && r.status !== "Archived")
      .map((row) => row as unknown as Campaign),
    tasks: tabs.Tasks.rows
      .filter((r) => r.id && r.content_id && r.status !== "archived")
      .map((row) => row as unknown as ContentTask),
    channelSnapshots: tabs.Channel_Snapshots.rows
      .filter((r) => r.id && r.channel_id && r.captured_at)
      .map((row) => ({ ...row, followers: parseNumber(row.followers ?? "") }) as unknown as ChannelSnapshot),
  };
}

// ==========================================
// Content Items
// ==========================================
// One row per channel. Posts created together share a group_id.
export async function addContentItems(
  input: Omit<ContentItem, "id">,
  targets: ChannelAccount[],
  createdBy: string
): Promise<ContentItem[]> {
  const timestamp = now();
  const groupId = targets.length > 1 ? newId("GRP") : "";
  const records: Fields[] = targets.map((channel) => ({
    ...pickFields(input, CONTENT_FIELDS),
    id: newId("POST"),
    channel_id: channel.id,
    platform: channel.platform,
    account_name: channel.account_name,
    group_id: groupId,
    created_at: timestamp,
    created_by: createdBy,
    updated_at: timestamp,
  }));
  await appendRows("Content_Planner", records);
  return records as unknown as ContentItem[];
}

// Workflow rules run against the row at write time: the cached copy may be up to 30 seconds old.
export async function updateContentItem(
  input: Partial<ContentItem> & { id: string; expected_updated_at?: string }
): Promise<{ item: ContentItem; previous: Row }> {
  let previous: Row = {};
  const row = await patchRow(
    "Content_Planner",
    input.id,
    pickFields(input, CONTENT_FIELDS),
    input.expected_updated_at,
    (current) => {
      previous = current;
      if (input.status === undefined && input.live_post_url === undefined) return;
      const from = current.status || "Draft";
      const problem = checkStatusChange(
        from,
        input.status ?? from,
        input.live_post_url ?? current.live_post_url ?? ""
      );
      if (problem) throw new SheetError(problem, 400);
    }
  );
  return { item: toContent(row), previous };
}

// ==========================================
// Metrics: one row per snapshot, newest wins
// ==========================================
export async function saveInsight(
  insight: ContentInsight,
  enteredBy: string
): Promise<ContentInsight> {
  await appendRows("Content_Insights", [
    { ...insight, captured_at: now(), source: "manual", entered_by: enteredBy },
  ]);
  return insight;
}

// ==========================================
// Channel Accounts
// ==========================================
export async function getChannels(): Promise<ChannelAccount[]> {
  return (await getAllData()).channels;
}

function assertValidChannel(input: Partial<ChannelAccount>) {
  const problem = checkChannel(input);
  if (problem) throw new SheetError(problem, 400);
}

export async function addChannel(input: Omit<ChannelAccount, "id">): Promise<ChannelAccount> {
  assertValidChannel(input);
  const record: Fields = { ...pickFields(input, CHANNEL_FIELDS), id: newId("CHAN") };
  await appendRows("Social_Channels", [record]);
  return toChannel(record as Row);
}

export async function updateChannel(input: ChannelAccount): Promise<ChannelAccount> {
  assertValidChannel(input);
  // The form omits optional fields it has cleared, so absent means "clear it".
  const fields = {
    handle: "",
    page_url: "",
    avatar_url: "",
    notes: "",
    owner_email: "",
    brand: "",
    ...pickFields(input, CHANNEL_FIELDS),
  };
  return toChannel(await patchRow("Social_Channels", input.id, fields));
}

export async function addChannelSnapshot(
  input: { channel_id: string; followers?: unknown; captured_at?: string },
  enteredBy: string
): Promise<ChannelSnapshot> {
  const problem = checkSnapshot(input);
  if (problem) throw new SheetError(problem, 400);
  const record = {
    id: newId("SNAP"),
    channel_id: input.channel_id,
    captured_at: input.captured_at || now().slice(0, 10),
    followers: Number(input.followers),
    entered_by: enteredBy,
  };
  await appendRows("Channel_Snapshots", [record]);
  return record;
}

export async function deleteChannel(id: string): Promise<void> {
  await patchRow("Social_Channels", id, { archived_at: now() });
}

// ==========================================
// Content Types
// ==========================================
export async function getContentTypes(): Promise<ContentTypeConfig[]> {
  return (await getAllData()).contentTypes;
}

async function liveTypes(): Promise<Row[]> {
  return (await loadAll()).Content_Types.rows.filter((r) => isLive(r) && r.name);
}

function assertValidType(input: Partial<ContentTypeConfig>, others: Row[]) {
  const problem = checkContentType(input, others as unknown as { name: string }[]);
  if (problem) throw new SheetError(problem, 400);
}

export async function addContentType(
  input: Omit<ContentTypeConfig, "id">
): Promise<ContentTypeConfig> {
  assertValidType(input ?? {}, await liveTypes());
  const record: Fields = { ...pickFields({ ...input, name: input.name.trim() }, TYPE_FIELDS), id: newId("CT") };
  await appendRows("Content_Types", [record]);
  return toType(record as Row);
}

// Posts store the type's name, so a rename updates every post that uses it.
export async function updateContentType(
  input: ContentTypeConfig
): Promise<{ item: ContentTypeConfig; renamedPosts: number }> {
  const types = await liveTypes();
  const current = types.find((t) => t.id === input.id);
  if (!current) throw new SheetError("That content type was not found.", 404);
  assertValidType(input, types.filter((t) => t.id !== input.id));

  const name = input.name.trim();
  // Posts first: if the type update then fails, saving again finishes the rename.
  const renamedPosts =
    name === current.name
      ? 0
      : await updateWhere("Content_Planner", (row) => row.content_type === current.name, { content_type: name });
  const row = await patchRow("Content_Types", input.id, pickFields({ ...input, name }, TYPE_FIELDS));
  return { item: toType(row), renamedPosts };
}

export async function deleteContentType(id: string): Promise<void> {
  await patchRow("Content_Types", id, { archived_at: now() });
}

// ==========================================
// System
// ==========================================
export async function upgradeSheets() {
  return upgradeSpreadsheetStructure();
}

export async function getSheetStatus() {
  return getSpreadsheetStatus();
}

export function getSystemConfig() {
  return {
    configured: isGoogleSheetsConfigured(),
    sheetId: process.env.GOOGLE_SHEET_ID || null,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || null,
  };
}
