"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { useAnalyticsCalc } from "../hooks/use-analytics-calc";
import { AnalyticsKpiCards } from "./analytics-kpi-cards";
import { AnalyticsChartCard } from "./analytics-chart-card";
import { PerformanceLedgerTable } from "./performance-ledger-table";
import { AccessRestrictedCard } from "./access-restricted-card";

export function AnalyticsView() {
  const { items, openDetailDrawer, openMetricsModal } = useWorkspace();
  const { can } = useAuth();
  const { sortBy, setSortBy, aggregate, typeComparisonData, sortedLedger } = useAnalyticsCalc(items);

  if (!can("metrics.view")) {
    return <AccessRestrictedCard />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Performance Analytics
          </h1>
          <Badge variant="outline" className="text-xs font-medium">
            Executive Ledger
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Evaluate cross-platform returns, audience interaction rates, and creative efficiency across content types.
        </p>
      </div>

      {/* Aggregate KPI Cards */}
      <AnalyticsKpiCards aggregate={aggregate} />

      {/* Visual Analytics Chart */}
      <AnalyticsChartCard data={typeComparisonData} />

      {/* Ranked Performance Ledger */}
      <PerformanceLedgerTable
        sortedLedger={sortedLedger}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onOpenDetailDrawer={openDetailDrawer}
        onOpenMetricsModal={openMetricsModal}
      />
    </div>
  );
}

