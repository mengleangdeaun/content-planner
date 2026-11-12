// Links inside Activity comments. Comments are stored as plain text; links are either bare URLs
// or Markdown-style named links: [final poster](https://...). No runtime imports, so `node --test` can load it.

export type CommentSegment = { type: "text"; text: string } | { type: "link"; url: string; label?: string };

// A named link, or a bare http(s) URL running up to whitespace or angle brackets.
const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<>]+/g;
const TRAILING = ".,;:!?'\"";

/** The URL if it is a well-formed http(s) address, otherwise null. Keeps javascript: and the like out of href. */
export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

const count = (text: string, char: string) => text.split(char).length - 1;

/** Moves sentence punctuation and unmatched closing brackets off the end of a bare URL. */
function splitTrailing(raw: string): [string, string] {
  let url = raw;
  for (;;) {
    const last = url.at(-1) ?? "";
    const unmatched =
      (last === ")" && count(url, ")") > count(url, "(")) || (last === "]" && count(url, "]") > count(url, "["));
    if (!TRAILING.includes(last) && !unmatched) break;
    url = url.slice(0, -1);
  }
  return [url, raw.slice(url.length)];
}

/** Splits a comment into text and link segments, in order. Adjacent text is merged. */
export function parseComment(text: string): CommentSegment[] {
  const segments: CommentSegment[] = [];
  const pushText = (value: string) => {
    if (!value) return;
    const last = segments.at(-1);
    if (last?.type === "text") last.text += value;
    else segments.push({ type: "text", text: value });
  };

  let index = 0;
  for (const match of text.matchAll(LINK)) {
    pushText(text.slice(index, match.index));
    index = match.index + match[0].length;

    if (match[1] !== undefined) {
      const url = safeHttpUrl(match[2]);
      if (url) segments.push({ type: "link", url, label: match[1] });
      else pushText(match[0]);
      continue;
    }
    const [candidate, rest] = splitTrailing(match[0]);
    const url = safeHttpUrl(candidate);
    if (url) segments.push({ type: "link", url });
    else pushText(candidate);
    pushText(rest);
  }
  pushText(text.slice(index));
  return segments;
}

/** A readable form of a long URL: host without "www." plus the path, cut short with an ellipsis. */
export function shortUrl(url: string, max = 32): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    const short = parsed.hostname.replace(/^www\./, "") + path;
    return short.length > max ? `${short.slice(0, max - 1)}…` : short;
  } catch {
    return url;
  }
}

/**
 * Pasting a URL over selected words names the link: "final poster" becomes [final poster](url).
 * Returns null when the paste should go ahead as normal.
 */
export function linkOverSelection(
  text: string,
  start: number,
  end: number,
  pasted: string
): { text: string; caret: number } | null {
  const candidate = pasted.trim();
  if (start === end || /\s/.test(candidate) || !safeHttpUrl(candidate)) return null;

  const selected = text.slice(start, end);
  const label = selected.trim();
  // A selected URL is being replaced, not named; brackets and line breaks would break the link syntax.
  if (!label || safeHttpUrl(label) || /[[\]\n]/.test(label)) return null;

  const lead = selected.slice(0, selected.indexOf(label));
  const trail = selected.slice(selected.indexOf(label) + label.length);
  // ")" would end the link early, so it is percent-encoded; the URL still opens the same page.
  const link = `${lead}[${label}](${candidate.replace(/\)/g, "%29")})${trail}`;
  return { text: text.slice(0, start) + link + text.slice(end), caret: start + link.length };
}
