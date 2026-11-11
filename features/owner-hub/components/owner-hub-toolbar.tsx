"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar, Share2 } from "lucide-react";
import { format } from "date-fns";
import { DateFilterPreset } from "@/lib/date-utils";
import { ChannelAccount } from "@/lib/types";
import { OwnerHubMetricsState } from "../hooks/use-owner-hub-metrics";

interface OwnerHubToolbarProps {
  metrics: OwnerHubMetricsState;
  channels: ChannelAccount[];
}

export function OwnerHubToolbar({ metrics, channels }: OwnerHubToolbarProps) {
  const {
    datePeriod,
    setDatePeriod,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    selectedChannelId,
    setSelectedChannelId,
    selectedChannel,
  } = metrics;

  const parsedStart = customStart ? new Date(`${customStart}T00:00:00`) : undefined;
  const parsedEnd = customEnd ? new Date(`${customEnd}T00:00:00`) : undefined;

  return (
    <div className="space-y-4">
      {/* Header and Controls Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dashboard
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              {selectedChannel
                ? `${selectedChannel.platform} ${selectedChannel.account_name} Strategic Focus`
                : "Executive Strategic Focus"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Executive overview of publishing cadence, target channel priorities, and connected production assets.
          </p>
        </div>

        {/* Channel & Date Filters */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Target Channel Selector */}
          <div className="w-48">
            <Select
              value={selectedChannelId}
              onValueChange={(val) => val && setSelectedChannelId(val)}
            >
              <SelectTrigger className="h-9 text-xs">
                <Share2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Channel Focus" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.platform} — {ch.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Period Selector */}
          <div className="w-56">
            <Select
              value={datePeriod}
              onValueChange={(val) => val && setDatePeriod(val as DateFilterPreset)}
            >
              <SelectTrigger className="h-9 text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Select Date Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week (Current)</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="next-7-days">Next 7 Days</SelectItem>
                <SelectItem value="past-30-days">Past 30 Days</SelectItem>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="custom">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {datePeriod === "custom" && (
        <Card className="p-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Date Range:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From</span>
              <div className="w-44">
                <DatePicker
                  date={parsedStart}
                  onSelectDate={(d) => setCustomStart(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Start date"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To</span>
              <div className="w-44">
                <DatePicker
                  date={parsedEnd}
                  onSelectDate={(d) => setCustomEnd(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

