"use client";

import React from "react";
import { useWorkspace } from "@/context/workspace-context";
import { useOwnerHubMetrics } from "../hooks/use-owner-hub-metrics";
import { OwnerHubToolbar } from "./owner-hub-toolbar";
import { StrategicKpiCards } from "./strategic-kpi-cards";
import { OwnerContentLedger } from "./owner-content-ledger";

export function OwnerHubView() {
  const { items, channels, openDetailDrawer, onStatusChange } = useWorkspace();
  const metrics = useOwnerHubMetrics(items, channels);

  return (
    <div className="space-y-6">
      <OwnerHubToolbar metrics={metrics} channels={channels} />
      <StrategicKpiCards metrics={metrics} />
      <OwnerContentLedger
        metrics={metrics}
        onOpenDetailDrawer={openDetailDrawer}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

