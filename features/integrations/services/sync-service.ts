import { ContentFetchResponse } from "@/features/content/services/content-service";

export interface UpgradeSheetResponse {
  success: boolean;
  message: string;
  spreadsheetId?: string;
  spreadsheetTitle?: string;
  spreadsheetUrl?: string;
  createdTabs?: string[];
  verifiedTabs?: string[];
  allTabs?: string[];
  error?: string;
}

export interface SheetStatusResponse {
  success: boolean;
  configured: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  spreadsheetUrl: string | null;
  tabs: {
    name: string;
    exists: boolean;
    rowCount?: number;
  }[];
  isFullyUpgraded: boolean;
  error?: string;
}

export async function triggerWorkspaceSync(): Promise<ContentFetchResponse> {
  const res = await fetch("/api/sync", { method: "POST" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Sync failed. Check cloud credentials.");
  }
  return json;
}

export async function upgradeSheetStructure(): Promise<UpgradeSheetResponse> {
  const res = await fetch("/api/system/upgrade-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to upgrade Google Sheet structure.");
  }
  return json;
}

export async function checkSheetStatus(): Promise<SheetStatusResponse> {
  const res = await fetch("/api/system/upgrade-sheets");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to retrieve sheet status.");
  }
  return json;
}
