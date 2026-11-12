"use client";

import React, { useState } from "react";
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
import { Copy, Check, FileSpreadsheet, Sparkles } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { UpgradeSheetButton } from "./upgrade-sheet-button";

interface GcpSetupGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function GcpSetupGuideModal(props: GcpSetupGuideModalProps) {
  const workspace = useWorkspace();
  const isOpen = props.isOpen ?? workspace.isGuideModalOpen;
  const onClose = props.onClose ?? (() => workspace.setIsGuideModalOpen(false));

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const plannerHeaders =
    "id,created_at,platform,account_name,content_type,title,copy_text,workspace_file_url,publish_date,status,is_poster,is_video";
  const insightHeaders = "id,views_impressions,engagements,clicks";
  const channelHeaders = "id,platform,account_name,handle,page_url,avatar_url,weekly_target_quota,status,notes";
  const taxonomyHeaders = "id,name,description";

  const envSample = `# Google Sheets Connection
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=content-planner-backend@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"

# Sign-in (Google OAuth Web application client)
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
AUTH_SECRET=a_random_string_of_at_least_32_characters

# Always Owner. Everyone else is added on the Team page.
ADMIN_EMAILS=admin@gmail.com`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="shrink-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground truncate">
                Google Sheets & Cloud Configuration Guide
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Connect your live Google Spreadsheet container in 4 standard steps.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Container (Guaranteed no horizontal overflow) */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden space-y-4 pt-1 text-sm">
          {/* One-Click Automation Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 space-y-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-xs text-foreground">
                  One-Click Auto-Provisioning & Upgrade
                </span>
              </div>
              <UpgradeSheetButton />
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              If your Service Account is already added as an Editor to your Google Sheet, you can skip manual tab creation.
              Click <strong>Upgrade Sheet Structure</strong> above to automatically create every required tab and column.
            </p>
          </div>

          {/* Step 1: Tabs */}
          <Card className="p-4 space-y-3 border bg-card min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <Badge variant="outline" className="h-5 w-5 p-0 justify-center">
                1
              </Badge>
              <span>Setup Google Spreadsheet Tabs</span>
            </div>
            <p className="text-muted-foreground text-xs leading-normal">
              To set up by hand, create these four tabs, then run Upgrade Sheet Structure to add the remaining tabs and columns:
            </p>

            <div className="space-y-3 pt-1">
              {/* Tab 1 */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-muted-foreground">Tab 1:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold">
                      Content_Planner
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(plannerHeaders, "tab1")}
                    className="h-7 px-2 text-xs gap-1 shrink-0"
                  >
                    {copiedSection === "tab1" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy CSV Headers</span>
                  </Button>
                </div>
                <div className="rounded-md border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all select-all leading-relaxed min-w-0">
                  {plannerHeaders}
                </div>
              </div>

              {/* Tab 2 */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-muted-foreground">Tab 2:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold">
                      Content_Insights
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(insightHeaders, "tab2")}
                    className="h-7 px-2 text-xs gap-1 shrink-0"
                  >
                    {copiedSection === "tab2" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy CSV Headers</span>
                  </Button>
                </div>
                <div className="rounded-md border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all select-all leading-relaxed min-w-0">
                  {insightHeaders}
                </div>
              </div>

              {/* Tab 3 */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-muted-foreground">Tab 3:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold">
                      Social_Channels
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(channelHeaders, "tab3")}
                    className="h-7 px-2 text-xs gap-1 shrink-0"
                  >
                    {copiedSection === "tab3" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy CSV Headers</span>
                  </Button>
                </div>
                <div className="rounded-md border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all select-all leading-relaxed min-w-0">
                  {channelHeaders}
                </div>
              </div>

              {/* Tab 4 */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-muted-foreground">Tab 4:</span>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold">
                      Content_Types
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(taxonomyHeaders, "tab4")}
                    className="h-7 px-2 text-xs gap-1 shrink-0"
                  >
                    {copiedSection === "tab4" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copy CSV Headers</span>
                  </Button>
                </div>
                <div className="rounded-md border bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all select-all leading-relaxed min-w-0">
                  {taxonomyHeaders}
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2: GCP Console */}
          <Card className="p-4 space-y-2 border bg-card min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <Badge variant="outline" className="h-5 w-5 p-0 justify-center">
                2
              </Badge>
              <span>Create Google Cloud Service Account</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-xs leading-relaxed">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-foreground font-medium"
                >
                  Google Cloud Console
                </a>
                .
              </li>
              <li>
                Create a project &rarr; Enable the <strong>Google Sheets API</strong>.
              </li>
              <li>
                Under <strong>IAM & Admin &rarr; Service Accounts</strong>, create an account
                (e.g. <code>content-planner-backend</code>).
              </li>
              <li>
                Open the account &rarr; <strong>Keys</strong> tab &rarr; <strong>Add Key (JSON)</strong> to download credentials.
              </li>
            </ol>
          </Card>

          {/* Step 3: Sharing */}
          <Card className="p-4 space-y-2 border bg-card min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
              <Badge variant="outline" className="h-5 w-5 p-0 justify-center">
                3
              </Badge>
              <span>Share Sheet with the Service Account</span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Open your Google Sheet, click the top-right green <strong>Share</strong> button,
              and invite your Service Account email as an <strong>Editor</strong>.
            </p>
          </Card>

          {/* Step 4: Environment Variables */}
          <Card className="p-4 space-y-2.5 border bg-card min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-foreground min-w-0">
                <Badge variant="outline" className="h-5 w-5 p-0 justify-center">
                  4
                </Badge>
                <span className="truncate">Add Credentials to .env</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(envSample, "env")}
                className="h-7 px-2.5 text-xs gap-1 shrink-0"
              >
                {copiedSection === "env" ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>Copy .env Sample</span>
              </Button>
            </div>
            <pre className="rounded-md border bg-muted/40 p-2.5 font-mono text-[11px] text-foreground whitespace-pre-wrap break-all min-w-0 leading-normal select-all">
              {envSample}
            </pre>
          </Card>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="shrink-0 pt-3 border-t">
          <Button size="default" onClick={onClose} className="w-full sm:w-auto">
            Close Guide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
