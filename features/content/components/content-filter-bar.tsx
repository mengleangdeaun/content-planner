"use client";

import React from "react";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { FilterBar, FilterChip, FilterField, listChips } from "@/components/shared/filter-bar";
import { SearchableMultiSelect } from "@/components/shared/searchable-multi-select";
import { useWorkspace } from "@/context/workspace-context";
import { ContentFilters } from "@/lib/content-filter";
import { DATE_PRESET_OPTIONS, DateFilterPreset, formatShortDate } from "@/lib/date-utils";
import { ALL_STATUSES } from "@/lib/workflow";

const STATUS_OPTIONS = ALL_STATUSES.map((status) => ({ value: status, label: status }));
const FORMAT_OPTIONS = [
  { value: "all", label: "All formats" },
  { value: "poster", label: "Poster (any)" },
  { value: "video", label: "Video (any)" },
  { value: "both", label: "Poster + video" },
  { value: "poster_only", label: "Poster only" },
  { value: "video_only", label: "Video only" },
];
const LIST_KEYS = ["channelIds", "types", "statuses", "campaignIds"] as const;
type ListKey = (typeof LIST_KEYS)[number];
const LIST_LABELS: Record<ListKey, string> = { channelIds: "Channels", types: "Types", statuses: "Statuses", campaignIds: "Campaigns" };

export interface DateFilterProps {
  preset: DateFilterPreset;
  onPresetChange: (preset: DateFilterPreset) => void;
  start: string;
  onStartChange: (date: string) => void;
  end: string;
  onEndChange: (date: string) => void;
}

interface ContentFilterBarProps {
  filters: ContentFilters;
  onChange: (patch: Partial<ContentFilters>) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  /** Adds a publish date filter. Pages that pick dates themselves, like the Calendar, leave it out. */
  date?: DateFilterProps;
  /** Adds the poster/video format filter. */
  showFormat?: boolean;
}

/** The post filters shared by Content Management and the Calendar. */
export function ContentFilterBar({ filters, onChange, onReset, hasActiveFilters, date, showFormat }: ContentFilterBarProps) {
  const { channels, contentTypes, campaigns } = useWorkspace();
  const liveCampaigns = campaigns.filter((c) => c.status !== "Archived");

  const options: Record<ListKey, { value: string; label: string }[]> = {
    channelIds: channels.map((c) => ({ value: c.id, label: `${c.platform} — ${c.account_name}` })),
    types: contentTypes.map((t) => ({ value: t.name, label: t.name })),
    statuses: STATUS_OPTIONS,
    campaignIds: liveCampaigns.map((c) => ({ value: c.id, label: c.name })),
  };

  const clearDate = () => {
    date?.onPresetChange("all");
    date?.onStartChange("");
    date?.onEndChange("");
  };
  const dateText = () => {
    if (!date) return "";
    if (date.preset !== "custom") return DATE_PRESET_OPTIONS.find((o) => o.value === date.preset)?.label ?? date.preset;
    if (date.start && date.end) return `${formatShortDate(date.start)} – ${formatShortDate(date.end)}`;
    return date.start ? `From ${formatShortDate(date.start)}` : date.end ? `Until ${formatShortDate(date.end)}` : "Custom range";
  };

  const chips: FilterChip[] = [
    ...(date && date.preset !== "all" ? [{ key: "date", text: `Date: ${dateText()}`, clear: clearDate }] : []),
    ...listChips(LIST_KEYS, filters, options, LIST_LABELS, (key) => onChange({ [key]: [] })),
    ...(showFormat && filters.format !== "all"
      ? [{ key: "format", text: FORMAT_OPTIONS.find((o) => o.value === filters.format)?.label ?? filters.format, clear: () => onChange({ format: "all" }) }]
      : []),
  ];

  return (
    <FilterBar
      search={filters.search}
      onSearchChange={(search) => onChange({ search })}
      searchPlaceholder="Search title, ID or caption..."
      toggles={[
        { label: "My work", pressed: filters.myWork, onToggle: () => onChange({ myWork: !filters.myWork }) },
        { label: "Overdue", pressed: filters.overdueOnly, onToggle: () => onChange({ overdueOnly: !filters.overdueOnly }) },
      ]}
      chips={chips}
      onClearPanel={() => {
        onChange({ channelIds: [], types: [], statuses: [], campaignIds: [], ...(showFormat && { format: "all" }) });
        clearDate();
      }}
      hasActiveFilters={hasActiveFilters}
      onReset={onReset}
      panel={
        <>
          {date && (
            <FilterField label="Publish date">
              <ResponsiveSelect
                aria-label="Publish date"
                value={date.preset}
                onValueChange={(value) => date.onPresetChange(value as DateFilterPreset)}
                options={DATE_PRESET_OPTIONS}
              />
              {date.preset === "custom" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <ResponsiveDatePicker aria-label="From" value={date.start} onChange={date.onStartChange} placeholder="From" />
                  <ResponsiveDatePicker aria-label="To" value={date.end} onChange={date.onEndChange} placeholder="To" />
                </div>
              )}
            </FilterField>
          )}
          {LIST_KEYS.filter((key) => key !== "campaignIds" || liveCampaigns.length > 0).map((key) => (
            <FilterField key={key} label={LIST_LABELS[key]}>
              <SearchableMultiSelect
                label={LIST_LABELS[key]}
                value={filters[key]}
                onValueChange={(value) => onChange({ [key]: value })}
                options={options[key]}
              />
            </FilterField>
          ))}
          {showFormat && (
            <FilterField label="Format">
              <ResponsiveSelect aria-label="Format" value={filters.format} onValueChange={(value) => onChange({ format: value })} options={FORMAT_OPTIONS} />
            </FilterField>
          )}
        </>
      }
    />
  );
}
