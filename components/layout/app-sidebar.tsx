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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  CalendarRange,
  ChevronsUpDown,
  Flag,
  UserRound,
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
import { ProfileDialog } from "@/features/team/components/profile-dialog";
import { PersonAvatar } from "@/components/shared/person-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { isMobile, state } = useSidebar();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const isSyncing = props.isSyncing ?? workspace.isSyncing;
  const onSync = props.onSync ?? workspace.syncNow;

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      {/* Workspace Brand Header */}
      {/* SidebarHeader is a column: items-* sets the left/right position, justify-* the vertical one. */}
      <SidebarHeader className="h-12 justify-center border-b px-3 items-start group-data-[collapsible=icon]:items-center">
        {/* Expanded: landscape logo */}
        <img
          src="/assets/logo-landscape.svg"
          alt="SCC Group"
          className="h-7 w-auto object-contain group-data-[collapsible=icon]:hidden"
        />
        {/* Collapsed: square logo */}
        <img
          src="/assets/logo-square.svg"
          alt="SCC Group"
          className="hidden h-7 w-7 object-contain group-data-[collapsible=icon]:block"
        />
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
      <SidebarFooter className="border-t p-2 gap-1.5">
        {/* Utilities: Sync & Upgrade Schema */}
        <div className="flex items-center gap-1 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5 flex-1 justify-start group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
            title="Refresh cache from Google Sheets"
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isSyncing ? "animate-spin [animation-duration:650ms]" : ""}`} />
            <span className="text-[11px] font-medium group-data-[collapsible=icon]:hidden">
              {isSyncing ? "Syncing..." : "Sync Sheets"}
            </span>
          </Button>

          {can("system.manage") && (
            <div className="group-data-[collapsible=icon]:hidden">
              <UpgradeSheetButton size="sm" className="h-7 text-[11px] px-2" label="Upgrade Schema" />
            </div>
          )}
        </div>

        {/* Signed-in User Block */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={currentUser.name}
                    className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  />
                }
                aria-label={`Account menu for ${currentUser.name}`}
              >
                <PersonAvatar
                  name={currentUser.name}
                  avatarUrl={currentUser.avatar_url}
                  size="md"
                  className="rounded-lg shrink-0"
                />
                <div className="grid flex-1 min-w-0 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-xs text-foreground">
                    {currentUser.name}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {currentUser.role_name || currentUser.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "bottom" : state === "collapsed" ? "right" : "top"}
                align={state === "collapsed" ? "end" : "start"}
                sideOffset={8}
                className="w-64 min-w-56 p-1.5"
              >
                {/* User info in dropdown header */}
                <DropdownMenuGroup>
                  <div className="flex items-center gap-2.5 px-2 py-2 text-left">
                    <PersonAvatar
                      name={currentUser.name}
                      avatarUrl={currentUser.avatar_url}
                      size="md"
                      className="rounded-lg shrink-0"
                    />
                    <div className="grid flex-1 min-w-0 leading-tight">
                      <span className="truncate font-semibold text-xs text-foreground">
                        {currentUser.name}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {currentUser.email}
                      </span>
                      <span className="truncate text-[10px] font-medium text-primary mt-0.5">
                        {currentUser.role_name}
                      </span>
                    </div>
                  </div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="gap-2 text-xs">
                    <UserRound className="size-3.5" />
                    <span>Edit profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onSync} disabled={isSyncing} className="gap-2 text-xs">
                    <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin [animation-duration:650ms]" : ""}`} />
                    <span>{isSyncing ? "Syncing..." : "Sync workspace"}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={signOut} className="gap-2 text-xs text-destructive focus:text-destructive">
                    <LogOut className="size-3.5" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        {isProfileOpen && <ProfileDialog onClose={() => setIsProfileOpen(false)} />}
      </SidebarFooter>
    </Sidebar>
  );
}
