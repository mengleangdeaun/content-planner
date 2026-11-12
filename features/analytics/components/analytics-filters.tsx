"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT } from "@/components/ui/form-layout";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { SearchableMultiSelect } from "@/components/shared/searchable-multi-select";
import { useWorkspace } from "@/context/workspace-context";
import { DATE_PRESET_OPTIONS, DateFilterPreset } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { AnalyticsFilters as Filters, EMPTY_ANALYTICS_FILTERS, hasAnalyticsFilters } from "../hooks/use-analytics-calc";

interface AnalyticsFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

// One filter row above everything it scopes: the KPIs, charts, waiting list and table.
export function AnalyticsFilters({ filters, onChange }: AnalyticsFiltersProps) {
  const { channels, contentTypes } = useWorkspace();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <Card className="space-y-3 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <ResponsiveSelect
          aria-label="Publish date"
          value={filters.datePreset}
          onValueChange={(value) => set({ datePreset: value as DateFilterPreset })}
          options={DATE_PRESET_OPTIONS.filter((o) => o.value !== "next-7-days")}
        />
        <SearchableMultiSelect
          label="Channels"
          value={filters.channelIds}
          onValueChange={(channelIds) => set({ channelIds })}
          options={channels.map((c) => ({ value: c.id, label: `${c.platform} — ${c.account_name}` }))}
        />
        <SearchableMultiSelect
          label="Types"
          value={filters.types}
          onValueChange={(types) => set({ types })}
          options={contentTypes.map((t) => ({ value: t.name, label: t.name }))}
        />
        {hasAnalyticsFilters(filters) && (
          <Button variant="ghost" onClick={() => onChange(EMPTY_ANALYTICS_FILTERS)} className={cn("text-muted-foreground", CONTROL_HEIGHT)}>
            Reset filters
          </Button>
        )}
      </div>
      {filters.datePreset === "custom" && (
        <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-2 lg:max-w-md">
          <ResponsiveDatePicker aria-label="From" value={filters.customStart} onChange={(customStart) => set({ customStart })} placeholder="From" />
          <ResponsiveDatePicker aria-label="To" value={filters.customEnd} onChange={(customEnd) => set({ customEnd })} placeholder="To" />
        </div>
      )}
    </Card>
  );
}
