import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import {
  addContentType,
  deleteContentType,
  getContentTypes,
  updateContentType,
} from "@/lib/data-store";
import { errorStatus } from "@/lib/sheets/core";

export async function GET() {
  try {
    await requirePermission("content.view");
    return NextResponse.json({
      success: true,
      contentTypes: await getContentTypes(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load content types";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("types.manage");
    const body = await req.json();
    const { action, data } = body;

    if (action === "add-content-type") {
      const created = await addContentType(data);
      return NextResponse.json({ success: true, item: created });
    }

    if (action === "update-content-type") {
      const { item, renamedPosts } = await updateContentType(data);
      return NextResponse.json({ success: true, item, renamedPosts });
    }

    if (action === "delete-content-type") {
      await deleteContentType(data.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process taxonomy request";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
