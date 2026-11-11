"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Layers,
} from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import {
  upgradeSheetStructure,
  checkSheetStatus,
  SheetStatusResponse,
  UpgradeSheetResponse,
} from "../services/sync-service";

interface UpgradeSheetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeSheetDialog({
  isOpen,
  onOpenChange,
}: UpgradeSheetDialogProps) {
  const workspace = useWorkspace();
  // Parent mounts this only while open, so the status check starts on mount.
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [status, setStatus] = useState<SheetStatusResponse | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<UpgradeSheetResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await checkSheetStatus();
      setStatus(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to inspect sheet");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    checkSheetStatus()
      .then(setStatus)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to inspect sheet")
      )
      .finally(() => setLoadingStatus(false));
  }, []);

  const handleUpgrade = async () => {
    setUpgrading(true);
    setError(null);
    try {
      const res = await upgradeSheetStructure();
      setUpgradeResult(res);
      workspace.showToast("Google Sheet structure is up to date");
      await workspace.refreshData(true);
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upgrade sheet structure. Ensure Service Account has Editor permissions."
      );
    } finally {
      setUpgrading(false);
    }
  };

  const tabs = status?.tabs ?? [];

  const sheetUrl =
    upgradeResult?.spreadsheetUrl ||
    status?.spreadsheetUrl ||
    (status?.spreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${status.spreadsheetId}/edit`
      : null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold truncate">
                Upgrade Google Sheet Structure
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Automatically provision and synchronize the 4-tab modular schema.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pr-1.5 space-y-4 py-1 text-xs">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Upgrade Failed</p>
                <p className="text-[11px] leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {upgradeResult && upgradeResult.success && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Upgrade Complete!</p>
                <p className="text-[11px] leading-relaxed">
                  {upgradeResult.message}
                </p>
                {upgradeResult.createdTabs && upgradeResult.createdTabs.length > 0 && (
                  <p className="text-[11px]">
                    Created tabs:{" "}
                    <strong>{upgradeResult.createdTabs.join(", ")}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          <Card className="p-3.5 space-y-3 bg-muted/30 border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                Connected Spreadsheet
              </span>
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  Open in Google Sheets
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1">
              <div>
                Title:{" "}
                <span className="text-foreground font-medium">
                  {status?.spreadsheetTitle || "Loading..."}
                </span>
              </div>
              <div className="truncate">
                Sheet ID:{" "}
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded">
                  {status?.spreadsheetId || "Configured via .env"}
                </code>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-medium text-foreground">
                Operational Tab Verification:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => (
                  <div
                    key={tab.name}
                    className="flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5"
                  >
                    <span className="font-mono text-[11px] truncate">
                      {tab.name}
                    </span>
                    {tab.exists ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-0 h-4 px-1.5 text-[9px] gap-1"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Ready
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 h-4 px-1.5 text-[9px]"
                      >
                        Missing
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Clicking <strong>&quot;Upgrade Sheet Structure&quot;</strong> will automatically create missing tabs (
            <code>Social_Channels</code>, <code>Content_Types</code>), update header rows with modern fields (including{" "}
            <code>created_at</code> in Column B), and freeze row 1 without overwriting your existing content items.
          </p>
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t flex items-center justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStatus}
            disabled={loadingStatus || upgrading}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loadingStatus ? "animate-spin" : ""}`}
            />
            Check Status
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {upgrading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade Sheet Structure
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
