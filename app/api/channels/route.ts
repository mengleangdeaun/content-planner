import { NextRequest, NextResponse } from "next/server";
import { assertChannelAccess, assertTeamMembers, requirePermission } from "@/lib/auth/dal";
import { canAccessChannel } from "@/lib/auth/permissions";
import {
  addChannel,
  deleteChannel,
  getChannels,
  updateChannel,
} from "@/lib/data-store";
import { errorStatus } from "@/lib/sheets/core";
import { ChannelAccount } from "@/lib/types";

export async function GET() {
  try {
    const member = await requirePermission("content.view");
    const channels = (await getChannels()).filter((c) => canAccessChannel(member, c.id));
    return NextResponse.json({ success: true, channels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load channels";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("channels.manage");
    const body = await req.json();
    await assertTeamMembers([body.owner_email]);
    const created = await addChannel(body);
    return NextResponse.json({ success: true, channel: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create channel";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const member = await requirePermission("channels.manage");
    const body: ChannelAccount = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "Channel ID is required for update" },
        { status: 400 }
      );
    }
    assertChannelAccess(member, body.id);
    await assertTeamMembers([body.owner_email]);
    const updated = await updateChannel(body);
    return NextResponse.json({ success: true, channel: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update channel";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

// Archives the channel: the row and its posts stay in the sheet.
export async function DELETE(req: NextRequest) {
  try {
    const member = await requirePermission("channels.manage");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
    }
    assertChannelAccess(member, id);
    await deleteChannel(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to archive channel";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
