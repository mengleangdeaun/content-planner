"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Circle, ListChecks, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT, Field, FormActions, FormError } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { DataPagination } from "@/components/shared/data-pagination";
import { FilterBar, FilterField, listChips } from "@/components/shared/filter-bar";
import { NoData, NoResults } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchableMultiSelect } from "@/components/shared/searchable-multi-select";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { PersonPicker } from "@/features/team/components/person-picker";
import { resolveChannelId } from "@/lib/auth/permissions";
import { clampPage, pageSlice } from "@/lib/pagination";
import {
  EMPTY_TASK_FILTERS,
  TASK_SORTS,
  TaskFilters,
  TaskSort,
  UNASSIGNED,
  filterTasks,
  hasActiveTaskFilters,
  sortTasks,
} from "@/lib/task-filter";
import { TASK_STATUSES, isTaskOverdue } from "@/lib/workflow";
import { TaskList } from "./task-list";

const LIST_KEYS = ["statuses", "assignees", "channelIds"] as const;
type ListKey = (typeof LIST_KEYS)[number];
const LIST_LABELS: Record<ListKey, string> = { statuses: "Statuses", assignees: "Assignees", channelIds: "Channels" };

const STATUS_CARDS = [
  { value: "open", label: "To Do", icon: <Circle /> },
  { value: "in_progress", label: "In Progress", icon: <Timer /> },
  { value: "done", label: "Done", icon: <CheckCircle2 /> },
];

