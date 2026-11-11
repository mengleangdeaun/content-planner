// Pure helpers for the Sheets layer. No imports, so `node --test` can load this directly.

export type Cell = string | number | boolean;
export type Row = Record<string, string>;
export type Fields = Record<string, Cell | undefined>;

export class SheetError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function errorStatus(error: unknown): number {
  return error instanceof SheetError ? error.status : 500;
}

// 0 -> A, 25 -> Z, 26 -> AA
export function columnLetter(index: number): string {
  let letters = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return letters;
}

export function cellToString(value: unknown): string {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value ?? "").trim();
}

export function normalizeHeaders(row: unknown[] = []): string[] {
  return row.map((header) => String(header ?? "").trim());
}

export function rowToRecord(headers: string[], row: unknown[]): Row {
  const record: Row = {};
  headers.forEach((header, i) => {
    if (header) record[header] = cellToString(row[i]);
  });
  return record;
}

export function recordToCells(headers: string[], record: Fields): Cell[] {
  return headers.map((header) => record[header] ?? "");
}

export function missingColumns(headers: string[], fields: Fields): string[] {
  return Object.keys(fields).filter(
    (key) => fields[key] !== undefined && !headers.includes(key)
  );
}

export function parseBool(value: string): boolean {
  return ["TRUE", "YES", "1"].includes(value.trim().toUpperCase());
}

// Sheets returns formatted text, so a number cell can read "12,500".
// Accepts sheet text ("1,250") and values not yet written to the sheet (1250).
export function parseNumber(value: unknown): number {
  return Number(cellToString(value).replace(/,/g, "")) || 0;
}

export function pickFields(input: object, allowed: readonly string[]): Fields {
  const source = input as Fields;
  const picked: Fields = {};
  for (const key of allowed) {
    if (source[key] !== undefined) picked[key] = source[key];
  }
  return picked;
}

// One row per snapshot: keep the newest per id. Legacy rows have no captured_at, so they sort oldest.
export function latestById(rows: Row[]): Map<string, Row> {
  const latest = new Map<string, Row>();
  for (const row of rows) {
    const current = latest.get(row.id);
    if (!current || (row.captured_at ?? "") >= (current.captured_at ?? "")) {
      latest.set(row.id, row);
    }
  }
  return latest;
}

function isRateLimited(error: unknown): boolean {
  const e = error as { status?: number; code?: number | string; response?: { status?: number } };
  return e?.status === 429 || Number(e?.code) === 429 || e?.response?.status === 429;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retries only 429s: those are rejected before applying, so retrying a write cannot duplicate it.
export async function withRetry<T>(
  task: () => Promise<T>,
  sleep: (ms: number) => Promise<unknown> = wait,
  maxRetries = 5
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (!isRateLimited(error) || attempt >= maxRetries) throw error;
      await sleep(Math.min(2 ** attempt * 1000, 32000) + Math.random() * 1000);
    }
  }
}

export type Queue = <T>(task: () => Promise<T>) => Promise<T>;

// Runs tasks one at a time; a failed task does not block the next.
export function createQueue(): Queue {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task);
    tail = run.catch(() => undefined);
    return run;
  };
}
