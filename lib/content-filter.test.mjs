import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_FILTERS, filterContent, hasActiveFilters } from "./content-filter.ts";

const post = (over) => ({
  id: "P1", title: "Launch", copy_text: "", content_type: "Edu", status: "Draft", campaign_id: "",
  assignee_email: "", reviewer_email: "", publish_date: "2026-11-11", is_poster: true, is_video: false,
  channel: "C1", ...over,
});
const items = [
  post({ id: "P1", channel: "C1", status: "Draft", content_type: "Edu" }),
  post({ id: "P2", channel: "C2", status: "In Review", content_type: "Promo", campaign_id: "K1" }),
  post({ id: "P3", channel: "C3", status: "Published", content_type: "Edu", is_video: true }),
  post({ id: "P4", channel: "C1", status: "Archived" }),
];
const helpers = { channelIdOf: (i) => i.channel, inDateRange: () => true, isOverdue: (i) => i.id === "P2", currentEmail: "me@x.com" };
const run = (over, h = helpers) => filterContent(items, { ...EMPTY_FILTERS, ...over }, h).map((i) => i.id);

test("no filters shows everything except archived posts", () => {
  assert.deepEqual(run({}), ["P1", "P2", "P3"]);
});

test("several values in one filter match any of them", () => {
  assert.deepEqual(run({ statuses: ["Draft", "Published"] }), ["P1", "P3"]);
  assert.deepEqual(run({ channelIds: ["C2", "C3"] }), ["P2", "P3"]);
});

test("different filters must all match", () => {
  assert.deepEqual(run({ channelIds: ["C1", "C3"], types: ["Edu"], statuses: ["Published"] }), ["P3"]);
});

test("archived posts appear only when Archived is chosen", () => {
  assert.deepEqual(run({ statuses: ["Archived"] }), ["P4"]);
  assert.deepEqual(run({ statuses: ["Archived", "Draft"] }), ["P1", "P4"]);
});

test("channels match by ID, so same-named accounts on other platforms are not mixed in", () => {
  const sameName = [post({ id: "A", channel: "FB-ABC", account_name: "ABC" }), post({ id: "B", channel: "TT-ABC", account_name: "ABC" })];
  assert.deepEqual(filterContent(sameName, { ...EMPTY_FILTERS, channelIds: ["FB-ABC"] }, helpers).map((i) => i.id), ["A"]);
});

test("campaign, format, my work, overdue, date and search filters", () => {
  assert.deepEqual(run({ campaignIds: ["K1"] }), ["P2"]);
  assert.deepEqual(run({ format: "both" }), ["P3"]);
  assert.deepEqual(run({ format: "poster_only" }), ["P1", "P2"]);
  assert.deepEqual(run({ overdueOnly: true }), ["P2"]);
  assert.deepEqual(run({ search: "p3" }), ["P3"]);
  assert.deepEqual(run({}, { ...helpers, inDateRange: () => false }), []);
  const mine = [post({ id: "M", reviewer_email: "me@x.com" }), post({ id: "N" })];
  assert.deepEqual(filterContent(mine, { ...EMPTY_FILTERS, myWork: true }, helpers).map((i) => i.id), ["M"]);
});

test("hasActiveFilters notices any change from the defaults", () => {
  assert.equal(hasActiveFilters(EMPTY_FILTERS), false);
  assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, types: ["Edu"] }), true);
  assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, search: "  " }), false);
});
