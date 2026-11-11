import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { scopeWorkspace } from "@/lib/auth/permissions";
import { getAllData } from "@/lib/data-store";
import { errorStatus } from "@/lib/sheets/core";

export async function POST() {
  try {
    const member = await requirePermission("content.view");
    return NextResponse.json({ success: true, ...scopeWorkspace(await getAllData(true), member) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
