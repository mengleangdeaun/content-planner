"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { useContentFilter } from "../hooks/use-content-filter";
import { ContentStatsCards } from "./content-stats-cards";
import { ContentToolbar } from "./content-toolbar";
import { ContentTable } from "./content-table";
import { ContentBoard } from "./content-board";

export function ContentPipelineView() {
  const {
    items,
    channels,
    contentTypes,
    campaigns,
    openPostForm,
    openDetailDrawer,
    openMetricsModal,
    onStatusChange,
  } = useWorkspace();
  const { can, currentUser } = useAuth();
  const [layout, setLayout] = useState<"table" | "board">("table");

  const filter = useContentFilter(items, currentUser.email);

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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-md border p-0.5" role="group" aria-label="Layout">
            {(["table", "board"] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={layout === option ? "secondary" : "ghost"}
                aria-pressed={layout === option}
                onClick={() => setLayout(option)}
                className="h-7 px-3 text-xs capitalize"
              >
                {option}
              </Button>
            ))}
          </div>
          {can("content.create") && (
            <Button
              onClick={() => openPostForm({ mode: "create" })}
              size="default"
              className="gap-2 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>New Content Piece</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <ContentStatsCards items={items.filter((item) => item.status !== "Archived")} />

      {/* Filter Toolbar */}
      <ContentToolbar
        filter={filter}
        channels={channels}
        contentTypes={contentTypes}
        campaigns={campaigns}
      />

      {layout === "board" ? (
        <ContentBoard items={filter.filteredItems} />
      ) : (
        <ContentTable
          items={filter.filteredItems}
          onOpenDetailDrawer={openDetailDrawer}
          onOpenMetricsModal={openMetricsModal}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}
