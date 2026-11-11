// Pure permission rules, shared by server and client. No runtime imports, so `node --test` can load it.

export const PERMISSION_GROUPS = [
  {
    label: "Content",
    permissions: [
      { key: "content.view", label: "View content" },
      { key: "content.create", label: "Create content" },
      { key: "content.edit", label: "Edit content" },
      { key: "content.archive", label: "Archive content" },
      { key: "content.approve", label: "Approve or send back" },
      { key: "content.publish", label: "Schedule and publish" },
    ],
  },
  {
    label: "Planning",
    permissions: [
      { key: "planning.manage", label: "Manage campaigns" },
      { key: "tasks.manage", label: "Manage tasks" },
    ],
  },
  {
    label: "Performance",
    permissions: [
      { key: "metrics.view", label: "View metrics" },
      { key: "metrics.edit", label: "Enter metrics" },
    ],
  },
  {
    label: "Settings",
    permissions: [
      { key: "channels.manage", label: "Manage channels" },
      { key: "types.manage", label: "Manage content types" },
    ],
  },
  {
    label: "Administration",
    permissions: [
      { key: "team.manage", label: "Manage team members" },
      { key: "roles.manage", label: "Manage roles" },
      { key: "system.manage", label: "Manage sheet setup" },
    ],
  },
] as const;

export type Permission = (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => permission.key)
) as Permission[];

export const OWNER_ROLE_ID = "owner";

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  is_system: boolean;
}

export interface Member {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role_name: string;
  channel_ids: string[]; // Empty means every channel.
  status: "active" | "inactive";
  permissions: Permission[];
  is_env_owner: boolean; // Listed in ADMIN_EMAILS, so it cannot be changed in the app.
  last_login_at: string;
}

type SheetRow = Record<string, string>;

