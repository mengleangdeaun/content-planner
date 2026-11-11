import { cookies } from "next/headers";
import { getAllData } from "../data-store";
import { getMembers } from "../team-store";
import { SheetError } from "../sheets/core";
import { Member, Permission, canAccessChannel, canAccessContent, hasPermission, normalizeEmail } from "./permissions";
import { SESSION_COOKIE, readSessionToken } from "./session";

export async function findActiveMember(email: string): Promise<Member | null> {
  const target = normalizeEmail(email);
  const member = (await getMembers()).find((m) => m.email === target);
  return member?.status === "active" ? member : null;
}

// Membership is re-read on every request, so removing someone applies within the cache window.
export async function getCurrentMember(): Promise<Member> {
  const email = await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!email) throw new SheetError("Please sign in.", 401);
  const member = await findActiveMember(email);
  if (!member) throw new SheetError("Your access has been removed.", 401);
  return member;
}

export function assertPermission(member: Member, permission: Permission) {
  if (!hasPermission(member, permission)) {
    throw new SheetError("You do not have permission to do this.", 403);
  }
}

export async function requirePermission(permission: Permission): Promise<Member> {
  const member = await getCurrentMember();
  assertPermission(member, permission);
  return member;
}

export function assertChannelAccess(member: Member, channelId: string) {
  if (!canAccessChannel(member, channelId)) {
    throw new SheetError("You do not have access to this channel.", 403);
  }
}

// Work can only be given to people on the team, so it cannot go to an unknown address.
export async function assertTeamMembers(emails: unknown[]) {
  const people = emails.filter((email): email is string => typeof email === "string" && email !== "");
  if (people.length === 0) return;
  const members = await getMembers();
  const isMember = (email: string) =>
    members.some((m) => m.status === "active" && m.email === normalizeEmail(email));
  if (!people.every(isMember)) throw new SheetError("Assignees must be active team members.", 400);
}

export async function assertCanReachContent(member: Member, contentId: string | null | undefined) {
  const { data, channels } = await getAllData();
  const content = data.find((item) => item.id === contentId);
  if (!content) throw new SheetError("That post was not found.", 404);
  assertContentAccess(member, content, channels);
}

export function assertContentAccess(
  member: Member,
  item: Parameters<typeof canAccessContent>[1],
  channels: Parameters<typeof canAccessContent>[2]
) {
  if (!canAccessContent(member, item, channels)) {
    throw new SheetError("You do not have access to this channel.", 403);
  }
}
