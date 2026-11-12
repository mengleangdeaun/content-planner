import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SheetError,
  cellToString,
  columnLetter,
  createQueue,
  errorStatus,
  latestById,
  missingColumns,
  parseBool,
  parseNumber,
  pickFields,
  recordToCells,
  rowToRecord,
  withRetry,
} from "./core.ts";

const noWait = async () => {};

test("columnLetter handles columns past Z", () => {
  assert.equal(columnLetter(0), "A");
  assert.equal(columnLetter(25), "Z");
  assert.equal(columnLetter(26), "AA");
  assert.equal(columnLetter(51), "AZ");
  assert.equal(columnLetter(52), "BA");
});

test("rows map by header name, whatever the column order", () => {
  const record = rowToRecord(["title", "id", ""], ["Hello", "POST-1", "ignored"]);
  assert.deepEqual(record, { title: "Hello", id: "POST-1" });
});

test("short rows read missing trailing cells as empty", () => {
  assert.deepEqual(rowToRecord(["id", "notes"], ["A"]), { id: "A", notes: "" });
});

test("records write in header order and keep native types", () => {
  const cells = recordToCells(["id", "views", "is_video", "notes"], {
    views: 5,
    id: "A",
    is_video: false,
  });
  assert.deepEqual(cells, ["A", 5, false, ""]);
});

test("missingColumns reports only defined fields without a column", () => {
  assert.deepEqual(missingColumns(["id"], { id: "A", brand: "x", skip: undefined }), ["brand"]);
});

test("booleans match how Sheets displays them", () => {
  assert.equal(cellToString(true), "TRUE");
  assert.equal(parseBool("TRUE"), true);
  assert.equal(parseBool("yes"), true);
  assert.equal(parseBool("FALSE"), false);
  assert.equal(parseBool(""), false);
});

test("parseNumber reads formatted numbers", () => {
  assert.equal(parseNumber("12,500"), 12500);
  assert.equal(parseNumber(""), 0);
  assert.equal(parseNumber("abc"), 0);
});

test("parseNumber also takes numbers and blanks not yet written to the sheet", () => {
  assert.equal(parseNumber(25), 25);
  assert.equal(parseNumber(undefined), 0);
  assert.equal(parseNumber(null), 0);
});

test("pickFields drops anything not allowed", () => {
  assert.deepEqual(pickFields({ title: "x", id: "evil", insight: {} }, ["title"]), { title: "x" });
});

test("latestById prefers the newest snapshot over legacy rows", () => {
  const latest = latestById([
    { id: "A", views: "3", captured_at: "2026-02-01T00:00:00Z" },
    { id: "A", views: "1", captured_at: "" },
    { id: "A", views: "2", captured_at: "2026-01-01T00:00:00Z" },
  ]);
  assert.equal(latest.get("A").views, "3");
});

test("latestById compares plain dates with full timestamps by day", () => {
  const latest = latestById([
    { id: "A", views: "old", captured_at: "2026-11-10T09:00:00.000Z" },
    { id: "A", views: "backdated", captured_at: "2026-11-05" },
    { id: "B", views: "first", captured_at: "2026-11-12T08:00:00.000Z" },
    { id: "B", views: "same day, later row", captured_at: "2026-11-12" },
  ]);
  assert.equal(latest.get("A").views, "old"); // A backdated count does not replace newer figures.
  assert.equal(latest.get("B").views, "same day, later row");
});

test("withRetry retries 429 then succeeds", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    if (++calls < 3) throw Object.assign(new Error("slow down"), { status: 429 });
    return "ok";
  }, noWait);
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("withRetry does not retry other errors", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => {
      calls++;
      throw Object.assign(new Error("bad"), { status: 400 });
    }, noWait)
  );
  assert.equal(calls, 1);
});

test("withRetry gives up after the limit", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls++;
        throw Object.assign(new Error("slow down"), { status: 429 });
      },
      noWait,
      2
    )
  );
  assert.equal(calls, 3);
});

test("queue runs one task at a time, in order", async () => {
  const enqueue = createQueue();
  const log = [];
  const slow = enqueue(async () => {
    log.push("a-start");
    await new Promise((resolve) => setTimeout(resolve, 10));
    log.push("a-end");
  });
  const fast = enqueue(async () => log.push("b"));
  await Promise.all([slow, fast]);
  assert.deepEqual(log, ["a-start", "a-end", "b"]);
});

test("queue keeps going after a failed task", async () => {
  const enqueue = createQueue();
  await assert.rejects(enqueue(async () => { throw new Error("boom"); }));
  assert.equal(await enqueue(async () => "next"), "next");
});

test("errorStatus uses the SheetError status, otherwise 500", () => {
  assert.equal(errorStatus(new SheetError("conflict", 409)), 409);
  assert.equal(errorStatus(new Error("x")), 500);
});
