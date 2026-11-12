"use client";

import React from "react";
import { ContentFilterState } from "../hooks/use-content-filter";
import { ContentFilterBar } from "./content-filter-bar";

/** Content Management's filters: the shared bar, with the date and format filters it needs. */
export function ContentToolbar({ filter }: { filter: ContentFilterState }) {
  return (
    <ContentFilterBar
      filters={filter.filters}
      onChange={filter.setFilters}
      onReset={filter.resetFilters}
      hasActiveFilters={filter.hasActiveFilters}
      showFormat
      date={{
        preset: filter.datePreset,
        onPresetChange: filter.setDatePreset,
        start: filter.customStartDate,
        onStartChange: filter.setCustomStartDate,
        end: filter.customEndDate,
        onEndChange: filter.setCustomEndDate,
      }}
    />
  );
}
