"use client";

import React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CalendarRange,
  Flag,
  LayoutDashboard,
  Layers,
  ListChecks,
  LogOut,
  TrendingUp,
  Share2,
  ShieldCheck,
  Tags,
  RefreshCw,
  Users,
} from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { UpgradeSheetButton } from "@/features/integrations";

export type NavView =
  | "pipeline"
  | "calendar"
  | "campaigns"
  | "tasks"
  | "owner-hub"
  | "analytics"
  | "channels"
  | "taxonomies"
  | "team"
  | "roles";

interface AppSidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  isSyncing?: boolean;
  onSync?: () => void;
}

export function AppSidebar({
  activeView,
  setActiveView,
  ...props
}: AppSidebarProps) {
  const workspace = useWorkspace();
  const { currentUser, can, signOut } = useAuth();

  const isSyncing = props.isSyncing ?? workspace.isSyncing;
  const onSync = props.onSync ?? workspace.syncNow;

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      {/* Workspace Brand Header */}
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold shadow-xs">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="flex flex-col truncate">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              Marketing Ops
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              Content Planner & Analytics
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Core Operations Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "owner-hub"}
                  onClick={() => setActiveView("owner-hub")}
                  tooltip="Dashboard"
                  className="gap-2.5 font-medium text-sm"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "pipeline"}
                  onClick={() => setActiveView("pipeline")}
                  tooltip="Content Management"
                  className="gap-2.5 font-medium text-sm"
                >
                  <Layers className="h-4 w-4" />
                  <span>Content Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "calendar"}
                  onClick={() => setActiveView("calendar")}
                  tooltip="Calendar"
                  className="gap-2.5 font-medium text-sm"
                >
                  <CalendarRange className="h-4 w-4" />
                  <span>Calendar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "campaigns"}
                  onClick={() => setActiveView("campaigns")}
                  tooltip="Campaigns"
                  className="gap-2.5 font-medium text-sm"
                >
                  <Flag className="h-4 w-4" />
                  <span>Campaigns</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "tasks"}
                  onClick={() => setActiveView("tasks")}
                  tooltip="Tasks"
                  className="gap-2.5 font-medium text-sm"
                >
                  <ListChecks className="h-4 w-4" />
                  <span>Tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {can("metrics.view") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "analytics"}
                    onClick={() => setActiveView("analytics")}
                    tooltip="Performance Analytics"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Performance Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Management & Configuration Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-2">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "channels"}
                  onClick={() => setActiveView("channels")}
                  tooltip="Channel Accounts"
                  className="gap-2.5 font-medium text-sm"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Channel Accounts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "taxonomies"}
                  onClick={() => setActiveView("taxonomies")}
                  tooltip="Content Types"
                  className="gap-2.5 font-medium text-sm"
                >
                  <Tags className="h-4 w-4" />
                  <span>Content Types</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {can("team.manage") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "team"}
                    onClick={() => setActiveView("team")}
                    tooltip="Team"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <Users className="h-4 w-4" />
                    <span>Team</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {can("roles.manage") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeView === "roles"}
                    onClick={() => setActiveView("roles")}
                    tooltip="Roles & Permissions"
                    className="gap-2.5 font-medium text-sm"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Roles & Permissions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t p-3 space-y-2.5">
        {/* Sync */}
        <div className="flex items-center justify-end gap-1.5 px-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="h-6 px-1.5 text-xs text-muted-foreground gap-1"
            title="Refresh cache from Google Sheets"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin [animation-duration:650ms]" : ""}`} />
            <span className="text-[11px]">Sync</span>
          </Button>
        </div>

        <UpgradeSheetButton className="w-full justify-center h-7 text-[11px]" />

        {/* Signed-in Account */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-xs font-medium text-foreground">{currentUser.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{currentUser.role_name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="h-7 w-7 shrink-0 p-0 text-muted-foreground"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
