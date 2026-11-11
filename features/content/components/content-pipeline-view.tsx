"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { useContentFilter } from "../hooks/use-content-filter";
import { ContentStatsCards } from "./content-stats-cards";
import { ContentToolbar } from "./content-toolbar";
import { ContentTable } from "./content-table";

export function ContentPipelineView() {
  const {
    items,
    channels,
    contentTypes,
    setIsCreateModalOpen,
    openDetailDrawer,
    openMetricsModal,
    onStatusChange,
  } = useWorkspace();
  const { can } = useAuth();

  const filter = useContentFilter(items);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Content Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan, organize, and monitor cross-platform marketing content across all publishing channels.
          </p>
        </div>

        {can("content.create") && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            size="default"
            className="gap-2 self-start sm:self-auto font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>New Content Piece</span>
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <ContentStatsCards items={items} />

      {/* Filter Toolbar */}
      <ContentToolbar
        filter={filter}
        channels={channels}
        contentTypes={contentTypes}
      />

      {/* Content Table */}
      <ContentTable
        items={filter.filteredItems}
        onOpenDetailDrawer={openDetailDrawer}
        onOpenMetricsModal={openMetricsModal}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

