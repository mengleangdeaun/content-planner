import assert from "node:assert/strict";
import { test } from "node:test";
import { campaignBreakdown, campaignTiming, filterCampaigns, linkChanges, sortCampaigns } from "./campaign-rules.ts";

test("linkChanges turns a picker change into adds and removes", () => {
  assert.deepEqual(linkChanges(["A", "B"], ["B", "C", "D"]), { add: ["C", "D"], remove: ["A"] });
  assert.deepEqual(linkChanges([], ["A"]), { add: ["A"], remove: [] });
  assert.deepEqual(linkChanges(["A"], ["A"]), { add: [], remove: [] });
});

test("campaignTiming describes where the campaign stands", () => {
  const today = "2026-11-11";
  assert.equal(campaignTiming({}, today), "No dates");
  assert.equal(campaignTiming({ start_date: "2026-11-12", end_date: "2026-12-01" }, today), "Starts tomorrow");
  assert.equal(campaignTiming({ start_date: "2026-11-16" }, today), "Starts in 5 days");
  assert.equal(campaignTiming({ start_date: "2026-11-01", end_date: "2026-11-23" }, today), "12 days left");
  assert.equal(campaignTiming({ start_date: "2026-11-01", end_date: "2026-11-12" }, today), "1 day left");
  assert.equal(campaignTiming({ start_date: "2026-11-01", end_date: "2026-11-11" }, today), "Ends today");
  assert.equal(campaignTiming({ start_date: "2026-10-01", end_date: "2026-11-10" }, today), "Ended");
  assert.equal(campaignTiming({ start_date: "2026-11-01" }, today), "Running");
  assert.equal(campaignTiming({ end_date: "2026-11-10" }, today), "Ended");
});

test("campaignBreakdown groups posts by stage and ignores archived ones", () => {
  const counts = campaignBreakdown([
    { status: "Published" },
    { status: "Scheduled" },
    { status: "Approved" },
    { status: "In Review" },
    { status: "Draft" },
    { status: "Archived" },
  ]).map((b) => [b.key, b.count, Math.round(b.percent)]);
  assert.deepEqual(counts, [
    ["published", 1, 20],
    ["ready", 2, 40],
    ["review", 1, 20],
    ["progress", 1, 20],
  ]);
  assert.ok(campaignBreakdown([]).every((b) => b.count === 0 && b.percent === 0));
});

const campaigns = [
  { name: "Water Festival", goal: "Boost sales", status: "Active", start_date: "2026-11-18", end_date: "2026-12-02" },
  { name: "Black Friday", goal: "", status: "Planned", start_date: "2026-11-25", end_date: "2026-11-28" },
  { name: "Anniversary", goal: "Brand love", status: "Completed", start_date: "", end_date: "" },
];

test("filterCampaigns by status and by name or goal", () => {
  assert.deepEqual(filterCampaigns(campaigns, { search: "", statuses: ["Active", "Planned"] }).map((c) => c.name), ["Water Festival", "Black Friday"]);
  assert.deepEqual(filterCampaigns(campaigns, { search: "brand", statuses: [] }).map((c) => c.name), ["Anniversary"]);
  assert.equal(filterCampaigns(campaigns, { search: "", statuses: [] }).length, 3);
});

test("sortCampaigns by start, end or name, with blank dates last", () => {
  assert.deepEqual(sortCampaigns(campaigns, "start").map((c) => c.name), ["Water Festival", "Black Friday", "Anniversary"]);
  assert.deepEqual(sortCampaigns(campaigns, "end").map((c) => c.name), ["Black Friday", "Water Festival", "Anniversary"]);
  assert.deepEqual(sortCampaigns(campaigns, "name").map((c) => c.name), ["Anniversary", "Black Friday", "Water Festival"]);
});
