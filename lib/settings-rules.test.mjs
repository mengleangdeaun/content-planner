import assert from "node:assert/strict";
import { test } from "node:test";
import {
  channelHealth,
  checkChannel,
  checkContentType,
  checkSnapshot,
  followerTrend,
  formatFlags,
  typeMix,
} from "./settings-rules.ts";

test("content type names must be present and unique, ignoring case and spaces", () => {
  assert.match(checkContentType({ name: "  " }, []), /required/);
  assert.match(checkContentType({ name: "promotional " }, [{ name: "Promotional" }]), /already exists/);
  assert.equal(checkContentType({ name: "Promotional" }, [{ name: "Educational" }]), null);
});

test("content type colors, targets and formats are checked", () => {
  assert.match(checkContentType({ name: "A", badge_color: "neon" }, []), /color/);
  assert.match(checkContentType({ name: "A", target_share_pct: 120 }, []), /between 0 and 100/);
  assert.match(checkContentType({ name: "A", target_share_pct: "abc" }, []), /between 0 and 100/);
  assert.match(checkContentType({ name: "A", default_format: "gif" }, []), /format/);
  assert.equal(checkContentType({ name: "A", badge_color: "teal", target_share_pct: "40", default_format: "both" }, []), null);
  assert.equal(checkContentType({ name: "A", target_share_pct: "" }, []), null);
});

test("default formats map to poster and video flags", () => {
  assert.deepEqual(formatFlags("video"), { poster: false, video: true });
  assert.deepEqual(formatFlags("both"), { poster: true, video: true });
  assert.equal(formatFlags(""), null);
});

test("channels reject script links and silly quotas", () => {
  const ok = { platform: "Facebook", account_name: "ABC", weekly_target_quota: 3, status: "Active" };
  assert.equal(checkChannel(ok), null);
  assert.match(checkChannel({ ...ok, page_url: "javascript:alert(1)" }), /http/);
  assert.match(checkChannel({ ...ok, avatar_url: "data:image/png;base64,x" }), /http/);
  assert.match(checkChannel({ ...ok, weekly_target_quota: 0 }), /1 to 50/);
  assert.match(checkChannel({ ...ok, weekly_target_quota: 2.5 }), /1 to 50/);
  assert.match(checkChannel({ ...ok, account_name: " " }), /required/);
  assert.match(checkChannel({ ...ok, status: "Gone" }), /status/);
});

test("follower snapshots need a whole number and a valid date", () => {
  assert.equal(checkSnapshot({ followers: "1200", captured_at: "2026-11-11" }), null);
  assert.equal(checkSnapshot({ followers: 0 }), null);
  assert.match(checkSnapshot({ followers: -1 }), /whole number/);
  assert.match(checkSnapshot({ followers: "" }), /whole number/);
  assert.match(checkSnapshot({ followers: 1.5 }), /whole number/);
  assert.match(checkSnapshot({ followers: 5, captured_at: "11/11/2026" }), /YYYY/);
});

test("channel health counts this Monday-to-Sunday week and the last published post", () => {
  // 2026-11-11 is a Wednesday, so the week is 2026-11-09 to 2026-11-15.
  const posts = [
    { publish_date: "2026-11-09", status: "Draft" },
    { publish_date: "2026-11-15", status: "Scheduled" },
    { publish_date: "2026-11-16", status: "Draft" },
    { publish_date: "2026-11-08", status: "Published" },
    { publish_date: "2026-11-12", status: "Archived" },
    { publish_date: "2026-11-20", status: "Published" },
  ];
  const health = channelHealth({ status: "Active", weekly_target_quota: 3 }, posts, "2026-11-11");
  assert.equal(health.planned, 2);
  assert.equal(health.state, "behind");
  assert.equal(health.daysSinceLastPost, 3);
  assert.equal(channelHealth({ status: "Active", weekly_target_quota: 2 }, posts, "2026-11-11").state, "on-track");
  assert.equal(channelHealth({ status: "Paused", weekly_target_quota: 9 }, posts, "2026-11-11").state, "paused");
  assert.equal(channelHealth({ status: "Active", weekly_target_quota: 1 }, [], "2026-11-11").daysSinceLastPost, null);
});

test("Sunday belongs to the week that started the Monday before", () => {
  const health = channelHealth({ status: "Active", weekly_target_quota: 1 }, [{ publish_date: "2026-11-09", status: "Draft" }], "2026-11-15");
  assert.equal(health.planned, 1);
});

test("follower trend compares the two newest snapshots", () => {
  const trend = followerTrend([
    { captured_at: "2026-11-01", followers: "1000" },
    { captured_at: "2026-11-10", followers: "1250" },
    { captured_at: "2026-11-05", followers: "1100" },
  ]);
  assert.equal(trend.latest, 1250);
  assert.equal(trend.change, 150);
  assert.deepEqual(followerTrend([]), { latest: null, change: null, history: [] });
});

test("type mix shares are of this month's live posts", () => {
  const posts = [
    { content_type: "Edu", publish_date: "2026-11-02", status: "Draft" },
    { content_type: "Edu", publish_date: "2026-11-03", status: "Published" },
    { content_type: "Promo", publish_date: "2026-11-04", status: "Draft" },
    { content_type: "Promo", publish_date: "2026-11-05", status: "Archived" },
    { content_type: "Promo", publish_date: "2026-10-30", status: "Draft" },
  ];
  const mix = typeMix(posts, [{ name: "Edu", target_share_pct: 60 }, { name: "Promo" }], "2026-11");
  assert.deepEqual(mix, [
    { name: "Edu", count: 2, actualPct: 67, targetPct: 60 },
    { name: "Promo", count: 1, actualPct: 33, targetPct: 0 },
  ]);
});
