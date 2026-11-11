import { withRetry, columnLetter, normalizeHeaders } from "./sheets/core";
import { DEFAULT_CONTENT_TYPES, SHEET_SCHEMA, TAB_NAMES, TabName } from "./sheets/schema";
import {
  getSheetsClient,
  getSpreadsheetId,
  invalidateCache,
  isGoogleSheetsConfigured,
  matchTitle,
  quoteTitle,
  runExclusive,
} from "./sheets/table";

export interface UpgradeResult {
  success: boolean;
  message: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  createdTabs: string[];
  verifiedTabs: string[];
  allTabs: string[];
}

export interface SheetStatus {
  configured: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  spreadsheetUrl: string | null;
  tabs: {
    name: string;
    actualTitle: string | null;
    exists: boolean;
    rowCount: number;
    missingColumns: string[];
  }[];
  isFullyUpgraded: boolean;
}

const PROTECTED_TABS: TabName[] = ["Team_Members", "Roles"];

const sheetUrl = (id: string) => `https://docs.google.com/spreadsheets/d/${id}/edit`;

async function readMeta() {
  const res = await withRetry(() =>
    getSheetsClient().spreadsheets.get({
      spreadsheetId: getSpreadsheetId(),
      fields: "properties.title,sheets.properties,sheets.protectedRanges",
    })
  );
  return {
    spreadsheetTitle: res.data.properties?.title || "Google Sheet",
    sheets: res.data.sheets ?? [],
    titles: (res.data.sheets ?? []).map((s) => s.properties?.title ?? ""),
  };
}

export async function getSpreadsheetStatus(): Promise<SheetStatus> {
  if (!isGoogleSheetsConfigured()) {
    return {
      configured: false,
      spreadsheetId: null,
      spreadsheetTitle: null,
      spreadsheetUrl: null,
      tabs: TAB_NAMES.map((name) => ({
        name,
        actualTitle: null,
        exists: false,
        rowCount: 0,
        missingColumns: [...SHEET_SCHEMA[name]],
      })),
      isFullyUpgraded: false,
    };
  }

  const spreadsheetId = getSpreadsheetId();
  const { spreadsheetTitle, titles } = await readMeta();
  const matched = TAB_NAMES.map((name) => ({ name, actual: matchTitle(titles, name) }));
  const present = matched.filter((t) => t.actual);

  const res = present.length
    ? await withRetry(() =>
        getSheetsClient().spreadsheets.values.batchGet({
          spreadsheetId,
          ranges: present.map((t) => quoteTitle(t.actual!)),
        })
      )
    : null;
  const valuesByTab = new Map<TabName, unknown[][]>(
    present.map((t, i) => [t.name, res?.data.valueRanges?.[i]?.values ?? []])
  );

  const tabs = matched.map(({ name, actual }) => {
    const values = valuesByTab.get(name) ?? [];
    const headers = normalizeHeaders(values[0]);
    return {
      name,
      actualTitle: actual ?? null,
      exists: Boolean(actual),
      rowCount: Math.max(values.length - 1, 0),
      missingColumns: SHEET_SCHEMA[name].filter((column) => !headers.includes(column)),
    };
  });

  return {
    configured: true,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl: sheetUrl(spreadsheetId),
    tabs,
    isFullyUpgraded: tabs.every((t) => t.exists && t.missingColumns.length === 0),
  };
}

/**
 * Creates missing tabs and appends missing columns. Never rewrites existing
 * headers or data rows, so it is safe to run repeatedly.
 */
export function upgradeSpreadsheetStructure(): Promise<UpgradeResult> {
  return runExclusive(async () => {
    const spreadsheetId = getSpreadsheetId();
    const client = getSheetsClient();
    const { spreadsheetTitle, sheets, titles } = await readMeta();

    const newTabs = TAB_NAMES.filter((name) => !matchTitle(titles, name));
    const existingTabs = TAB_NAMES.filter((name) => matchTitle(titles, name));

    if (newTabs.length > 0) {
      await withRetry(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: newTabs.map((title) => ({
              addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } },
            })),
          },
        })
      );
    }

    const headerRes = existingTabs.length
      ? await withRetry(() =>
          client.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges: existingTabs.map((name) => `${quoteTitle(matchTitle(titles, name)!)}!1:1`),
          })
        )
      : null;

    const data: { range: string; values: string[][] }[] = [];
    const structuralRequests: object[] = [];

    existingTabs.forEach((name, i) => {
      const title = matchTitle(titles, name)!;
      const headers = normalizeHeaders(headerRes?.data.valueRanges?.[i]?.values?.[0]);
      const missing = SHEET_SCHEMA[name].filter((column) => !headers.includes(column));
      const properties = sheets.find((s) => s.properties?.title === title)?.properties;

      if (properties?.gridProperties?.frozenRowCount !== 1) {
        structuralRequests.push({
          updateSheetProperties: {
            properties: { sheetId: properties?.sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        });
      }
      if (missing.length === 0) return;

      const shortBy = headers.length + missing.length - (properties?.gridProperties?.columnCount ?? 0);
      if (shortBy > 0) {
        structuralRequests.push({
          appendDimension: { sheetId: properties?.sheetId, dimension: "COLUMNS", length: shortBy },
        });
      }
      data.push({
        range: `${quoteTitle(title)}!${columnLetter(headers.length)}1`,
        values: [[...missing]],
      });
    });

    for (const name of newTabs) {
      const seed = name === "Content_Types" ? DEFAULT_CONTENT_TYPES : [];
      data.push({ range: `${quoteTitle(name)}!A1`, values: [[...SHEET_SCHEMA[name]], ...seed] });
    }

    if (structuralRequests.length > 0) {
      await withRetry(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: structuralRequests },
        })
      );
    }
    if (data.length > 0) {
      await withRetry(() =>
        client.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: { valueInputOption: "RAW", data },
        })
      );
    }

    // Stops other editors of the file granting themselves roles. The sheet's owner can still edit.
    const finalMeta = await readMeta();
    const protectRequests = finalMeta.sheets
      .filter(
        (s) =>
          PROTECTED_TABS.some((tab) => tab === s.properties?.title) &&
          (s.protectedRanges ?? []).length === 0
      )
      .map((s) => ({
        addProtectedRange: {
          protectedRange: {
            range: { sheetId: s.properties?.sheetId },
            description: "Managed by Content Planner. Change access from the app.",
            editors: { users: [process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL!.trim()] },
          },
        },
      }));
    if (protectRequests.length > 0) {
      await withRetry(() =>
        client.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: protectRequests },
        })
      );
    }

    invalidateCache();

    return {
      success: true,
      message:
        newTabs.length > 0
          ? `Created ${newTabs.join(", ")} and updated columns.`
          : "All tabs present. Missing columns were added.",
      spreadsheetId,
      spreadsheetTitle,
      spreadsheetUrl: sheetUrl(spreadsheetId),
      createdTabs: newTabs,
      verifiedTabs: existingTabs,
      allTabs: TAB_NAMES,
    };
  });
}
