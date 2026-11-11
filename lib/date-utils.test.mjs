import assert from "node:assert/strict";
import { test } from "node:test";
import { isDateInFilter } from "./date-utils.ts";

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

test("today uses the real current date by default", () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  assert.equal(isDateInFilter(iso(now), "today"), true);
  assert.equal(isDateInFilter(iso(yesterday), "today"), false);
});

test("this-week runs Monday to Sunday around the reference date", () => {
  const wednesday = new Date(2026, 10, 11);

  assert.equal(isDateInFilter("2026-11-09", "this-week", "", "", wednesday), true);
  assert.equal(isDateInFilter("2026-11-15", "this-week", "", "", wednesday), true);
  assert.equal(isDateInFilter("2026-11-08", "this-week", "", "", wednesday), false);
  assert.equal(isDateInFilter("2026-11-16", "this-week", "", "", wednesday), false);
});

test("custom range includes both end dates", () => {
  assert.equal(isDateInFilter("2026-01-01", "custom", "2026-01-01", "2026-01-31"), true);
  assert.equal(isDateInFilter("2026-01-31", "custom", "2026-01-01", "2026-01-31"), true);
  assert.equal(isDateInFilter("2026-02-01", "custom", "2026-01-01", "2026-01-31"), false);
});
