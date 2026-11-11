import { NextRequest, NextResponse } from "next/server";
import { assertCanReachContent, getCurrentMember, requirePermission } from "@/lib/auth/dal";
import { canComment } from "@/lib/auth/permissions";
import { addComment, getActivity } from "@/lib/planning-store";
import { SheetError, errorStatus } from "@/lib/sheets/core";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: errorStatus(error) }
  );

export async function GET(req: NextRequest) {
  try {
    const member = await requirePermission("content.view");
    const contentId = req.nextUrl.searchParams.get("content_id");
    await assertCanReachContent(member, contentId);
    return NextResponse.json({ activity: await getActivity(contentId!) });
  } catch (error: unknown) {
    return fail(error, "Failed to load activity");
  }
}

export async function POST(req: NextRequest) {
  try {
    const member = await getCurrentMember();
    if (!canComment(member)) throw new SheetError("You do not have permission to do this.", 403);
    const body = await req.json();
    await assertCanReachContent(member, body.content_id);
    await addComment(body.content_id, body.body, member.email);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to add comment");
  }
}
