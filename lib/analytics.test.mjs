import assert from "node:assert/strict";
import { test } from "node:test";
import { groupMetrics, missingMetrics, postRates, sortByMetric, summarize, trendBuckets } from "./analytics.ts";

const post = (id, over = {}, insight) => ({
  id, title: `Post ${id}`, status: "Published", publish_date: "2026-11-10", type: "Edu", ...over,
  ...(insight && { insight: { views_impressions: insight[0], engagements: insight[1], clicks: insight[2] } }),
});

test("summarize totals the metrics and works out rates", () => {
  const s = summarize([post("A", {}, [1000, 50, 10]), post("B", {}, [3000, 100, 30])]);
  assert.deepEqual(s, { posts: 2, views: 4000, engagements: 150, clicks: 40, engagementRate: 3.75, ctr: 1 });
  assert.deepEqual(summarize([]), { posts: 0, views: 0, engagements: 0, clicks: 0, engagementRate: 0, ctr: 0 });
});

test("rates are 0, not NaN, when there are no impressions", () => {
  assert.deepEqual(postRates(post("A", {}, [0, 5, 1])), { engagementRate: 0, ctr: 0 });
});

test("groupMetrics groups, totals and sorts by impressions", () => {
  const groups = groupMetrics(
    [post("A", { type: "Edu" }, [100, 10, 1]), post("B", { type: "Promo" }, [500, 5, 5]), post("C", { type: "Edu" }, [100, 30, 3])],
    (p) => p.type
  );
  assert.deepEqual(groups.map((g) => [g.name, g.posts, g.views, g.engagementRate]), [["Promo", 1, 500, 1], ["Edu", 2, 200, 20]]);
});

test("trendBuckets groups by Monday-start week or by month, oldest first", () => {
  const posts = [
    post("A", { publish_date: "2026-11-09" }, [100, 1, 1]), // Monday
    post("B", { publish_date: "2026-11-15" }, [100, 1, 1]), // Sunday, same week
    post("C", { publish_date: "2026-11-16" }, [100, 1, 1]), // next Monday
    post("D", { publish_date: "2026-10-31" }, [100, 1, 1]),
    post("E", { publish_date: "" }, [100, 1, 1]),
  ];
  assert.deepEqual(trendBuckets(posts, "week").map((b) => [b.key, b.posts]), [["2026-10-26", 1], ["2026-11-09", 2], ["2026-11-16", 1]]);
  assert.deepEqual(trendBuckets(posts, "month").map((b) => [b.key, b.posts]), [["2026-10", 1], ["2026-11", 3]]);
});

test("missingMetrics lists published posts without numbers, longest-waiting first", () => {
  const today = "2026-11-12";
  const list = missingMetrics(
    [
      post("logged", {}, [10, 1, 1]),
      post("draft", { status: "Draft" }),
      post("future", { publish_date: "2026-11-20" }),
      post("recent", { publish_date: "2026-11-11" }),
      post("old", { publish_date: "2026-11-01" }),
    ],
    today
  );
  assert.deepEqual(list.map((p) => [p.id, p.daysSince]), [["old", 11], ["recent", 1]]);
});

test("sortByMetric sorts high to low, newest by date, ties by title", () => {
  const posts = [post("A", { publish_date: "2026-11-01" }, [100, 50, 1]), post("B", { publish_date: "2026-11-05" }, [900, 9, 9]), post("C", {}, [100, 50, 1])];
  assert.deepEqual(sortByMetric(posts, "views").map((p) => p.id), ["B", "A", "C"]);
  assert.deepEqual(sortByMetric(posts, "engagementRate").map((p) => p.id), ["A", "C", "B"]);
  assert.deepEqual(sortByMetric(posts, "newest").map((p) => p.id), ["C", "B", "A"]);
});
