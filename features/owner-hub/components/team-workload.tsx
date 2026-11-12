"use client";

import React from "react";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PersonAvatar } from "@/components/shared/person-avatar";
import type { NavView } from "@/components/layout/app-sidebar";
import { useWorkspace } from "@/context/workspace-context";
import { DashboardData } from "../hooks/use-dashboard";
import { DashboardSection, MeterBar, SectionLink } from "./dashboard-section";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Unfinished posts in the period and open tasks on them, per person. Busiest first. */
export function TeamWorkload({ data, onNavigate }: { data: DashboardData; onNavigate: (view: NavView) => void }) {
  const { people } = useWorkspace();
  const max = Math.max(1, ...data.workload.map((w) => w.posts + w.tasks));
  return (
    <DashboardSection
      title="Team workload"
      description={`Unfinished posts and open tasks · ${data.periodLabel}`}
      action={<SectionLink label="Tasks" onClick={() => onNavigate("tasks")} />}
    >
      {data.workload.length === 0 ? (
        <EmptyState size="sm" icon={<Users />} title="Nobody has open work" description="Assign posts or tasks to see the load per person." />
      ) : (
        <ul className="max-h-88 space-y-3 overflow-y-auto overscroll-contain">
          {data.workload.map((w) => {
            const person = people.find((p) => p.email === w.email);
            const name = person?.name || w.email;
            return (
              <li key={w.email} className="flex items-center gap-3">
                <PersonAvatar name={name} avatarUrl={person?.avatar_url} size="sm" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {plural(w.posts, "post")} · {plural(w.tasks, "task")}
                    </span>
                  </div>
                  <MeterBar percent={((w.posts + w.tasks) / max) * 100} label={`${name}: ${w.posts + w.tasks} open items`} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
