import { randomUUID } from "node:crypto";
import {
  ChannelAccount,
  ContentInsight,
  ContentItem,
  ContentStatus,
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
import {
  appendRows,
  isGoogleSheetsConfigured,
  loadAll,
  patchRow,
} from "./sheets/table";

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

// Columns the server owns. Clients can never set these directly.
const SERVER_OWNED = ["id", "created_at", "created_by", "updated_at", "archived_at"];
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

const isLive = (row: Row) => Boolean(row.id) && !row.archived_at;

export async function getAllData(forceFresh = false): Promise<{
  data: ContentWithInsight[];
  channels: ChannelAccount[];
  contentTypes: ContentTypeConfig[];
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
      .map((row) => row as unknown as ContentTypeConfig),
  };
}

// ==========================================
// Content Items
// ==========================================
export async function addContentItem(
  input: Omit<ContentItem, "id">,
  createdBy: string
): Promise<ContentItem> {
  const timestamp = now();
  const record: Fields = {
    ...pickFields(input, CONTENT_FIELDS),
    id: newId("POST"),
    created_at: timestamp,
    created_by: createdBy,
    updated_at: timestamp,
  };
  await appendRows("Content_Planner", [record]);
  return record as unknown as ContentItem;
}

export async function updateContentItem(
  input: Partial<ContentItem> & { id: string; expected_updated_at?: string }
): Promise<ContentItem> {
  const row = await patchRow(
    "Content_Planner",
    input.id,
    pickFields(input, CONTENT_FIELDS),
    input.expected_updated_at
  );
  return toContent(row);
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

export async function addChannel(input: Omit<ChannelAccount, "id">): Promise<ChannelAccount> {
  const record: Fields = { ...pickFields(input, CHANNEL_FIELDS), id: newId("CHAN") };
  await appendRows("Social_Channels", [record]);
  return record as unknown as ChannelAccount;
}

export async function updateChannel(input: ChannelAccount): Promise<ChannelAccount> {
  // The form omits optional fields it has cleared, so absent means "clear it".
  const fields = {
    handle: "",
    page_url: "",
    avatar_url: "",
    notes: "",
    ...pickFields(input, CHANNEL_FIELDS),
  };
  return toChannel(await patchRow("Social_Channels", input.id, fields));
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

export async function addContentType(
  input: Omit<ContentTypeConfig, "id">
): Promise<ContentTypeConfig> {
  if (!input?.name?.trim()) throw new SheetError("Content type name is required", 400);
  const record: Fields = { ...pickFields(input, TYPE_FIELDS), id: newId("CT") };
  await appendRows("Content_Types", [record]);
  return record as unknown as ContentTypeConfig;
}

export async function updateContentType(input: ContentTypeConfig): Promise<ContentTypeConfig> {
  const row = await patchRow("Content_Types", input.id, pickFields(input, TYPE_FIELDS));
  return row as unknown as ContentTypeConfig;
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
