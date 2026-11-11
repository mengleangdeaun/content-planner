import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/auth/dal";
import { errorStatus } from "@/lib/sheets/core";

export async function GET() {
  try {
    return NextResponse.json({ member: await getCurrentMember() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load your account";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
