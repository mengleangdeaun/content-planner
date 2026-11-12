"use client";

import React, { useState } from "react";
import { CircleAlert, CircleCheck, Plus, Send, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import type { NavView } from "@/components/layout/app-sidebar";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { DEFAULT_DASHBOARD_FILTERS, DashboardFilters as Filters, useDashboard } from "../hooks/use-dashboard";
import { DashboardFilters } from "./dashboard-filters";
import { NeedsAttention } from "./needs-attention";
import { UpcomingPosts } from "./upcoming-posts";
import { ChannelTargets } from "./channel-targets";
import { PipelineSummary } from "./pipeline-summary";
import { ContentMix } from "./content-mix";
import { TeamWorkload } from "./team-workload";
import { PerformanceSnapshot } from "./performance-snapshot";

function greeting(name: string, email: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  // An unset name falls back to the email, which reads oddly in a greeting.
  return name && name !== email ? `${part}, ${name.split(" ")[0]}` : part;
}

export function OwnerHubView({ onNavigate }: { onNavigate: (view: NavView) => void }) {
  const { items, channels, tasks, contentTypes, openPostForm } = useWorkspace();
  const { currentUser, can } = useAuth();
  const [filters, setFilters] = useState<Filters>(DEFAULT_DASHBOARD_FILTERS);
  const data = useDashboard({ items, channels, tasks, contentTypes, member: currentUser, filters });
  const { stats } = data;
  const readyPct = stats.planned ? Math.round((stats.ready / stats.planned) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${greeting(currentUser.name, currentUser.email)}. Here's where your content stands.`}
        actions={
          can("content.create") && (
            <Button onClick={() => openPostForm({ mode: "create" })} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              New post
            </Button>
          )
        }
      />

      <DashboardFilters filters={filters} onChange={setFilters} />

      <StatsGrid columns={4}>
        <StatsCard
          label="Planned"
          value={stats.planned}
          icon={<Target />}
          hint={stats.target === null ? data.periodLabel : `Target ${stats.target} · ${data.periodLabel.toLowerCase()}`}
          tone={stats.target !== null && stats.planned < stats.target ? "warning" : "default"}
        />
        <StatsCard label="Ready" value={stats.ready} icon={<CircleCheck />} hint={`${readyPct}% approved or later`} />
        <StatsCard label="Published" value={stats.published} icon={<Send />} />
        <StatsCard
          label="Overdue"
          value={stats.overdue}
          icon={<CircleAlert />}
          tone={stats.overdue > 0 ? "danger" : "default"}
          hint={stats.overdue > 0 ? "Past the due date" : "Nothing late"}
        />
      </StatsGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <NeedsAttention data={data} onNavigate={onNavigate} />
        <UpcomingPosts data={data} onNavigate={onNavigate} />
        <ChannelTargets data={data} onNavigate={onNavigate} />
        <PipelineSummary data={data} onNavigate={onNavigate} />
        <ContentMix data={data} onNavigate={onNavigate} />
        <TeamWorkload data={data} onNavigate={onNavigate} />
      </div>

      {can("metrics.view") && <PerformanceSnapshot data={data} onNavigate={onNavigate} />}
    </div>
  );
}
