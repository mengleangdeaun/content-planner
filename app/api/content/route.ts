import { NextRequest, NextResponse } from "next/server";
import {
  assertContentAccess,
  assertPermission,
  getCurrentMember,
  requirePermission,
} from "@/lib/auth/dal";
import { permissionsForContentUpdate, scopeWorkspace } from "@/lib/auth/permissions";
import { addContentItem, getAllData, updateContentItem } from "@/lib/data-store";
import { SheetError, errorStatus } from "@/lib/sheets/core";

export async function GET(req: NextRequest) {
  try {
    const member = await requirePermission("content.view");
    const { searchParams } = new URL(req.url);
    const forceFresh = searchParams.get("fresh") === "true";
    return NextResponse.json(scopeWorkspace(await getAllData(forceFresh), member));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch content";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("content.create");
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { channels } = await getAllData();
    assertContentAccess(member, body, channels);

    const created = await addContentItem(body, member.email);
    return NextResponse.json({ success: true, item: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create content item";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const member = await getCurrentMember();
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { error: "Item ID is required for update" },
        { status: 400 }
      );
    }
    permissionsForContentUpdate(body).forEach((p) => assertPermission(member, p));

    const { data, channels } = await getAllData();
    const existing = data.find((item) => item.id === body.id);
    if (!existing) throw new SheetError(`${body.id} was not found.`, 404);
    assertContentAccess(member, existing, channels);
    // Moving a post needs access to where it is going, too.
    assertContentAccess(member, { ...existing, ...body }, channels);

    const updated = await updateContentItem(body);
    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update content item";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
