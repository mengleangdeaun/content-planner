import assert from "node:assert/strict";
import { test } from "node:test";
import { permissionsForContentUpdate } from "./auth/permissions.ts";
import {
  LIVE_URL_REQUIRED,
  checkContentFields,
  checkStatusChange,
  isOverdue,
  isTaskOverdue,
  nextStatuses,
  taskProgress,
} from "./workflow.ts";

test("a task is overdue only while unfinished and past its date", () => {
  const today = "2026-11-11";
  assert.equal(isTaskOverdue({ due_date: "2026-11-10", status: "open" }, today), true);
  assert.equal(isTaskOverdue({ due_date: "2026-11-10", status: "in_progress" }, today), true);
  assert.equal(isTaskOverdue({ due_date: "2026-11-11", status: "open" }, today), false);
  assert.equal(isTaskOverdue({ due_date: "2026-11-10", status: "done" }, today), false);
  assert.equal(isTaskOverdue({ due_date: "2026-11-10", status: "archived" }, today), false);
  assert.equal(isTaskOverdue({ due_date: "", status: "open" }, today), false);
});

test("task progress counts done work and ignores removed tasks", () => {
  assert.deepEqual(
    taskProgress([{ status: "done" }, { status: "open" }, { status: "in_progress" }, { status: "done" }, { status: "archived" }]),
    { done: 2, total: 4, percent: 50 }
  );
  assert.deepEqual(taskProgress([]), { done: 0, total: 0, percent: 0 });
});

test("adding the live URL while publishing needs only publish rights, but changing it later is an edit", () => {
  assert.deepEqual(permissionsForContentUpdate({ id: "1", status: "Published", live_post_url: "https://a.b" }), ["content.publish"]);
  assert.deepEqual(permissionsForContentUpdate({ id: "1", live_post_url: "https://a.b" }), ["content.edit"]);
});

test("the normal path through the workflow is allowed", () => {
  const path = ["Draft", "In Production", "In Review", "Approved", "Scheduled"];
  for (let i = 0; i < path.length - 1; i++) {
    assert.equal(checkStatusChange(path[i], path[i + 1], ""), null);
  }
  assert.equal(checkStatusChange("Scheduled", "Published", "https://x.com/p"), null);
  assert.equal(checkStatusChange("In Review", "In Revise", ""), null);
});

test("steps cannot be skipped", () => {
  assert.match(checkStatusChange("Draft", "Approved", ""), /cannot move/);
  assert.match(checkStatusChange("In Production", "Scheduled", ""), /cannot move/);
  assert.match(checkStatusChange("In Revise", "Approved", ""), /cannot move/);
  assert.match(checkStatusChange("Published", "Draft", ""), /cannot move/);
});

test("Published needs a live URL, even when the status is unchanged", () => {
  assert.equal(checkStatusChange("Scheduled", "Published", "  "), LIVE_URL_REQUIRED);
  assert.equal(checkStatusChange("Published", "Published", ""), LIVE_URL_REQUIRED);
});

test("an unknown target status is rejected, and a hand-typed current status can recover", () => {
  assert.match(checkStatusChange("Draft", "Nonsense", ""), /cannot move/);
  assert.equal(checkStatusChange("Waiting", "Draft", ""), null);
  assert.match(checkStatusChange("Waiting", "Nonsense", ""), /cannot move/);
  assert.ok(nextStatuses("Waiting").includes("Published"));
});

test("field checks reject script links and malformed values, and allow blanks", () => {
  assert.match(checkContentFields({ live_post_url: "javascript:alert(1)" }), /http/);
  assert.match(checkContentFields({ workspace_file_url: "not a url" }), /http/);
  assert.match(checkContentFields({ due_date: "11/12/2026" }), /YYYY/);
  assert.match(checkContentFields({ publish_time: "25:00" }), /HH:MM/);
  assert.match(checkContentFields({ priority: "Urgent" }), /Priority/);
  assert.equal(
    checkContentFields({ live_post_url: "", workspace_file_url: "https://a.b", due_date: "2026-11-12", publish_time: "09:30", priority: "High" }),
    null
  );
});

test("overdue ignores finished work and items due today", () => {
  const today = "2026-11-11";
  assert.equal(isOverdue({ due_date: "2026-11-10", status: "Draft" }, today), true);
  assert.equal(isOverdue({ due_date: "2026-11-11", status: "Draft" }, today), false);
  assert.equal(isOverdue({ due_date: "2026-11-10", status: "Published" }, today), false);
  assert.equal(isOverdue({ due_date: "", status: "Draft" }, today), false);
});
