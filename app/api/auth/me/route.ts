import { NextRequest, NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth/dal";
import { errorStatus } from "@/lib/sheets/core";
import { updateOwnName } from "@/lib/team-store";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: errorStatus(error) });

export async function GET() {
  try {
    return NextResponse.json({ member: await getCurrentMember() });
  } catch (error: unknown) {
    return fail(error, "Failed to load your account");
  }
}

// Changes the signed-in person's own name, and nothing else.
export async function PUT(req: NextRequest) {
  try {
    const member = await getCurrentMember();
    const body = await req.json().catch(() => ({}));
    await updateOwnName(member, body.name);
    return NextResponse.json({ member: await getCurrentMember() });
  } catch (error: unknown) {
    return fail(error, "Failed to update your name");
  }
}
