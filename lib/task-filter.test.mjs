import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_TASK_FILTERS, filterTasks, hasActiveTaskFilters, sortTasks } from "./task-filter.ts";

const row = (id, task, post = {}) => ({
  id,
  channel: post.channel ?? "C1",
  task: { title: `Task ${id}`, status: "open", assignee_email: "", due_date: "", created_at: "", ...task },
  post: { title: `Post ${id}`, publish_date: "2026-11-20", ...post },
});
const rows = [
  row("A", { status: "open", assignee_email: "me@x.com", due_date: "2026-11-10" }, { channel: "C1" }),
  row("B", { status: "in_progress", assignee_email: "you@x.com" }, { channel: "C2" }),
  row("C", { status: "done", due_date: "2026-11-01" }, { channel: "C1" }),
];
const helpers = { channelIdOf: (r) => r.channel, today: "2026-11-11", currentEmail: "me@x.com" };
const run = (over) => filterTasks(rows, { ...EMPTY_TASK_FILTERS, ...over }, helpers).map((r) => r.id);

test("no filters keeps every task", () => {
  assert.deepEqual(run({}), ["A", "B", "C"]);
});

test("several values in one filter match any of them", () => {
  assert.deepEqual(run({ statuses: ["open", "done"] }), ["A", "C"]);
  assert.deepEqual(run({ assignees: ["me@x.com", "you@x.com"] }), ["A", "B"]);
});

test("Unassigned matches tasks with no assignee", () => {
  assert.deepEqual(run({ assignees: ["none"] }), ["C"]);
  assert.deepEqual(run({ assignees: ["none", "you@x.com"] }), ["B", "C"]);
});

test("channel, my tasks, overdue and search", () => {
  assert.deepEqual(run({ channelIds: ["C2"] }), ["B"]);
  assert.deepEqual(run({ myTasks: true }), ["A"]);
  assert.deepEqual(run({ overdueOnly: true }), ["A"]); // C is past due but done.
  assert.deepEqual(run({ search: "post b" }), ["B"]);
  assert.deepEqual(run({ search: "task c" }), ["C"]);
});

test("hasActiveTaskFilters", () => {
  assert.equal(hasActiveTaskFilters(EMPTY_TASK_FILTERS), false);
  assert.equal(hasActiveTaskFilters({ ...EMPTY_TASK_FILTERS, channelIds: ["C1"] }), true);
});

test("due sort puts unfinished first, then soonest due, with no due date last", () => {
  const list = [
    row("late", { due_date: "2026-11-20" }),
    row("none", { due_date: "" }),
    row("soon", { due_date: "2026-11-12" }),
    row("done", { status: "done", due_date: "2026-11-01" }),
  ];
  assert.deepEqual(sortTasks(list, "due").map((r) => r.id), ["soon", "late", "none", "done"]);
});

test("newest and post-date sorts", () => {
  const list = [
    row("old", { created_at: "2026-11-01T00:00:00Z" }, { publish_date: "2026-11-30" }),
    row("new", { created_at: "2026-11-09T00:00:00Z" }, { publish_date: "2026-11-15" }),
    row("blank", { created_at: "" }, { publish_date: "" }),
  ];
  assert.deepEqual(sortTasks(list, "newest").map((r) => r.id), ["new", "old", "blank"]);
  assert.deepEqual(sortTasks(list, "post").map((r) => r.id), ["new", "old", "blank"]);
});

test("sorting does not change the original list", () => {
  const list = [row("b", { due_date: "2026-11-20" }), row("a", { due_date: "2026-11-12" })];
  sortTasks(list, "due");
  assert.deepEqual(list.map((r) => r.id), ["b", "a"]);
});
