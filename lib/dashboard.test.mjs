import assert from "node:assert/strict";
import { test } from "node:test";
import { needsReview, periodDays, periodTarget, statusCounts, workload } from "./dashboard.ts";
import { typeShares } from "./settings-rules.ts";

test("periodDays matches each preset", () => {
  assert.equal(periodDays("all", "2026-02-10"), null);
  assert.equal(periodDays("today", "2026-02-10"), 1);
  assert.equal(periodDays("this-week", "2026-02-10"), 7);
  assert.equal(periodDays("this-month", "2026-02-10"), 28);
  assert.equal(periodDays("this-month", "2028-02-10"), 29);
  assert.equal(periodDays("this-month", "2026-12-31"), 31);
  assert.equal(periodDays("next-7-days", "2026-02-10"), 8);
  assert.equal(periodDays("past-30-days", "2026-02-10"), 31);
});

test("periodDays counts a custom range inclusively and needs both ends", () => {
  assert.equal(periodDays("custom", "2026-02-10", "2026-02-01", "2026-02-14"), 14);
  assert.equal(periodDays("custom", "2026-02-10", "2026-02-28", "2026-03-01"), 2);
  assert.equal(periodDays("custom", "2026-02-10", "2026-02-14", "2026-02-01"), 0);
  assert.equal(periodDays("custom", "2026-02-10", "2026-02-01", ""), null);
  assert.equal(periodDays("custom", "2026-02-10", "", ""), null);
});

test("periodTarget scales a weekly quota and rounds up", () => {
  assert.equal(periodTarget(5, 7), 5);
  assert.equal(periodTarget(5, 1), 1);
  assert.equal(periodTarget(5, 31), 23);
  assert.equal(periodTarget(0, 7), 0);
  assert.equal(periodTarget(-3, 7), 0);
});

test("typeShares gives each type's share of the posts", () => {
  const posts = [{ content_type: "Edu" }, { content_type: "Edu" }, { content_type: "Promo" }, { content_type: "Other" }];
  assert.deepEqual(typeShares(posts, [{ name: "Edu", target_share_pct: 40 }, { name: "Promo" }]), [
    { name: "Edu", count: 2, actualPct: 50, targetPct: 40 },
    { name: "Promo", count: 1, actualPct: 25, targetPct: 0 },
  ]);
  assert.deepEqual(typeShares([], [{ name: "Edu" }]), [{ name: "Edu", count: 0, actualPct: 0, targetPct: 0 }]);
});

test("statusCounts keeps the given order and counts zeros", () => {
  const posts = [{ status: "Draft" }, { status: "Published" }, { status: "Draft" }, { status: "Odd" }];
  assert.deepEqual(statusCounts(posts, ["Draft", "In Review", "Published"]), [
    { status: "Draft", count: 2 },
    { status: "In Review", count: 0 },
    { status: "Published", count: 1 },
  ]);
});

test("needsReview: your own reviews, plus unassigned ones only if you can approve", () => {
  const posts = [
    { id: "a", status: "In Review", reviewer_email: "me@x.test" },
    { id: "b", status: "In Review", reviewer_email: "other@x.test" },
    { id: "c", status: "In Review", reviewer_email: "" },
    { id: "d", status: "Draft", reviewer_email: "me@x.test" },
  ];
  const ids = (list) => list.map((p) => p.id);
  assert.deepEqual(ids(needsReview(posts, { email: "me@x.test", permissions: ["content.approve"] })), ["a", "c"]);
  assert.deepEqual(ids(needsReview(posts, { email: "me@x.test", permissions: ["content.view"] })), ["a"]);
});

test("workload counts unfinished posts and open tasks on those posts, busiest first", () => {
  const posts = [
    { id: "p1", status: "Draft", assignee_email: "a@x.test" },
    { id: "p2", status: "Published", assignee_email: "a@x.test" },
    { id: "p3", status: "In Review", assignee_email: "b@x.test" },
    { id: "p4", status: "Draft", assignee_email: "" },
  ];
  const tasks = [
    { content_id: "p1", status: "open", assignee_email: "b@x.test" },
    { content_id: "p2", status: "in_progress", assignee_email: "b@x.test" },
    { content_id: "p3", status: "done", assignee_email: "a@x.test" },
    { content_id: "elsewhere", status: "open", assignee_email: "a@x.test" },
    { content_id: "p4", status: "open", assignee_email: "c@x.test" },
  ];
  assert.deepEqual(workload(posts, tasks), [
    { email: "b@x.test", posts: 1, tasks: 2 },
    { email: "a@x.test", posts: 1, tasks: 0 },
    { email: "c@x.test", posts: 0, tasks: 1 },
  ]);
});
