"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { DateFilterPreset } from "@/lib/date-utils";
import { ChannelAccount, ContentTypeConfig } from "@/lib/types";
import { ContentFilterState } from "../hooks/use-content-filter";

interface ContentToolbarProps {
  filter: ContentFilterState;
  channels: ChannelAccount[];
  contentTypes: ContentTypeConfig[];
}

export function ContentToolbar({
  filter,
  channels,
  contentTypes,
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
    resetFilters,
    hasActiveFilters,
  } = filter;

  const parsedStart = customStartDate ? new Date(`${customStartDate}T00:00:00`) : undefined;
  const parsedEnd = customEndDate ? new Date(`${customEndDate}T00:00:00`) : undefined;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, ID, or caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Preset Filter */}
          <div className="w-36">
            <Select
              value={datePreset}
              onValueChange={(val) => val && setDatePreset(val as DateFilterPreset)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="next-7-days">Next 7 Days</SelectItem>
                <SelectItem value="past-30-days">Past 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel Page Filter */}
          <div className="w-44">
            <Select
              value={selectedAccount}
              onValueChange={(val) => val && setSelectedAccount(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Channel Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.account_name}>
                    {ch.platform} — {ch.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Type Filter */}
          <div className="w-40">
            <Select
              value={selectedType}
              onValueChange={(val) => val && setSelectedType(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {contentTypes.map((ct) => (
                  <SelectItem key={ct.id} value={ct.name}>
                    {ct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Media Format Filter (Poster, Video, Both) */}
          <div className="w-36">
            <Select
              value={selectedFormat}
              onValueChange={(val) => val && setSelectedFormat(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Media Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="poster">Poster (Any)</SelectItem>
                <SelectItem value="video">Video (Any)</SelectItem>
                <SelectItem value="both">Both (Poster + Video)</SelectItem>
                <SelectItem value="poster_only">Poster Only</SelectItem>
                <SelectItem value="video_only">Video Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select
              value={selectedStatus}
              onValueChange={(val) => val && setSelectedStatus(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="In Production">In Production</SelectItem>
                <SelectItem value="In Review">In Review</SelectItem>
                <SelectItem value="In Revise">In Revise</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-muted-foreground px-3"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker row */}
      {datePreset === "custom" && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t text-sm">
          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">From</span>
            <div className="w-44">
              <DatePicker
                date={parsedStart}
                onSelectDate={(d) => setCustomStartDate(d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="Start date"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">To</span>
            <div className="w-44">
              <DatePicker
                date={parsedEnd}
                onSelectDate={(d) => setCustomEndDate(d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="End date"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

