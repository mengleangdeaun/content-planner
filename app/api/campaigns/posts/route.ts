import { NextRequest, NextResponse } from "next/server";
import { assertContentAccess, requirePermission } from "@/lib/auth/dal";
import { MAX_LINK_BATCH } from "@/lib/campaign-rules";
import { getAllData } from "@/lib/data-store";
import { getCampaignRow, linkCampaignPosts } from "@/lib/planning-store";
import { SheetError, errorStatus } from "@/lib/sheets/core";
import { loadAll } from "@/lib/sheets/table";

const idList = (value: unknown): string[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string" && id !== "")) {
    throw new SheetError("Posts must be a list of post IDs.", 400);
  }
  return [...new Set(value as string[])];
};

// Adds posts to a campaign and takes posts out of it, in one request.
export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("planning.manage");
    const body = await req.json();
    const add = idList(body.add);
    const remove = idList(body.remove);
    if (add.length + remove.length === 0) throw new SheetError("Choose at least one post.", 400);
    if (add.length + remove.length > MAX_LINK_BATCH) {
      throw new SheetError(`Change at most ${MAX_LINK_BATCH} posts at a time.`, 400);
    }

    const campaign = await getCampaignRow(body.campaign_id);
    if (!campaign) throw new SheetError("That campaign was not found.", 404);
    if (campaign.status === "Archived") throw new SheetError("That campaign is archived.", 400);

    const { data, channels } = await getAllData();
    for (const id of [...add, ...remove]) {
      const post = data.find((item) => item.id === id);
      if (!post) throw new SheetError(`Post ${id} was not found.`, 404);
      assertContentAccess(member, post, channels);
    }

    const result = await linkCampaignPosts(campaign.id, add, remove, member.email);
    const names = new Map((await loadAll()).Campaigns.rows.map((row) => [row.id, row.name]));
    return NextResponse.json({
      success: true,
      added: result.added,
      removed: result.removed,
      movedFrom: result.movedFrom.map((id) => names.get(id) ?? id),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update campaign posts";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
