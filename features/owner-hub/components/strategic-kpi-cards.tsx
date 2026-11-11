"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, CheckCircle } from "lucide-react";
import { OwnerHubMetricsState } from "../hooks/use-owner-hub-metrics";

interface StrategicKpiCardsProps {
  metrics: OwnerHubMetricsState;
}

export function StrategicKpiCards({ metrics }: StrategicKpiCardsProps) {
  const {
    datePeriod,
    datePeriodLabels,
    selectedChannel,
    channelPeriodItems,
    educationalCount,
    promotionalCount,
    scheduledOrPublishedCount,
    posterCount,
    videoCount,
  } = metrics;

  const channelLabel = selectedChannel
    ? `${selectedChannel.platform} ${selectedChannel.account_name}`
    : "Channel";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* STRATEGIC METRIC: Educational Content Planned */}
      <Card className="border-primary/30 shadow-xs relative overflow-hidden animate-in fade-in-50 duration-200 ease-[var(--ease-out)]">
        <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full pointer-events-none" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Strategic Priority
            </span>
            <Badge variant="secondary" className="text-xs font-medium">
              {channelLabel}
            </Badge>
          </div>
          <CardTitle className="text-base font-semibold text-foreground mt-1">
            Educational Content Planned
          </CardTitle>
          <CardDescription className="text-xs">
            {datePeriodLabels[datePeriod]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-extrabold tracking-tight text-primary">
              {educationalCount}
            </div>
            <span className="text-sm text-muted-foreground font-medium">Pieces</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-normal">
            Educational frameworks and structured carousel swipe posts planned for this period.
          </p>
        </CardContent>
      </Card>

      {/* Total Channel Volume */}
      <Card className="shadow-xs animate-in fade-in-50 duration-200 [animation-delay:50ms] ease-[var(--ease-out)] fill-mode-both">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Channel Volume
            </span>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground mt-1">
            Total {channelLabel} Assets
          </CardTitle>
          <CardDescription className="text-xs">
            All categories scheduled across this timeframe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold tracking-tight text-foreground">
              {channelPeriodItems.length}
            </div>
            <span className="text-sm text-muted-foreground font-medium">Total</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex gap-2 flex-wrap">
            <span>{posterCount} Posters</span>
            <span>&bull;</span>
            <span>{videoCount} Videos</span>
            <span>&bull;</span>
            <span>{promotionalCount} Promo</span>
          </div>
        </CardContent>
      </Card>

      {/* Production Stage Readiness */}
      <Card className="shadow-xs animate-in fade-in-50 duration-200 [animation-delay:100ms] ease-[var(--ease-out)] fill-mode-both">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Production Readiness
            </span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <CardTitle className="text-base font-semibold text-foreground mt-1">
            Scheduled or Published
          </CardTitle>
          <CardDescription className="text-xs">
            Asset readiness and approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold tracking-tight text-foreground">
              {scheduledOrPublishedCount}
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              / {channelPeriodItems.length} Total
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {channelPeriodItems.length > 0
              ? `${Math.round((scheduledOrPublishedCount / channelPeriodItems.length) * 100)}% of content is prepared and ready for distribution.`
              : "No pieces scheduled for this selected period."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

