"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { NavView } from "@/components/layout/app-sidebar";
import { groupByDay, relativeDayLabel } from "@/lib/workflow";
import { DashboardData } from "../hooks/use-dashboard";
import { DashboardSection, PostRow, SectionLink } from "./dashboard-section";

const dayLabel = (day: string, today: string) =>
  relativeDayLabel(day, today) ?? (day === nextDay(today) ? "Tomorrow" : format(new Date(`${day}T00:00:00`), "EEEE, MMM d"));

function nextDay(today: string): string {
  const date = new Date(`${today}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return format(date, "yyyy-MM-dd");
}

/** Always the coming week, whatever the period filter says. */
export function UpcomingPosts({ data, onNavigate }: { data: DashboardData; onNavigate: (view: NavView) => void }) {
  const days = groupByDay(data.upcoming, (item) => item.publish_date);
  return (
    <DashboardSection
      title="Next 7 days"
      description="Posts going out this coming week"
      action={<SectionLink label="Calendar" onClick={() => onNavigate("calendar")} />}
    >
      {days.length === 0 ? (
        <EmptyState size="sm" icon={<CalendarClock />} title="No posts in the next 7 days" description="Plan something from Content Management." />
      ) : (
        // Rows reach 8px past each side so their text lines up with the headings; the matching padding
        // keeps them inside the scroll area, so there is no sideways scrollbar.
        <div className="-mx-2 max-h-112 space-y-3 overflow-y-auto overscroll-contain px-2">
          {days.map(({ day, entries }) => (
            <section key={day} className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground">
                {dayLabel(day, data.today)}
                <span className="ml-1.5 font-normal">· {entries.length}</span>
              </h3>
              <ul className="-mx-2">
                {entries.map((item) => (
                  <PostRow
                    key={item.id}
                    item={item}
                    meta={[item.status, `${item.platform} ${item.account_name}`, item.publish_time].filter(Boolean).join(" · ")}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
