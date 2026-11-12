import assert from "node:assert/strict";
import { test } from "node:test";
import { checkInsight } from "./metrics-rules.ts";

const today = "2026-11-12";
const ok = { views_impressions: 1200, engagements: "45", clicks: 0 };

test("whole numbers of 0 or more pass, as numbers or digit strings", () => {
  assert.equal(checkInsight(ok, today), null);
  assert.equal(checkInsight({ ...ok, reach: "900", comments: 3, shares: "", saves: undefined }, today), null);
});

test("required counts reject negatives, decimals, text and blanks", () => {
  for (const bad of [-1, 1.5, "abc", "", undefined, null, true, "1e3x"]) {
    assert.match(checkInsight({ ...ok, clicks: bad }, today), /whole numbers/, String(bad));
  }
});

test("optional counts may be blank but not invalid", () => {
  assert.match(checkInsight({ ...ok, saves: -2 }, today), /Reach, comments/);
  assert.match(checkInsight({ ...ok, reach: "lots" }, today), /Reach, comments/);
});

test("counted-on date must be a real past or present date", () => {
  assert.equal(checkInsight({ ...ok, captured_at: "2026-11-05" }, today), null);
  assert.equal(checkInsight({ ...ok, captured_at: today }, today), null);
  assert.match(checkInsight({ ...ok, captured_at: "2026-11-13" }, today), /future/);
  assert.match(checkInsight({ ...ok, captured_at: "12/11/2026" }, today), /YYYY-MM-DD/);
  assert.match(checkInsight({ ...ok, captured_at: 20261105 }, today), /YYYY-MM-DD/);
});
