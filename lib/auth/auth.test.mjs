import assert from "node:assert/strict";
import { test } from "node:test";
import { SignJWT } from "jose";
import {
  ALL_PERMISSIONS,
  OWNER_ROLE_ID,
  SYSTEM_ROLES,
  buildMembers,
  canAccessContent,
  canGrant,
  canGrantChannels,
  mergeRoles,
  permissionsForContentUpdate,
  resolveChannelId,
  scopeWorkspace,
  statusPermission,
  wouldRemoveLastOwner,
} from "./permissions.ts";
import { createSessionToken, readSessionToken } from "./session.ts";

const SECRET = "a".repeat(64);
const roles = mergeRoles([]);
const member = (over = {}) => ({
  id: "M1", email: "a@x.com", name: "A", role_id: "viewer", role_name: "Viewer",
  channel_ids: [], status: "active", permissions: ["content.view"], is_env_owner: false,
  last_login_at: "", ...over,
});
const row = (over = {}) => ({ id: "M1", email: "a@x.com", role_id: "viewer", status: "active", channel_ids: "", ...over });

test("Owner always has every permission, even if the sheet says otherwise", () => {
  const merged = mergeRoles([{ id: OWNER_ROLE_ID, name: "Hacked", permissions: "" }]);
  const owner = merged.find((r) => r.id === OWNER_ROLE_ID);
  assert.equal(owner.name, "Owner");
  assert.deepEqual(owner.permissions, ALL_PERMISSIONS);
});

test("built-in roles can be edited through the sheet", () => {
  const merged = mergeRoles([{ id: "viewer", name: "Guest", permissions: "content.view,metrics.view" }]);
  const viewer = merged.find((r) => r.id === "viewer");
  assert.equal(viewer.name, "Guest");
  assert.deepEqual(viewer.permissions, ["content.view", "metrics.view"]);
});

test("unknown permissions in the sheet are ignored", () => {
  const merged = mergeRoles([{ id: "R1", name: "X", permissions: "content.view,root.all" }]);
  assert.deepEqual(merged.find((r) => r.id === "R1").permissions, ["content.view"]);
});

test("archived custom roles disappear", () => {
  const merged = mergeRoles([{ id: "R1", name: "X", permissions: "", archived_at: "2026-01-01" }]);
  assert.equal(merged.some((r) => r.id === "R1"), false);
  assert.equal(merged.length, SYSTEM_ROLES.length);
});

test("ADMIN_EMAILS grants Owner without a sheet row", () => {
  const [m] = buildMembers([], roles, ["Boss@X.com "]);
  assert.equal(m.email, "boss@x.com");
  assert.equal(m.role_id, OWNER_ROLE_ID);
  assert.equal(m.is_env_owner, true);
});

test("ADMIN_EMAILS overrides a deactivated or demoted row", () => {
  const [m] = buildMembers([row({ email: "boss@x.com", status: "inactive" })], roles, ["boss@x.com"]);
  assert.equal(m.status, "active");
  assert.equal(m.role_id, OWNER_ROLE_ID);
  assert.deepEqual(m.permissions, ALL_PERMISSIONS);
});

test("inactive members get no permissions", () => {
  const [m] = buildMembers([row({ status: "inactive" })], roles, []);
  assert.deepEqual(m.permissions, []);
});

test("a member whose role no longer exists gets no permissions", () => {
  const [m] = buildMembers([row({ role_id: "gone" })], roles, []);
  assert.deepEqual(m.permissions, []);
});

test("cannot remove the last owner by demoting or deactivating", () => {
  const owner = member({ id: "O", role_id: OWNER_ROLE_ID });
  assert.equal(wouldRemoveLastOwner([owner], "O", { role_id: "viewer" }), true);
  assert.equal(wouldRemoveLastOwner([owner], "O", { status: "inactive" }), true);
  assert.equal(wouldRemoveLastOwner([owner], "O", { role_id: OWNER_ROLE_ID }), false);
});

test("can demote an owner when another active owner remains", () => {
  const a = member({ id: "A", role_id: OWNER_ROLE_ID });
  const b = member({ id: "B", role_id: OWNER_ROLE_ID });
  assert.equal(wouldRemoveLastOwner([a, b], "A", { role_id: "viewer" }), false);
});

test("an inactive owner does not count as a remaining owner", () => {
  const a = member({ id: "A", role_id: OWNER_ROLE_ID });
  const b = member({ id: "B", role_id: OWNER_ROLE_ID, status: "inactive" });
  assert.equal(wouldRemoveLastOwner([a, b], "A", { status: "inactive" }), true);
});

test("cannot grant permissions you do not hold", () => {
  const actor = member({ permissions: ["team.manage", "content.view"] });
  assert.equal(canGrant(actor, ["content.view"]), true);
  assert.equal(canGrant(actor, ["content.view", "roles.manage"]), false);
});

test("channel-limited actors cannot grant wider channel access", () => {
  const limited = member({ channel_ids: ["C1"] });
  assert.equal(canGrantChannels(limited, ["C1"]), true);
  assert.equal(canGrantChannels(limited, ["C2"]), false);
  assert.equal(canGrantChannels(limited, []), false, "empty means all channels");
  assert.equal(canGrantChannels(member(), []), true);
});

test("status changes need the matching permission", () => {
  assert.equal(statusPermission("Approved"), "content.approve");
  assert.equal(statusPermission("In Revise"), "content.approve");
  assert.equal(statusPermission("Published"), "content.publish");
  assert.equal(statusPermission("Scheduled"), "content.publish");
  assert.equal(statusPermission("Archived"), "content.archive");
  assert.equal(statusPermission("In Review"), "content.edit");
});

