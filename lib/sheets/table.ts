import { google } from "googleapis";
import { TAB_NAMES, TabName } from "./schema";
import {
  Fields,
  Queue,
  Row,
  SheetError,
  cellToString,
  columnLetter,
  createQueue,
  missingColumns,
  normalizeHeaders,
  recordToCells,
  rowToRecord,
  withRetry,
} from "./core";

const CACHE_TTL_MS = 30 * 1000; // The service account is one user: 60 reads/min for the whole app.

export interface TabData {
  headers: string[];
  rows: Row[];
}

type Tabs = Record<TabName, TabData>;

interface SheetsState {
  cache: { tabs: Tabs; fetchedAt: number } | null;
  titles: Partial<Record<TabName, string>> | null;
  enqueue: Queue;
}

// On globalThis because Next can load this module separately per route; the queue must be shared.
const globals = globalThis as typeof globalThis & { __sheetsState?: SheetsState };
const state = (globals.__sheetsState ??= { cache: null, titles: null, enqueue: createQueue() });

export const runExclusive = state.enqueue;

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID
  );
}

export function getSpreadsheetId(): string {
  if (!isGoogleSheetsConfigured()) {
    throw new SheetError("Google Sheets is not configured. Check your .env file.", 503);
  }
  return process.env.GOOGLE_SHEET_ID!.trim();
}

export function getSheetsClient() {
  getSpreadsheetId();
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL!.trim(),
    // Keys pasted into .env often carry literal \n.
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.trim().replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export function quoteTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

export function matchTitle(existing: string[], target: string): string | undefined {
  return existing.find((t) => t.trim().toLowerCase() === target.toLowerCase());
}

export function invalidateCache() {
  state.cache = null;
  state.titles = null;
}

async function resolveTitles() {
  if (state.titles) return state.titles;
  const meta = await withRetry(() =>
    getSheetsClient().spreadsheets.get({
      spreadsheetId: getSpreadsheetId(),
      fields: "sheets.properties.title",
    })
  );
  const existing = (meta.data.sheets ?? []).map((s) => s.properties?.title ?? "");
  const titles: Partial<Record<TabName, string>> = {};
  for (const tab of TAB_NAMES) titles[tab] = matchTitle(existing, tab);
  state.titles = titles;
  return titles;
}

async function requireTitle(tab: TabName): Promise<string> {
  const cached = (await resolveTitles())[tab];
  if (cached) return cached;

  state.titles = null; // The tab may have been created since titles were cached.
  const title = (await resolveTitles())[tab];
  if (!title) {
    throw new SheetError(`The ${tab} tab is missing. Run "Upgrade Sheet Structure".`, 409);
  }
  return title;
}

function toTabData(values: unknown[][]): TabData {
  const headers = normalizeHeaders(values[0]);
  return { headers, rows: values.slice(1).map((row) => rowToRecord(headers, row)) };
}

function assertColumns(tab: TabName, headers: string[], fields: Fields) {
  const missing = missingColumns(headers, fields);
  if (missing.length > 0) {
    throw new SheetError(
      `The ${tab} tab is missing columns: ${missing.join(", ")}. Run "Upgrade Sheet Structure".`,
      409
    );
  }
}

async function fetchTabs(): Promise<Tabs> {
  const titles = await resolveTitles();
  const present = TAB_NAMES.filter((tab) => titles[tab]);
  const tabs = Object.fromEntries(
    TAB_NAMES.map((tab) => [tab, { headers: [], rows: [] }])
  ) as unknown as Tabs;
  if (present.length === 0) return tabs;

  try {
    const res = await withRetry(() =>
      getSheetsClient().spreadsheets.values.batchGet({
        spreadsheetId: getSpreadsheetId(),
        ranges: present.map((tab) => quoteTitle(titles[tab]!)),
      })
    );
    (res.data.valueRanges ?? []).forEach((range, i) => {
      tabs[present[i]] = toTabData(range.values ?? []);
    });
    return tabs;
  } catch (error) {
    state.titles = null; // A renamed tab fails the read; look titles up again next time.
    throw error;
  }
}

// Reads go through the queue too, so a refresh cannot overwrite a newer write in the cache.
export function loadAll(forceFresh = false): Promise<Tabs> {
  return state.enqueue(async () => {
    if (!forceFresh && state.cache && Date.now() - state.cache.fetchedAt < CACHE_TTL_MS) {
      return state.cache.tabs;
    }
    if (forceFresh) state.titles = null;
    const tabs = await fetchTabs();
    state.cache = { tabs, fetchedAt: Date.now() };
    return tabs;
  });
}

export function appendRows(tab: TabName, records: Fields[]): Promise<void> {
  return state.enqueue(async () => {
    const title = await requireTitle(tab);
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    const headerRes = await withRetry(() =>
      sheets.spreadsheets.values.get({ spreadsheetId, range: `${quoteTitle(title)}!1:1` })
    );
    const headers = normalizeHeaders(headerRes.data.values?.[0]);
    records.forEach((record) => assertColumns(tab, headers, record));
    const values = records.map((record) => recordToCells(headers, record));

    await withRetry(() =>
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${quoteTitle(title)}!A1`,
        valueInputOption: "RAW", // Never USER_ENTERED: user text starting with = would run as a formula.
        insertDataOption: "INSERT_ROWS",
        requestBody: { values },
      })
    );

    state.cache?.tabs[tab].rows.push(...values.map((row) => rowToRecord(headers, row)));
  });
}

/**
 * Writes only the cells that changed. When expectedUpdatedAt is given and the row
 * has moved on, throws a 409 instead of overwriting someone else's edit.
 */
export function patchRow(
  tab: TabName,
  id: string,
  fields: Fields,
  expectedUpdatedAt?: string
): Promise<Row> {
  return state.enqueue(async () => {
    const title = await requireTitle(tab);
    const sheets = getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // Read at write time: people can sort or edit the sheet between our cached reads.
    const res = await withRetry(() =>
      sheets.spreadsheets.values.get({ spreadsheetId, range: quoteTitle(title) })
    );
    const values = res.data.values ?? [];
    const headers = normalizeHeaders(values[0]);
    const idColumn = headers.indexOf("id");
    const rowIndex = values.findIndex((row, i) => i > 0 && cellToString(row[idColumn]) === id);
    if (idColumn < 0 || rowIndex < 0) {
      throw new SheetError(`${id} was not found in ${tab}.`, 404);
    }

    const current = rowToRecord(headers, values[rowIndex]);
    const tracksUpdates = headers.includes("updated_at");
    if (tracksUpdates && expectedUpdatedAt !== undefined && current.updated_at !== expectedUpdatedAt) {
      throw new SheetError("Someone else changed this item. Refresh and try again.", 409);
    }

    assertColumns(tab, headers, fields);
    const changed = Object.entries(fields).filter(
      ([key, value]) => value !== undefined && cellToString(value) !== current[key]
    );
    if (changed.length === 0) return current;
    if (tracksUpdates) changed.push(["updated_at", new Date().toISOString()]);

    await withRetry(() =>
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data: changed.map(([key, value]) => ({
            range: `${quoteTitle(title)}!${columnLetter(headers.indexOf(key))}${rowIndex + 1}`,
            values: [[value]],
          })),
        },
      })
    );

    const updated: Row = { ...current };
    for (const [key, value] of changed) updated[key] = cellToString(value);

    if (state.cache) {
      const tabData = toTabData(values);
      tabData.rows[rowIndex - 1] = updated;
      state.cache.tabs[tab] = tabData;
    }
    return updated;
  });
}
