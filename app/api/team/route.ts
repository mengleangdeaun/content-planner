import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/dal";
import { errorStatus } from "@/lib/sheets/core";
import { addMember, getMembers, getRoles, updateMember } from "@/lib/team-store";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: errorStatus(error) }
  );

export async function GET() {
  try {
    await requirePermission("team.manage");
    return NextResponse.json({ members: await getMembers(), roles: await getRoles() });
  } catch (error: unknown) {
    return fail(error, "Failed to load the team");
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requirePermission("team.manage");
    await addMember(actor, await req.json());
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to add team member");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await requirePermission("team.manage");
    await updateMember(actor, await req.json());
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return fail(error, "Failed to update team member");
  }
}
