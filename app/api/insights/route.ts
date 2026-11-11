import { NextRequest, NextResponse } from "next/server";
import { assertContentAccess, requirePermission } from "@/lib/auth/dal";
import { getAllData, saveInsight } from "@/lib/data-store";
import { SheetError, errorStatus } from "@/lib/sheets/core";
import { ContentInsight } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("metrics.edit");
    const body: ContentInsight = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "Post ID is required to log insights" },
        { status: 400 }
      );
    }

    const { data, channels } = await getAllData();
    const post = data.find((item) => item.id === body.id);
    if (!post) throw new SheetError(`${body.id} was not found.`, 404);
    assertContentAccess(member, post, channels);

    const saved = await saveInsight(
      {
        id: body.id,
        views_impressions: Number(body.views_impressions || 0),
        engagements: Number(body.engagements || 0),
        clicks: Number(body.clicks || 0),
      },
      member.email
    );

    return NextResponse.json({ success: true, insight: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save insights";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
