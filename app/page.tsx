"use client";

import { ConfirmProvider } from "@/components/shared/confirm-dialog";
import React, { use, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, NavView } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { WorkspaceProvider, useWorkspace } from "@/context/workspace-context";
import { AuthProvider } from "@/context/auth-context";
import {
  ContentPipelineView,
  CreatePostModal,
  ContentDetailDrawer,
} from "@/features/content";
import { OwnerHubView } from "@/features/owner-hub";
import { AnalyticsView, MetricsModal } from "@/features/analytics";
import { ChannelList } from "@/features/channels";
import { TaxonomiesManager } from "@/features/taxonomies";
import { GcpSetupGuideModal } from "@/features/integrations";
import { TeamView, RolesView } from "@/features/team";
import { CalendarView, CampaignsView, TasksView } from "@/features/planning";
import { setUrlParam } from "@/lib/url-params";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";

const VIEWS: NavView[] = [
  "owner-hub",
  "pipeline",
  "calendar",
  "campaigns",
  "tasks",
  "analytics",
  "channels",
  "taxonomies",
  "team",
  "roles",
];

function WorkspaceDashboard({ initialView }: { initialView: NavView }) {
  const [activeView, setActiveViewState] = useState<NavView>(initialView);
  const { loading } = useWorkspace();

  const setActiveView = (view: NavView) => {
    setActiveViewState(view);
    setUrlParam("view", view);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Enterprise Collapsible Sidebar */}
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />

        {/* Main Application Inset */}
        {/* min-w-0 lets wide content (the Board) scroll inside the page instead of widening it. */}
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <AppHeader activeView={activeView} />

          <div className="w-full min-w-0 flex-1 p-4 md:p-6 xl:p-8">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin [animation-duration:650ms]" />
                  <span className="text-sm">Loading workspace records...</span>
                </div>
              </div>
            ) : (
              <div key={activeView} className="animate-in fade-in-50 duration-200 ease-[var(--ease-out)]">
                {activeView === "pipeline" && <ContentPipelineView />}
                {activeView === "calendar" && <CalendarView />}
                {activeView === "campaigns" && <CampaignsView />}
                {activeView === "tasks" && <TasksView />}
                {activeView === "owner-hub" && <OwnerHubView onNavigate={setActiveView} />}
                {activeView === "analytics" && <AnalyticsView />}
                {activeView === "channels" && <ChannelList />}
                {activeView === "taxonomies" && <TaxonomiesManager />}
                {activeView === "team" && <TeamView />}
                {activeView === "roles" && <RolesView />}
              </div>
            )}
          </div>
        </SidebarInset>

        {/* Domain Feature Drawers & Modals */}
        <ContentDetailDrawer />
        <MetricsModal />
        <CreatePostModal />
        <GcpSetupGuideModal />
      </div>
    </SidebarProvider>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { view, item } = use(searchParams);
  const initialView = VIEWS.find((v) => v === view) ?? "owner-hub";

  return (
    <AuthProvider>
      <WorkspaceProvider initialItemId={typeof item === "string" ? item : null}>
        <TooltipProvider>
          <ConfirmProvider>
            <WorkspaceDashboard initialView={initialView} />
          </ConfirmProvider>
        </TooltipProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