export function TasksView() {
  const { tasks, items, channels, people } = useWorkspace();
  const { can, currentUser } = useAuth();
  const [filters, setAllFilters] = useState<TaskFilters>(EMPTY_TASK_FILTERS);
  const [sort, setSort] = useState<TaskSort>("due");
  const [isAdding, setIsAdding] = useState(false);
  const setFilters = (patch: Partial<TaskFilters>) => setAllFilters((current) => ({ ...current, ...patch }));

  const today = format(new Date(), "yyyy-MM-dd");

  // Tasks on archived posts are finished business, so they drop out of the counts too.
  const rows = useMemo(
    () =>
      tasks.flatMap((task) => {
        const post = items.find((item) => item.id === task.content_id);
        return post && post.status !== "Archived" ? [{ task, post }] : [];
      }),
    [tasks, items]
  );

  const visible = useMemo(
    () =>
      sortTasks(
        filterTasks(rows, filters, {
          channelIdOf: (row) => resolveChannelId(row.post, channels),
          today,
          currentEmail: currentUser.email,
        }),
        sort
      ),
    [rows, filters, sort, channels, today, currentUser.email]
  );

  // The page belongs to one set of filters and one sort: any change starts again at page 1.
  const listKey = JSON.stringify([filters, sort]);
  const [paging, setPaging] = useState({ key: listKey, page: 1, size: 25 });
  const page = paging.key === listKey ? clampPage(paging.page, visible.length, paging.size) : 1;

  const all = rows.map((row) => row.task);
  const overdueCount = all.filter((t) => isTaskOverdue(t, today)).length;
  const filtersActive = hasActiveTaskFilters(filters);
  const listOptions: Record<ListKey, { value: string; label: string }[]> = {
    statuses: [...TASK_STATUSES],
    assignees: [{ value: UNASSIGNED, label: "Unassigned" }, ...people.map((p) => ({ value: p.email, label: p.name }))],
    channelIds: channels.map((c) => ({ value: c.id, label: `${c.platform} — ${c.account_name}` })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Track the work behind every post, across all channels."
        actions={
          can("tasks.manage") && (
            <Button onClick={() => setIsAdding(true)} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          )
        }
      />

      {/* Each card is a shortcut for a filter; clicking the active card again clears it. */}
      <StatsGrid columns={4}>
        {STATUS_CARDS.map((card) => {
          const active = filters.statuses.length === 1 && filters.statuses[0] === card.value && !filters.overdueOnly;
          return (
            <StatsCard
              key={card.value}
              label={card.label}
              value={all.filter((t) => t.status === card.value).length}
              icon={card.icon}
              active={active}
              onClick={() => setFilters({ statuses: active ? [] : [card.value], overdueOnly: false })}
            />
          );
        })}
        <StatsCard
          label="Overdue"
          value={overdueCount}
          icon={<AlertTriangle />}
          tone={overdueCount > 0 ? "danger" : "default"}
          active={filters.overdueOnly}
          onClick={() => setFilters({ overdueOnly: !filters.overdueOnly, statuses: [] })}
        />
      </StatsGrid>

      <FilterBar
        search={filters.search}
        onSearchChange={(search) => setFilters({ search })}
        searchPlaceholder="Search tasks or posts..."
        toggles={[
          { label: "My tasks", pressed: filters.myTasks, onToggle: () => setFilters({ myTasks: !filters.myTasks }) },
          { label: "Overdue", pressed: filters.overdueOnly, onToggle: () => setFilters({ overdueOnly: !filters.overdueOnly }) },
        ]}
        chips={listChips(LIST_KEYS, filters, listOptions, LIST_LABELS, (key) => setFilters({ [key]: [] }))}
        onClearPanel={() => setFilters({ statuses: [], assignees: [], channelIds: [] })}
        hasActiveFilters={filtersActive}
        onReset={() => setAllFilters(EMPTY_TASK_FILTERS)}
        panel={LIST_KEYS.map((key) => (
          <FilterField key={key} label={LIST_LABELS[key]}>
            <SearchableMultiSelect
              label={LIST_LABELS[key]}
              value={filters[key]}
              onValueChange={(value) => setFilters({ [key]: value })}
              options={listOptions[key]}
            />
          </FilterField>
        ))}
        trailing={
          <div className="w-48">
            <ResponsiveSelect
              aria-label="Sort tasks"
              value={sort}
              onValueChange={(value) => setSort(value as TaskSort)}
              className="h-10 w-full md:h-8"
              options={TASK_SORTS.map((s) => ({ value: s.value, label: `Sort: ${s.label}` }))}
            />
          </div>
        }
      />

      <div className="space-y-4">
        <TaskList
          rows={pageSlice(visible, page, paging.size)}
          empty={
            rows.length > 0 || filtersActive ? (
              <NoResults onClear={() => setAllFilters(EMPTY_TASK_FILTERS)} />
            ) : (
              <NoData
                icon={<ListChecks />}
                title="No tasks yet"
                description="Break a post into tasks to track the work behind it."
                action={
                  can("tasks.manage") && (
                    <Button onClick={() => setIsAdding(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> New task
                    </Button>
                  )
                }
              />
            )
          }
        />
        <DataPagination
          page={page}
          pageSize={paging.size}
          total={visible.length}
          onPageChange={(next) => setPaging({ ...paging, key: listKey, page: next })}
          onPageSizeChange={(size) => setPaging({ key: listKey, page: 1, size })}
        />
      </div>

      {isAdding && <NewTaskDialog onClose={() => setIsAdding(false)} />}
    </div>
  );
}

function NewTaskDialog({ onClose }: { onClose: () => void }) {
  const { items, onAddTask, showToast } = useWorkspace();
  const posts = items.filter((item) => item.status !== "Archived" && item.status !== "Published");
  const [contentId, setContentId] = useState(posts[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!contentId) return setError("Choose a post for this task.");
    try {
      setIsSaving(true);
      await onAddTask({ content_id: contentId, title, assignee_email: assignee, due_date: dueDate });
      showToast("Task added");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title="New task"
      description="Add a piece of work to a post."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" form="task-form" disabled={isSaving}>{isSaving ? "Saving..." : "Add task"}</Button>
          </FormActions>
        </div>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-3">
        <Field label="Task" htmlFor="task-title" required>
          <Input
            id="task-title"
            className={CONTROL_HEIGHT}
            placeholder="e.g. Design poster"
            value={title}
            autoCapitalize="sentences"
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Field>
        <Field label="Post" htmlFor="task-post" required>
          <SearchableSelect
            id="task-post"
            value={contentId}
            onValueChange={setContentId}
            placeholder="Select a post"
            searchPlaceholder="Search posts..."
            options={posts.map((p) => ({ value: p.id, label: `${p.title} · ${p.account_name}` }))}
          />
        </Field>
        <Field label="Assignee" htmlFor="task-assignee">
          <PersonPicker id="task-assignee" value={assignee} onChange={setAssignee} />
        </Field>
        <Field label="Due date" htmlFor="task-due">
          <ResponsiveDatePicker id="task-due" value={dueDate} onChange={setDueDate} placeholder="No due date" />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
