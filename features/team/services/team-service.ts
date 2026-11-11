import { Member, Permission, Role } from "@/lib/auth/permissions";

async function request<T>(url: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || fallback);
  return json;
}

export interface MemberInput {
  id?: string;
  email?: string;
  name?: string;
  role_id?: string;
  channel_ids?: string[];
  status?: "active" | "inactive";
}

export function fetchTeam() {
  return request<{ members: Member[]; roles: Role[] }>("/api/team", undefined, "Failed to load the team");
}

export function saveMember(input: MemberInput) {
  return request(
    "/api/team",
    { method: input.id ? "PUT" : "POST", body: JSON.stringify(input) },
    "Failed to save team member"
  );
}

export function fetchRoles() {
  return request<{ roles: Role[] }>("/api/roles", undefined, "Failed to load roles");
}

export function saveRole(input: { id?: string; name: string; permissions: Permission[] }) {
  return request("/api/roles", { method: "POST", body: JSON.stringify(input) }, "Failed to save role");
}

export function deleteRole(id: string) {
  return request(
    `/api/roles?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete role"
  );
}
