import { NextRequest, NextResponse } from "next/server";
import { assertChannelAccess, requirePermission } from "@/lib/auth/dal";
import { addChannelSnapshot, getChannels } from "@/lib/data-store";
import { SheetError, errorStatus } from "@/lib/sheets/core";

// Follower counts are performance data, so entering them needs metrics rights.
export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("metrics.edit");
    const body = await req.json();
    if (!(await getChannels()).some((c) => c.id === body.channel_id)) {
      throw new SheetError("That channel was not found.", 404);
    }
    assertChannelAccess(member, body.channel_id);
    return NextResponse.json({ success: true, snapshot: await addChannelSnapshot(body, member.email) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save followers";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
