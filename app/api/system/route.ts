import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { getSystemConfig } from "@/lib/data-store";
import { errorStatus } from "@/lib/sheets/core";

export async function GET() {
  try {
    await requirePermission("system.manage");
    return NextResponse.json(getSystemConfig());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load system config";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