test("an update needs edit only when it touches more than status", () => {
  assert.deepEqual(permissionsForContentUpdate({ id: "1", status: "Approved" }), ["content.approve"]);
  assert.deepEqual(
    permissionsForContentUpdate({ id: "1", status: "Approved", title: "x" }).sort(),
    ["content.approve", "content.edit"]
  );
  assert.deepEqual(permissionsForContentUpdate({ id: "1", title: "x" }), ["content.edit"]);
  assert.deepEqual(permissionsForContentUpdate({ id: "1" }), ["content.edit"]);
});

const channels = [
  { id: "C1", platform: "Facebook", account_name: "ABC" },
  { id: "C2", platform: "TikTok", account_name: "XYZ" },
];

test("legacy posts resolve their channel by platform and account", () => {
  assert.equal(resolveChannelId({ platform: "TikTok", account_name: "XYZ" }, channels), "C2");
  assert.equal(resolveChannelId({ channel_id: "C1", platform: "TikTok", account_name: "XYZ" }, channels), "C1");
  assert.equal(resolveChannelId({ platform: "Nope", account_name: "Z" }, channels), "");
});

test("a channel-limited member cannot see posts with no known channel", () => {
  const limited = member({ channel_ids: ["C1"] });
  assert.equal(canAccessContent(limited, { platform: "Nope", account_name: "Z" }, channels), false);
  assert.equal(canAccessContent(member(), { platform: "Nope", account_name: "Z" }, channels), true);
});

test("scopeWorkspace limits channels and posts, and strips metrics", () => {
  const workspace = {
    channels,
    data: [
      { id: "P1", channel_id: "C1", platform: "Facebook", account_name: "ABC", insight: { views: 1 } },
      { id: "P2", channel_id: "C2", platform: "TikTok", account_name: "XYZ", insight: { views: 2 } },
    ],
  };
  const scoped = scopeWorkspace(workspace, member({ channel_ids: ["C1"] }));
  assert.deepEqual(scoped.channels.map((c) => c.id), ["C1"]);
  assert.deepEqual(scoped.data.map((d) => d.id), ["P1"]);
  assert.equal(scoped.data[0].insight, undefined);
});

test("scopeWorkspace hides tasks on posts the member cannot see", () => {
  const workspace = {
    channels,
    data: [
      { id: "P1", channel_id: "C1", platform: "Facebook", account_name: "ABC" },
      { id: "P2", channel_id: "C2", platform: "TikTok", account_name: "XYZ" },
    ],
    tasks: [{ id: "T1", content_id: "P1" }, { id: "T2", content_id: "P2" }, { id: "T3", content_id: "GONE" }],
  };
  const limited = scopeWorkspace(workspace, member({ channel_ids: ["C1"] }));
  assert.deepEqual(limited.tasks.map((t) => t.id), ["T1"]);
  const everyone = scopeWorkspace(workspace, member());
  assert.deepEqual(everyone.tasks.map((t) => t.id), ["T1", "T2"]);
});

test("scopeWorkspace limits follower snapshots by channel and hides them without metrics access", () => {
  const workspace = {
    channels,
    data: [],
    channelSnapshots: [{ id: "S1", channel_id: "C1" }, { id: "S2", channel_id: "C2" }],
  };
  const limited = scopeWorkspace(workspace, member({ channel_ids: ["C1"], permissions: ["content.view", "metrics.view"] }));
  assert.deepEqual(limited.channelSnapshots.map((s) => s.id), ["S1"]);
  assert.deepEqual(scopeWorkspace(workspace, member()).channelSnapshots, []);
});

test("scopeWorkspace keeps metrics for members who may see them", () => {
  const workspace = { channels, data: [{ id: "P1", channel_id: "C1", platform: "Facebook", account_name: "ABC", insight: { views: 1 } }] };
  const scoped = scopeWorkspace(workspace, member({ permissions: ["content.view", "metrics.view"] }));
  assert.deepEqual(scoped.data[0].insight, { views: 1 });
});

test("a session token round-trips", async () => {
  const token = await createSessionToken("a@x.com", SECRET);
  assert.equal(await readSessionToken(token, SECRET), "a@x.com");
});

test("a token signed with another secret is rejected", async () => {
  const token = await createSessionToken("a@x.com", "b".repeat(64));
  assert.equal(await readSessionToken(token, SECRET), null);
});

test("a tampered token is rejected", async () => {
  const token = await createSessionToken("a@x.com", SECRET);
  const [h, , s] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ email: "boss@x.com" })).toString("base64url");
  assert.equal(await readSessionToken(`${h}.${forged}.${s}`, SECRET), null);
});

test("an unsigned alg=none token is rejected", async () => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  assert.equal(await readSessionToken(`${b({ alg: "none" })}.${b({ email: "boss@x.com" })}.`, SECRET), null);
});

test("an expired token is rejected", async () => {
  const token = await new SignJWT({ email: "a@x.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(new TextEncoder().encode(SECRET));
  assert.equal(await readSessionToken(token, SECRET), null);
});

test("no session is possible with a missing or short secret", async () => {
  await assert.rejects(createSessionToken("a@x.com", ""));
  await assert.rejects(createSessionToken("a@x.com", "short"));
  assert.equal(await readSessionToken("anything", ""), null);
  assert.equal(await readSessionToken(undefined, SECRET), null);
});
