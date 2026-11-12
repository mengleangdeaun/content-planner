"use client";

import React, { useState } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
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

  const tabs = [
    { name: "Content_Planner", headers: plannerHeaders, desc: "Primary posts backlog & pipeline" },
    { name: "Content_Insights", headers: insightHeaders, desc: "Performance & reach metrics" },
    { name: "Social_Channels", headers: channelHeaders, desc: "Connected social media accounts" },
    { name: "Content_Types", headers: taxonomyHeaders, desc: "Content types & categorization" },
  ];

  return (
    <ResponsiveModal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="size-4" />
          </div>
          <span>Google Sheets & Cloud Configuration Guide</span>
        </div>
      }
      description="Connect and sync your live Google Spreadsheet in 4 standard steps."
      footer={
        <div className="flex w-full items-center justify-end">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Close Guide
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* One-Click Automation Banner */}
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-xs text-foreground">
                One-Click Auto-Provisioning & Upgrade
              </span>
            </div>
            <UpgradeSheetButton />
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            If your Service Account is already invited as an <strong>Editor</strong> to your Google Sheet, you can skip manual tab creation.
            Click <strong>Upgrade Sheet Structure</strong> above to automatically create all required tabs and schema columns.
          </p>
        </div>

        {/* Step 1: Tabs */}
        <div className="rounded-2xl bg-neutral-100 dark:bg-muted/30 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              1
            </span>
            <span>Setup Google Spreadsheet Tabs</span>
          </div>
          <p className="text-muted-foreground text-xs leading-normal">
            To set up manually, create these four tabs in your spreadsheet and paste the respective CSV headers into Row 1:
          </p>

          <div className="space-y-2.5 pt-0.5">
            {tabs.map((tab, idx) => (
              <div key={tab.name} className="rounded-xl bg-white dark:bg-card/70 p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-semibold text-muted-foreground">Tab {idx + 1}:</span>
                    <span className="bg-neutral-200/80 dark:bg-muted px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-foreground">
                      {tab.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                      — {tab.desc}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(tab.headers, tab.name)}
                    className="h-6 px-2 text-[11px] gap-1 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {copiedSection === tab.name ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{copiedSection === tab.name ? "Copied" : "Copy Headers"}</span>
                  </Button>
                </div>
                <div className="rounded-lg bg-neutral-100/90 dark:bg-muted/60 p-2.5 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap break-all select-all leading-relaxed">
                  {tab.headers}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: GCP Console */}
        <div className="rounded-2xl bg-neutral-100 dark:bg-muted/30 p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              2
            </span>
            <span>Create Google Cloud Service Account</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-muted-foreground text-xs leading-relaxed">
            <li>
              Navigate to the{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
                className="underline text-foreground font-medium hover:text-primary"
              >
                Google Cloud Console
              </a>
              .
            </li>
            <li>
              Create a project &rarr; Enable the <strong>Google Sheets API</strong>.
            </li>
            <li>
              Under <strong>IAM & Admin &rarr; Service Accounts</strong>, create a service account
              (e.g., <code>content-planner-backend</code>).
            </li>
            <li>
              Open the created account &rarr; <strong>Keys</strong> tab &rarr; <strong>Add Key &rarr; Create new key (JSON)</strong> to download credentials.
            </li>
          </ol>
        </div>

        {/* Step 3: Sharing */}
        <div className="rounded-2xl bg-neutral-100 dark:bg-muted/30 p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              3
            </span>
            <span>Share Sheet with the Service Account</span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Open your Google Sheet, click the top-right green <strong>Share</strong> button,
            and invite your Service Account client email (from Step 2) with the <strong>Editor</strong> permission.
          </p>
        </div>

        {/* Step 4: Environment Variables */}
        <div className="rounded-2xl bg-neutral-100 dark:bg-muted/30 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground min-w-0">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                4
              </span>
              <span className="truncate">Add Credentials to .env</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(envSample, "env")}
              className="h-6 px-2 text-[11px] gap-1 shrink-0 text-muted-foreground hover:text-foreground"
            >
              {copiedSection === "env" ? (
                <Check className="size-3 text-emerald-600" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copiedSection === "env" ? "Copied" : "Copy .env Sample"}</span>
            </Button>
          </div>
          <pre className="rounded-xl bg-white dark:bg-card/70 p-3.5 font-mono text-[11px] text-foreground whitespace-pre-wrap break-all leading-relaxed select-all shadow-xs">
            {envSample}
          </pre>
        </div>
      </div>
    </ResponsiveModal>
  );
}
