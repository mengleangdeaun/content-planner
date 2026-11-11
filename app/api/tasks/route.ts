import { NextRequest, NextResponse } from "next/server";
import { assertCanReachContent, assertTeamMembers, requirePermission } from "@/lib/auth/dal";
import { addTask, getTask, updateTask } from "@/lib/planning-store";
import { SheetError, errorStatus } from "@/lib/sheets/core";

const fail = (error: unknown, fallback: string) =>
  NextResponse.json(
    { error: error instanceof Error ? error.message : fallback },
    { status: errorStatus(error) }
  );

// Tasks are read through /api/content, which filters them to posts the person can see.
export async function POST(req: NextRequest) {
  try {
    const member = await requirePermission("tasks.manage");
    const body = await req.json();
    await assertCanReachContent(member, body.content_id);
    await assertTeamMembers([body.assignee_email]);
    return NextResponse.json({ success: true, task: await addTask(body, member.email) });
  } catch (error: unknown) {
    return fail(error, "Failed to add task");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const member = await requirePermission("tasks.manage");
    const body = await req.json();
    const task = await getTask(body.id);
    if (!task) throw new SheetError("That task was not found.", 404);
    await assertCanReachContent(member, task.content_id);
    await assertTeamMembers([body.assignee_email]);
    return NextResponse.json({ success: true, task: await updateTask(body.id, body) });
  } catch (error: unknown) {
    return fail(error, "Failed to update task");
  }
}
