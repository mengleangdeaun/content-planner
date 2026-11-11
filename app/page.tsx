"use client";

import React, { useState } from "react";
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
import { RefreshCw } from "lucide-react";

function WorkspaceDashboard() {
  const [activeView, setActiveView] = useState<NavView>("owner-hub");
  const { loading } = useWorkspace();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Enterprise Collapsible Sidebar */}
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />

        {/* Main Application Inset */}
        <SidebarInset className="flex flex-col flex-1">
          <AppHeader activeView={activeView} />

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
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
                {activeView === "owner-hub" && <OwnerHubView />}
                {activeView === "analytics" && <AnalyticsView />}
                {activeView === "channels" && <ChannelList />}
                {activeView === "taxonomies" && <TaxonomiesManager />}
                {activeView === "team" && <TeamView />}
                {activeView === "roles" && <RolesView />}
              </div>
            )}
          </main>
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

export default function DashboardPage() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <WorkspaceDashboard />
      </WorkspaceProvider>
    </AuthProvider>
  );
}
