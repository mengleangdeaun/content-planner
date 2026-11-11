import { NextRequest, NextResponse } from "next/server";
import {
  assertChannelAccess,
  assertContentAccess,
  assertPermission,
  assertTeamMembers,
  getCurrentMember,
  requirePermission,
} from "@/lib/auth/dal";
import {
  permissionsForContentUpdate,
  resolveChannelId,
  scopeWorkspace,
  statusPermission,
} from "@/lib/auth/permissions";
import { addContentItems, getAllData, updateContentItem } from "@/lib/data-store";
import { ActivityEvent, logActivity } from "@/lib/planning-store";
import { SheetError, errorStatus } from "@/lib/sheets/core";
import { getMembers } from "@/lib/team-store";
import { ALL_STATUSES, LIVE_URL_REQUIRED, checkContentFields } from "@/lib/workflow";

const TRACKED_FIELDS = ["assignee_email", "reviewer_email", "due_date", "publish_date", "campaign_id"];

async function checkFields(body: Record<string, unknown>) {
  const problem = checkContentFields(body);
  if (problem) throw new SheetError(problem, 400);
  await assertTeamMembers([body.assignee_email, body.reviewer_email]);
}

export async function GET(req: NextRequest) {
  try {
    const member = await requirePermission("content.view");
    const { searchParams } = new URL(req.url);
    const forceFresh = searchParams.get("fresh") === "true";
    const people = (await getMembers())
      .filter((m) => m.status === "active")
      .map(({ email, name }) => ({ email, name }));
    return NextResponse.json({ ...scopeWorkspace(await getAllData(forceFresh), member), people });
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

    const status = body.status ?? "Draft";
    if (!ALL_STATUSES.includes(status)) throw new SheetError("That status is not valid.", 400);
    // Creating a post already Approved or Published needs the same right as moving one there.
    assertPermission(member, statusPermission(status));
    if (status === "Published" && !body.live_post_url?.trim()) {
      throw new SheetError(LIVE_URL_REQUIRED, 400);
    }
    await checkFields(body);

    const { channels } = await getAllData();
    const ids: string[] = Array.isArray(body.channel_ids)
      ? body.channel_ids
      : [resolveChannelId(body, channels)];
    const targets = channels.filter((channel) => ids.includes(channel.id));
    if (targets.length === 0 || targets.length !== new Set(ids).size) {
      throw new SheetError("Choose at least one valid channel.", 400);
    }
    targets.forEach((channel) => assertChannelAccess(member, channel.id));

    const items = await addContentItems({ ...body, status }, targets, member.email);
    await logActivity(
      member.email,
      items.map((item) => ({ kind: "created", entity_id: item.id, to_value: status }))
    ).catch((error) => console.error("Could not record activity:", error));
    return NextResponse.json({ success: true, items });
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
    await checkFields(body);

    const { data, channels } = await getAllData();
    const existing = data.find((item) => item.id === body.id);
    if (!existing) throw new SheetError(`${body.id} was not found.`, 404);
    assertContentAccess(member, existing, channels);
    // Moving a post needs access to where it is going, too.
    assertContentAccess(member, { ...existing, ...body }, channels);

    const { item, previous } = await updateContentItem(body);

    const row = item as unknown as Record<string, string>;
    const events: ActivityEvent[] = TRACKED_FIELDS.filter(
      (field) => body[field] !== undefined && (row[field] ?? "") !== (previous[field] ?? "")
    ).map((field) => ({
      kind: "field",
      entity_id: item.id,
      body: field,
      from_value: previous[field] ?? "",
      to_value: row[field] ?? "",
    }));
    if (body.status !== undefined && item.status !== previous.status) {
      events.push({ kind: "status", entity_id: item.id, from_value: previous.status, to_value: item.status });
    }
    // The edit is already saved, so a failed history entry must not report it as failed.
    await logActivity(member.email, events).catch((error) =>
      console.error("Could not record activity:", error)
    );

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update content item";
    return NextResponse.json({ error: message }, { status: errorStatus(error) });
  }
}
