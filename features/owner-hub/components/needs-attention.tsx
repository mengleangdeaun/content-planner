"use client";

import React from "react";
import { CircleCheck } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { NavView } from "@/components/layout/app-sidebar";
import { formatShortDate } from "@/lib/date-utils";
import { TaskItem } from "@/features/planning/components/task-list";
import { DashboardData } from "../hooks/use-dashboard";
import { DashboardSection, PostRow, SectionLink } from "./dashboard-section";

const LIMIT = 5;

function Group({
  title,
  count,
  tone,
  more,
  children,
}: {
  title: string;
  count: number;
  tone?: "danger";
  more?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="space-y-1.5">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {title}
        <span
          className={
            tone === "danger"
              ? "rounded-full bg-destructive/10 px-1.5 text-destructive"
              : "rounded-full bg-muted px-1.5 text-foreground"
          }
        >
          {count}
        </span>
      </h3>
      {children}
      {count > LIMIT && more}
    </section>
  );
}

/** What to act on today: ignores the period, respects the channel filter. */
export function NeedsAttention({ data, onNavigate }: { data: DashboardData; onNavigate: (view: NavView) => void }) {
  const { overdue, review, myTasks } = data.attention;
  const total = overdue.length + review.length + myTasks.length;
  const moreLink = (count: number, view: NavView) => (
    <SectionLink label={`${count - LIMIT} more`} onClick={() => onNavigate(view)} />
  );

  return (
    <DashboardSection title="Needs attention" description="Overdue work, your reviews and your tasks, as of today">
      {total === 0 ? (
        <EmptyState size="sm" icon={<CircleCheck />} title="You're all caught up" description="Nothing is overdue or waiting on you." />
      ) : (
        <div className="space-y-4">
          <Group title="Overdue" count={overdue.length} tone="danger" more={moreLink(overdue.length, "pipeline")}>
            <ul className="-mx-2">
              {overdue.slice(0, LIMIT).map((item) => (
                <PostRow
                  key={item.id}
                  item={item}
                  meta={`Due ${formatShortDate(item.due_date)} · ${item.status} · ${item.platform} ${item.account_name}`}
                />
              ))}
            </ul>
          </Group>
          <Group title="Waiting for your review" count={review.length} more={moreLink(review.length, "pipeline")}>
            <ul className="-mx-2">
              {review.slice(0, LIMIT).map((item) => (
                <PostRow key={item.id} item={item} />
              ))}
            </ul>
          </Group>
          <Group title="Your open tasks" count={myTasks.length} more={moreLink(myTasks.length, "tasks")}>
            <ul className="space-y-2">
              {myTasks.slice(0, LIMIT).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
          </Group>
        </div>
      )}
    </DashboardSection>
  );
}
