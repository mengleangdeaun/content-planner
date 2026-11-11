import { randomUUID } from "node:crypto";
import { getAdminEmails } from "./auth-whitelist";
import {
  ALL_PERMISSIONS,
  Member,
  OWNER_ROLE_ID,
  Permission,
  Role,
  buildMembers,
  canGrant,
  canGrantChannels,
  mergeRoles,
  normalizeEmail,
  wouldRemoveLastOwner,
} from "./auth/permissions";
import { SheetError } from "./sheets/core";
import { appendRows, loadAll, patchRow } from "./sheets/table";

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

export async function getRoles(): Promise<Role[]> {
  return mergeRoles((await loadAll()).Roles.rows);
}

export async function getMembers(): Promise<Member[]> {
  const tabs = await loadAll();
  return buildMembers(tabs.Team_Members.rows, mergeRoles(tabs.Roles.rows), getAdminEmails());
}

function assertCanAssignRole(actor: Member, role: Role | undefined): asserts role is Role {
  if (!role) throw new SheetError("That role does not exist.", 400);
  if (!canGrant(actor, role.permissions)) {
    throw new SheetError("You cannot assign a role with more access than your own.", 403);
  }
}

function assertCanAssignChannels(actor: Member, channelIds: string[]) {
  if (!canGrantChannels(actor, channelIds)) {
    throw new SheetError("You cannot grant access to channels outside your own.", 403);
  }
}

const cleanIds = (ids: unknown): string[] =>
  Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && id !== "") : [];

export async function addMember(
  actor: Member,
  input: { email?: string; name?: string; role_id?: string; channel_ids?: string[] }
): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SheetError("Enter a valid email address.", 400);
  }
  if ((await getMembers()).some((member) => member.email === email)) {
    throw new SheetError("That person is already on the team.", 409);
  }
  const role = (await getRoles()).find((r) => r.id === input.role_id);
  assertCanAssignRole(actor, role);
  const channelIds = cleanIds(input.channel_ids);
  assertCanAssignChannels(actor, channelIds);

  await appendRows("Team_Members", [
    {
      id: newId("MEM"),
      email,
      name: input.name?.trim() ?? "",
      role_id: role.id,
      channel_ids: channelIds.join(","),
      status: "active",
      invited_by: actor.email,
    },
  ]);
}

export async function updateMember(
  actor: Member,
  input: { id?: string; name?: string; role_id?: string; channel_ids?: string[]; status?: string }
): Promise<void> {
  const members = await getMembers();
  const target = members.find((member) => member.id === input.id);
  if (!target) throw new SheetError("That team member was not found.", 404);
  if (target.is_env_owner) {
    throw new SheetError("This Owner is set by ADMIN_EMAILS and can only be changed there.", 400);
  }
  if (input.status !== undefined && input.status !== "active" && input.status !== "inactive") {
    throw new SheetError("Status must be active or inactive.", 400);
  }

  const roles = await getRoles();
  // Compare against the role's real permissions: an inactive member's permission list is empty.
  const currentRole = roles.find((r) => r.id === target.role_id);
  if (currentRole && !canGrant(actor, currentRole.permissions)) {
    throw new SheetError("You cannot change someone with more access than your own.", 403);
  }
  if (!canGrantChannels(actor, target.channel_ids)) {
    throw new SheetError("You cannot change someone with wider channel access than your own.", 403);
  }
  if (input.role_id !== undefined) {
    assertCanAssignRole(actor, roles.find((r) => r.id === input.role_id));
  }
  const channelIds = input.channel_ids === undefined ? undefined : cleanIds(input.channel_ids);
  if (channelIds) assertCanAssignChannels(actor, channelIds);

  if (wouldRemoveLastOwner(members, target.id, input)) {
    throw new SheetError("You cannot remove the last active Owner.", 409);
  }

  await patchRow("Team_Members", target.id, {
    name: input.name?.trim(),
    role_id: input.role_id,
    channel_ids: channelIds?.join(","),
    status: input.status,
  });
}

export async function recordLogin(member: Member, googleName?: string): Promise<void> {
  if (member.id.startsWith("env:")) return; // ADMIN_EMAILS owners may have no sheet row.
  await patchRow("Team_Members", member.id, {
    last_login_at: new Date().toISOString(),
    name: member.name === member.email ? googleName : undefined,
  });
}

export async function saveRole(
  actor: Member,
  input: { id?: string; name?: string; permissions?: string[] }
): Promise<void> {
  const name = input.name?.trim();
  if (!name) throw new SheetError("Role name is required.", 400);
  if (input.id === OWNER_ROLE_ID) throw new SheetError("The Owner role cannot be changed.", 400);

  const permissions = (input.permissions ?? []).filter((p): p is Permission =>
    (ALL_PERMISSIONS as string[]).includes(p)
  );
  if (!canGrant(actor, permissions)) {
    throw new SheetError("You cannot grant permissions you do not have.", 403);
  }

  const roles = await getRoles();
  if (roles.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== input.id)) {
    throw new SheetError("A role with that name already exists.", 409);
  }

  const existing = input.id ? roles.find((r) => r.id === input.id) : undefined;
  if (input.id && !existing) throw new SheetError("That role was not found.", 404);
  if (existing && !canGrant(actor, existing.permissions)) {
    throw new SheetError("You cannot change a role with more access than your own.", 403);
  }

  const stored = permissions.join(",");
  const hasRow = (await loadAll()).Roles.rows.some((row) => row.id === input.id);
  if (hasRow) {
    await patchRow("Roles", input.id!, { name, permissions: stored });
    return;
  }
  // A built-in role gets its first row here, the first time it is edited.
  await appendRows("Roles", [
    { id: existing?.id ?? newId("ROLE"), name, permissions: stored, is_system: Boolean(existing?.is_system) },
  ]);
}

export async function archiveRole(actor: Member, id: string): Promise<void> {
  const role = (await getRoles()).find((r) => r.id === id);
  if (!role) throw new SheetError("That role was not found.", 404);
  if (role.is_system) throw new SheetError("Built-in roles cannot be deleted.", 400);
  if (!canGrant(actor, role.permissions)) {
    throw new SheetError("You cannot delete a role with more access than your own.", 403);
  }
  if ((await getMembers()).some((member) => member.role_id === id)) {
    throw new SheetError("Move everyone off this role before deleting it.", 409);
  }
  await patchRow("Roles", id, { archived_at: new Date().toISOString() });
}
