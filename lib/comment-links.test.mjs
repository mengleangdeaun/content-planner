import assert from "node:assert/strict";
import { test } from "node:test";
import { linkOverSelection, parseComment, safeHttpUrl, shortUrl } from "./comment-links.ts";

test("plain text stays one text segment", () => {
  assert.deepEqual(parseComment("Looks good, ship it."), [{ type: "text", text: "Looks good, ship it." }]);
  assert.deepEqual(parseComment(""), []);
});

test("bare links become link segments, keeping the text around them", () => {
  assert.deepEqual(parseComment("Poster: https://drive.google.com/file/d/1A please check"), [
    { type: "text", text: "Poster: " },
    { type: "link", url: "https://drive.google.com/file/d/1A" },
    { type: "text", text: " please check" },
  ]);
});

test("sentence punctuation and unmatched brackets stay outside the link", () => {
  assert.deepEqual(parseComment("See https://x.com/a."), [
    { type: "text", text: "See " },
    { type: "link", url: "https://x.com/a" },
    { type: "text", text: "." },
  ]);
  assert.deepEqual(parseComment("(see https://x.com/a)"), [
    { type: "text", text: "(see " },
    { type: "link", url: "https://x.com/a" },
    { type: "text", text: ")" },
  ]);
  // Balanced brackets belong to the URL.
  assert.deepEqual(parseComment("https://en.wikipedia.org/wiki/Foo_(bar)"), [
    { type: "link", url: "https://en.wikipedia.org/wiki/Foo_(bar)" },
  ]);
});

test("named links keep their label", () => {
  assert.deepEqual(parseComment("Here is the [final poster](https://canva.com/d/9) for review"), [
    { type: "text", text: "Here is the " },
    { type: "link", url: "https://canva.com/d/9", label: "final poster" },
    { type: "text", text: " for review" },
  ]);
});

test("two links in one comment, and brackets that are not links", () => {
  assert.deepEqual(parseComment("[a](http://a.test) and [not a link] and https://b.test"), [
    { type: "link", url: "http://a.test", label: "a" },
    { type: "text", text: " and [not a link] and " },
    { type: "link", url: "https://b.test" },
  ]);
});

test("only http and https become links", () => {
  assert.deepEqual(parseComment("[click](javascript:alert(1))"), [{ type: "text", text: "[click](javascript:alert(1))" }]);
  assert.deepEqual(parseComment("data:text/html,hi"), [{ type: "text", text: "data:text/html,hi" }]);
  assert.equal(safeHttpUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpUrl("ftp://x.test"), null);
  assert.equal(safeHttpUrl("https://"), null);
  assert.equal(safeHttpUrl("https://ok.test/a"), "https://ok.test/a");
});

test("shortUrl drops www and shortens long paths", () => {
  assert.equal(shortUrl("https://www.facebook.com/"), "facebook.com");
  assert.equal(shortUrl("https://canva.com/design/"), "canva.com/design");
  assert.equal(shortUrl("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQ/view?usp=sharing"), "drive.google.com/file/d/1AbCdEf…");
  assert.equal(shortUrl("not a url"), "not a url");
});

test("pasting a URL over selected words names the link", () => {
  const text = "Here is the final poster today";
  const start = text.indexOf("final poster");
  const result = linkOverSelection(text, start, start + "final poster".length, "https://canva.com/d/9");
  assert.deepEqual(result, {
    text: "Here is the [final poster](https://canva.com/d/9) today",
    caret: start + "[final poster](https://canva.com/d/9)".length,
  });
});

test("spaces around the selection stay outside the label, and ) in the URL is encoded", () => {
  // Selected "  this " (two spaces before, one after).
  const result = linkOverSelection("see  this ", 3, 10, " https://x.test/a_(b) ");
  const link = "  [this](https://x.test/a_(b%29) ";
  assert.deepEqual(result, { text: "see" + link, caret: 3 + link.length });
  // And it reads back as one named link.
  assert.deepEqual(parseComment(result.text), [
    { type: "text", text: "see  " },
    { type: "link", url: "https://x.test/a_(b%29", label: "this" },
    { type: "text", text: " " },
  ]);
});

test("ordinary pastes are left alone", () => {
  assert.equal(linkOverSelection("hello", 2, 2, "https://x.test"), null); // nothing selected
  assert.equal(linkOverSelection("hello", 0, 5, "just words"), null); // not a URL
  assert.equal(linkOverSelection("hello", 0, 5, "https://a.test https://b.test"), null); // two URLs
  assert.equal(linkOverSelection("https://old.test", 0, 16, "https://new.test"), null); // replacing a URL
  assert.equal(linkOverSelection("a [b] c", 0, 7, "https://x.test"), null); // brackets in the label
  assert.equal(linkOverSelection("   ", 0, 3, "https://x.test"), null); // only spaces selected
});
