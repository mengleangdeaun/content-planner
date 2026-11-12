import { NextRequest, NextResponse } from "next/server";
import { assertCanReachContent, requirePermission } from "@/lib/auth/dal";
import { getInsightHistory, saveInsight } from "@/lib/data-store";
import { checkInsight } from "@/lib/metrics-rules";
import { SheetError, errorStatus } from "@/lib/sheets/core";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: errorStatus(error) }
  );

// The latest date a count may carry. The server runs on UTC while people log in their own time zone,
// so "today" for someone east of UTC can already be tomorrow here; allow one day of slack.
const latestAllowedDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export async function GET(req: NextRequest) {
  try {
    const member = await requirePermission("metrics.view");
    const contentId = req.nextUrl.searchParams.get("content_id");
    await assertCanReachContent(member, contentId);
    return NextResponse.json({ history: await getInsightHistory(contentId!) });
  } catch (error: unknown) {
    return fail(error, "Failed to load metrics history");
  }
}

export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("metrics.edit");
    const body = await req.json();
    if (!body?.id) throw new SheetError("Post ID is required to log metrics.", 400);
    const problem = checkInsight(body, latestAllowedDate());
    if (problem) throw new SheetError(problem, 400);
    await assertCanReachContent(member, body.id);

    const insight = await saveInsight(body, member.email);
    return NextResponse.json({ success: true, insight });
  } catch (error: unknown) {
    return fail(error, "Failed to save metrics");
  }
}
