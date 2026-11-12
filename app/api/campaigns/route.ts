import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { saveCampaign, unlinkAllPosts } from "@/lib/planning-store";
import { errorStatus } from "@/lib/sheets/core";

// Campaigns are read through /api/content. Adding and editing share one handler.
async function save(req: NextRequest) {
  try {
    const member = await requirePermission("planning.manage");
    const campaign = await saveCampaign(await req.json(), member.email);
    // Archiving takes the campaign's posts out of it; the posts themselves stay.
    const unlinked = campaign.status === "Archived" ? await unlinkAllPosts(campaign.id, member.email) : 0;
    return NextResponse.json({ success: true, campaign, unlinked });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save campaign";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export { save as POST, save as PUT };
