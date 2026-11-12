"use client";

import React, { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/shared/data-pagination";
import { NoData, NoResults } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { clampPage, pageSlice } from "@/lib/pagination";
import { useContentFilter } from "../hooks/use-content-filter";
import { ContentBoard } from "./content-board";
import { ContentList } from "./content-list";
import { ContentStatsCards } from "./content-stats-cards";
import { ContentToolbar } from "./content-toolbar";

export function ContentPipelineView() {
  const { items, channels, openPostForm } = useWorkspace();
  const { can, currentUser } = useAuth();
  const [layout, setLayout] = useState<"table" | "board">("table");
  const filter = useContentFilter(items, channels, currentUser.email);

  // The page belongs to one set of filters: any filter change starts again at page 1.
  const [paging, setPaging] = useState({ key: filter.filterKey, page: 1, size: 25 });
  const total = filter.filteredItems.length;
  const page = paging.key === filter.filterKey ? clampPage(paging.page, total, paging.size) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Management"
        description="Plan, organize, and monitor content across all publishing channels."
        actions={
          <>
            <div className="flex rounded-md border p-0.5" role="group" aria-label="Layout">
              {(["table", "board"] as const).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={layout === option ? "secondary" : "ghost"}
                  aria-pressed={layout === option}
                  onClick={() => setLayout(option)}
                  className="h-8 px-3 text-xs capitalize"
                >
                  {option === "table" ? "List" : "Board"}
                </Button>
              ))}
            </div>
            {can("content.create") && (
              <Button onClick={() => openPostForm({ mode: "create" })} className="gap-2 font-medium">
                <Plus className="h-4 w-4" />
                <span>New post</span>
              </Button>
            )}
          </>
        }
      />

      <ContentStatsCards
        items={items.filter((item) => item.status !== "Archived")}
        statuses={filter.filters.statuses}
        onStatusesChange={(statuses) => filter.setFilters({ statuses })}
      />

      <ContentToolbar filter={filter} />

      {layout === "board" ? (
        <ContentBoard items={filter.filteredItems} />
      ) : (
        <div className="space-y-4">
          <ContentList
            items={pageSlice(filter.filteredItems, page, paging.size)}
            empty={
              items.some((item) => item.status !== "Archived") || filter.hasActiveFilters ? (
                <NoResults onClear={filter.resetFilters} />
              ) : (
                <NoData
                  icon={<FileText />}
                  title="No posts yet"
                  description="Plan your first post, and it will show up here."
                  action={
                    can("content.create") && (
                      <Button onClick={() => openPostForm({ mode: "create" })} className="gap-2">
                        <Plus className="h-4 w-4" /> New post
                      </Button>
                    )
                  }
                />
              )
            }
          />
          <DataPagination
            page={page}
            pageSize={paging.size}
            total={total}
            onPageChange={(next) => setPaging({ ...paging, key: filter.filterKey, page: next })}
            onPageSizeChange={(size) => setPaging({ key: filter.filterKey, page: 1, size })}
          />
        </div>
      )}
    </div>
  );
}
