"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT } from "@/components/ui/form-layout";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Search, Calendar } from "lucide-react";
import { DateFilterPreset } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { ALL_STATUSES } from "@/lib/workflow";
import { Campaign, ChannelAccount, ContentTypeConfig } from "@/lib/types";
import { ContentFilterState } from "../hooks/use-content-filter";

interface ContentToolbarProps {
  filter: ContentFilterState;
  channels: ChannelAccount[];
  contentTypes: ContentTypeConfig[];
  campaigns: Campaign[];
}

const DATE_OPTIONS = [
  { value: "all", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "next-7-days", label: "Next 7 Days" },
  { value: "past-30-days", label: "Past 30 Days" },
  { value: "custom", label: "Custom Range" },
];

const FORMAT_OPTIONS = [
  { value: "all", label: "All Formats" },
  { value: "poster", label: "Poster (Any)" },
  { value: "video", label: "Video (Any)" },
  { value: "both", label: "Both (Poster + Video)" },
  { value: "poster_only", label: "Poster Only" },
  { value: "video_only", label: "Video Only" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  ...ALL_STATUSES.map((status) => ({ value: status, label: status })),
];

// Two filters per row on phones, fixed widths on larger screens.
const FILTER = "w-[calc(50%-0.25rem)] md:w-40";

export function ContentToolbar({
  filter,
  channels,
  contentTypes,
  campaigns,
}: ContentToolbarProps) {
  const {
    search,
    setSearch,
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedAccount,
    setSelectedAccount,
    selectedType,
    setSelectedType,
    selectedFormat,
    setSelectedFormat,
    selectedStatus,
    setSelectedStatus,
    selectedCampaign,
    setSelectedCampaign,
    myWork,
    setMyWork,
    overdueOnly,
    setOverdueOnly,
    resetFilters,
    hasActiveFilters,
  } = filter;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search content"
            placeholder="Search by title, ID, or caption..."
            value={search}
            enterKeyHint="search"
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-9", CONTROL_HEIGHT)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={FILTER}>
            <ResponsiveSelect
              aria-label="Filter by date"
              value={datePreset}
              onValueChange={(value) => setDatePreset(value as DateFilterPreset)}
              options={DATE_OPTIONS}
            />
          </div>
          <div className={FILTER}>
            <ResponsiveSelect
              aria-label="Filter by channel"
              value={selectedAccount}
              onValueChange={setSelectedAccount}
              options={[
                { value: "all", label: "All Channels" },
                ...channels.map((ch) => ({ value: ch.account_name, label: `${ch.platform} — ${ch.account_name}` })),
              ]}
            />
          </div>
          <div className={FILTER}>
            <ResponsiveSelect
              aria-label="Filter by content type"
              value={selectedType}
              onValueChange={setSelectedType}
              options={[
                { value: "all", label: "All Types" },
                ...contentTypes.map((ct) => ({ value: ct.name, label: ct.name })),
              ]}
            />
          </div>
          <div className={FILTER}>
            <ResponsiveSelect
              aria-label="Filter by format"
              value={selectedFormat}
              onValueChange={setSelectedFormat}
              options={FORMAT_OPTIONS}
            />
          </div>
          <div className={FILTER}>
            <ResponsiveSelect
              aria-label="Filter by status"
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              options={STATUS_OPTIONS}
            />
          </div>
          {campaigns.length > 0 && (
            <div className={FILTER}>
              <ResponsiveSelect
                aria-label="Filter by campaign"
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
                options={[
                  { value: "all", label: "All Campaigns" },
                  ...campaigns.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
          )}

          <Button
            variant={myWork ? "secondary" : "outline"}
            size="sm"
            aria-pressed={myWork}
            onClick={() => setMyWork(!myWork)}
            className={cn("text-xs", CONTROL_HEIGHT)}
          >
            My Work
          </Button>
          <Button
            variant={overdueOnly ? "secondary" : "outline"}
            size="sm"
            aria-pressed={overdueOnly}
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={cn("text-xs", CONTROL_HEIGHT)}
          >
            Overdue
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className={cn("text-xs text-muted-foreground px-3", CONTROL_HEIGHT)}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {datePreset === "custom" && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t text-sm">
          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Date Range:
          </span>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <span className="text-xs text-muted-foreground">From</span>
            <div className="min-w-0 flex-1 md:w-44">
              <ResponsiveDatePicker
                aria-label="Start date"
                value={customStartDate}
                onChange={setCustomStartDate}
                placeholder="Start date"
              />
            </div>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <span className="text-xs text-muted-foreground">To</span>
            <div className="min-w-0 flex-1 md:w-44">
              <ResponsiveDatePicker
                aria-label="End date"
                value={customEndDate}
                onChange={setCustomEndDate}
                placeholder="End date"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
