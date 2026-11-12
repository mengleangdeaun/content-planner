import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPage, pageCount, pageSlice, pageWindow } from "./pagination.ts";

test("page count is at least one, even for an empty list", () => {
  assert.equal(pageCount(0, 25), 1);
  assert.equal(pageCount(25, 25), 1);
  assert.equal(pageCount(26, 25), 2);
});

test("clampPage keeps the page inside the list when it shrinks", () => {
  assert.equal(clampPage(5, 30, 25), 2);
  assert.equal(clampPage(0, 30, 25), 1);
  assert.equal(clampPage(2, 0, 25), 1);
});

test("pageWindow shows every page when there are few", () => {
  assert.deepEqual(pageWindow(1, 1), [1]);
  assert.deepEqual(pageWindow(2, 4), [1, 2, 3, 4]);
});

test("pageWindow uses ellipses at the start, middle and end", () => {
  assert.deepEqual(pageWindow(1, 10), [1, 2, "…", 10]);
  assert.deepEqual(pageWindow(5, 10), [1, "…", 4, 5, 6, "…", 10]);
  assert.deepEqual(pageWindow(10, 10), [1, "…", 9, 10]);
});

test("a one-page gap shows the page rather than an ellipsis", () => {
  assert.deepEqual(pageWindow(4, 10), [1, 2, 3, 4, 5, "…", 10]);
});

test("pageSlice returns the rows for a page, clamped", () => {
  const rows = Array.from({ length: 12 }, (_, i) => i + 1);
  assert.deepEqual(pageSlice(rows, 2, 5), [6, 7, 8, 9, 10]);
  assert.deepEqual(pageSlice(rows, 9, 5), [11, 12]);
});
