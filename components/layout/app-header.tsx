"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { NavView } from "./app-sidebar";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { UpgradeSheetButton } from "@/features/integrations";

interface AppHeaderProps {
  activeView: NavView;
  onOpenGuide?: () => void;
}

const VIEW_TITLES: Record<NavView, { section: string; title: string }> = {
  "owner-hub": { section: "Overview", title: "Dashboard" },
  pipeline: { section: "Operations", title: "Content Management" },
  calendar: { section: "Operations", title: "Calendar" },
  campaigns: { section: "Operations", title: "Campaigns" },
  tasks: { section: "Operations", title: "Tasks" },
  analytics: { section: "Analytics", title: "Performance Analytics" },
  channels: { section: "Settings", title: "Channel Accounts" },
  taxonomies: { section: "Settings", title: "Content Types" },
  team: { section: "Administration", title: "Team" },
  roles: { section: "Administration", title: "Roles & Permissions" },
};

export function AppHeader({
  activeView,
  ...props
}: AppHeaderProps) {
  const workspace = useWorkspace();
  const { can } = useAuth();
  const onOpenGuide = props.onOpenGuide ?? (() => workspace.setIsGuideModalOpen(true));

  const current = VIEW_TITLES[activeView] || { section: "Workspace", title: "Dashboard" };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem className="hidden md:block">
              <span className="text-muted-foreground">{current.section}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-semibold text-foreground">
                {current.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        {/* Upgrade Sheet Structure Button */}
        <UpgradeSheetButton />

        {/* GCP Guide Modal Trigger */}
        {can("system.manage") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenGuide}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Setup Guide</span>
          </Button>
        )}
      </div>
    </header>
  );
}