export const SYSTEM_ROLES: Role[] = [
  { id: OWNER_ROLE_ID, name: "Owner", permissions: ALL_PERMISSIONS, is_system: true },
  {
    id: "manager",
    name: "Manager",
    is_system: true,
    permissions: [
      "content.view",
      "content.create",
      "content.edit",
      "content.archive",
      "content.approve",
      "content.publish",
      "planning.manage",
      "tasks.manage",
      "metrics.view",
      "metrics.edit",
      "channels.manage",
      "types.manage",
      "team.manage",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    is_system: true,
    permissions: ["content.view", "content.create", "content.edit", "tasks.manage"],
  },
  {
    id: "reviewer",
    name: "Reviewer",
    is_system: true,
    permissions: ["content.view", "content.approve", "metrics.view"],
  },
  { id: "viewer", name: "Viewer", is_system: true, permissions: ["content.view"] },
];

export function parseList(value = ""): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePermissions(value = ""): Permission[] {
  return parseList(value).filter((p): p is Permission =>
    (ALL_PERMISSIONS as string[]).includes(p)
  );
}

// Built-in roles live in code; the Roles tab only stores edits and custom roles. Owner is never overridable.
export function mergeRoles(rows: SheetRow[]): Role[] {
  const live = rows.filter((row) => row.id && !row.archived_at);
  const byId = new Map(live.map((row) => [row.id, row]));
  const systemIds = new Set(SYSTEM_ROLES.map((role) => role.id));

  const system = SYSTEM_ROLES.map((role) => {
    const override = byId.get(role.id);
    if (role.id === OWNER_ROLE_ID || !override) return role;
    return {
      ...role,
      name: override.name || role.name,
      permissions: parsePermissions(override.permissions),
    };
  });
  const custom = live
    .filter((row) => !systemIds.has(row.id))
    .map((row) => ({
      id: row.id,
      name: row.name,
      permissions: parsePermissions(row.permissions),
      is_system: false,
    }));
  return [...system, ...custom];
}

export function normalizeEmail(email = ""): string {
  return email.trim().toLowerCase();
}

export function buildMembers(rows: SheetRow[], roles: Role[], adminEmails: string[]): Member[] {
  const admins = new Set(adminEmails.map(normalizeEmail));
  const owner = roles.find((role) => role.id === OWNER_ROLE_ID)!;

  const members = rows
    .filter((row) => row.id && row.email)
    .map((row): Member => {
      const email = normalizeEmail(row.email);
      const isEnvOwner = admins.has(email);
      const role = isEnvOwner ? owner : roles.find((r) => r.id === row.role_id);
      const status = isEnvOwner || row.status !== "inactive" ? "active" : "inactive";
      return {
        id: row.id,
        email,
        name: row.name || email,
        role_id: role?.id ?? row.role_id ?? "",
        role_name: role?.name ?? "Unknown role",
        channel_ids: role?.id === OWNER_ROLE_ID ? [] : parseList(row.channel_ids),
        status,
        permissions: status === "active" ? (role?.permissions ?? []) : [],
        is_env_owner: isEnvOwner,
        last_login_at: row.last_login_at ?? "",
      };
    });

  const known = new Set(members.map((member) => member.email));
  for (const email of admins) {
    if (known.has(email)) continue;
    members.push({
      id: `env:${email}`,
      email,
      name: email,
      role_id: OWNER_ROLE_ID,
      role_name: owner.name,
      channel_ids: [],
      status: "active",
      permissions: owner.permissions,
      is_env_owner: true,
      last_login_at: "",
    });
  }
  return members;
}

export function hasPermission(member: Member, permission: Permission): boolean {
  return member.permissions.includes(permission);
}

export function canAccessChannel(member: Member, channelId: string): boolean {
  return member.channel_ids.length === 0 || member.channel_ids.includes(channelId);
}

// Nobody can hand out access they do not hold themselves.
export function canGrant(actor: Member, permissions: Permission[]): boolean {
  return permissions.every((permission) => actor.permissions.includes(permission));
}

export function canGrantChannels(actor: Member, channelIds: string[]): boolean {
  if (actor.channel_ids.length === 0) return true;
  return channelIds.length > 0 && channelIds.every((id) => actor.channel_ids.includes(id));
}

export function wouldRemoveLastOwner(
  members: Member[],
  targetId: string,
  next: { role_id?: string; status?: string }
): boolean {
  const isOwner = (m: Member) => m.status === "active" && m.role_id === OWNER_ROLE_ID;
  const target = members.find((m) => m.id === targetId);
  if (!target || !isOwner(target)) return false;
  const staysOwner =
    (next.role_id ?? target.role_id) === OWNER_ROLE_ID && (next.status ?? target.status) === "active";
  return !staysOwner && members.filter(isOwner).length <= 1;
}

export function statusPermission(status: string): Permission {
  if (status === "Approved" || status === "In Revise") return "content.approve";
  if (status === "Scheduled" || status === "Published") return "content.publish";
  if (status === "Archived") return "content.archive";
  return "content.edit";
}

export function permissionsForContentUpdate(fields: Record<string, unknown>): Permission[] {
  const required = new Set<Permission>();
  if (typeof fields.status === "string") required.add(statusPermission(fields.status));
  const editsOtherFields = Object.keys(fields).some(
    (key) => !["id", "status", "expected_updated_at"].includes(key)
  );
  if (editsOtherFields || required.size === 0) required.add("content.edit");
  return [...required];
}

interface ChannelRef {
  id: string;
  platform: string;
  account_name: string;
}

interface ContentRef {
  channel_id?: string;
  platform: string;
  account_name: string;
}

// Older rows have no channel_id, so fall back to matching platform and account.
export function resolveChannelId(item: ContentRef, channels: ChannelRef[]): string {
  if (item.channel_id) return item.channel_id;
  return (
    channels.find((c) => c.platform === item.platform && c.account_name === item.account_name)?.id ?? ""
  );
}

export function canAccessContent(member: Member, item: ContentRef, channels: ChannelRef[]): boolean {
  return member.channel_ids.length === 0 || canAccessChannel(member, resolveChannelId(item, channels));
}

export function scopeWorkspace<
  C extends ChannelRef,
  I extends ContentRef & { insight?: unknown },
  W extends { data: I[]; channels: C[] },
>(workspace: W, member: Member): W {
  const showMetrics = hasPermission(member, "metrics.view");
  return {
    ...workspace,
    channels: workspace.channels.filter((channel) => canAccessChannel(member, channel.id)),
    data: workspace.data
      .filter((item) => canAccessContent(member, item, workspace.channels))
      .map((item) => (showMetrics ? item : { ...item, insight: undefined })),
  };
}
