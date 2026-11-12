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
import { DEFAULT_DASHBOARD_FILTERS, DashboardFilters as Filters, hasDashboardFilters } from "../hooks/use-dashboard";

// One filter row above everything it scopes, in the same pattern as the Analytics filters.
export function DashboardFilters({ filters, onChange }: { filters: Filters; onChange: (filters: Filters) => void }) {
  const { channels } = useWorkspace();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <Card className="space-y-3 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[14rem_minmax(0,22rem)_auto]">
        <ResponsiveSelect
          aria-label="Period"
          value={filters.datePreset}
          onValueChange={(value) => set({ datePreset: value as DateFilterPreset })}
          options={DATE_PRESET_OPTIONS}
        />
        <SearchableMultiSelect
          label="Channels"
          value={filters.channelIds}
          onValueChange={(channelIds) => set({ channelIds })}
          options={channels
            .filter((c) => c.status !== "Archived")
            .map((c) => ({ value: c.id, label: `${c.platform} — ${c.account_name}` }))}
        />
        {hasDashboardFilters(filters) && (
          <Button
            variant="ghost"
            onClick={() => onChange(DEFAULT_DASHBOARD_FILTERS)}
            className={cn("justify-self-start text-muted-foreground", CONTROL_HEIGHT)}
          >
            Reset
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
