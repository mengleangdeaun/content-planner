"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { Member, OWNER_ROLE_ID, Role, canGrant } from "@/lib/auth/permissions";
import { formatDisplayDate } from "@/lib/date-utils";
import { fetchTeam, saveMember } from "../services/team-service";

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function TeamView() {
  const { channels, showToast } = useWorkspace();
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | "new" | null>(null);

  const reload = useCallback(
    () =>
      fetchTeam()
        .then((team) => {
          setMembers(team.members);
          setRoles(team.roles);
        })
        .catch((err: unknown) => setError(errorText(err, "Failed to load the team"))),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const assignableRoles = roles.filter((role) => canGrant(currentUser, role.permissions));

  const channelSummary = (member: Member) => {
    if (member.channel_ids.length === 0) return "All channels";
    return member.channel_ids
      .map((id) => channels.find((c) => c.id === id)?.account_name ?? id)
      .join(", ");
  };

  const toggleActive = async (member: Member) => {
    const status = member.status === "active" ? "inactive" : "active";
    if (status === "inactive" && !confirm(`Remove access for ${member.email}?`)) return;
    try {
      await saveMember({ id: member.id, status });
      showToast(status === "active" ? "Access restored" : "Access removed");
      await reload();
    } catch (err: unknown) {
      showToast(errorText(err, "Failed to update team member"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add people, choose their role, and limit which channels they can work on.
          </p>
        </div>
        <Button onClick={() => setEditing("new")} className="gap-2 self-start font-medium sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>Add Member</span>
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead className="w-32">Role</TableHead>
            <TableHead>Channels</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-36">Last sign-in</TableHead>
            <TableHead className="w-40 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!members ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                {error ? "Team could not be loaded." : "Loading team..."}
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const role = roles.find((r) => r.id === member.role_id);
              const locked = member.is_env_owner || (role ? !canGrant(currentUser, role.permissions) : false);
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <span className="block text-sm font-semibold text-foreground">{member.name}</span>
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">
                      {member.role_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {channelSummary(member)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs font-medium">
                      {member.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {member.last_login_at ? formatDisplayDate(member.last_login_at.slice(0, 10)) : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.is_env_owner ? (
                      <span className="text-xs text-muted-foreground">Set in ADMIN_EMAILS</span>
                    ) : locked ? (
                      <span className="text-xs text-muted-foreground">No access to edit</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(member)}
                          className="h-8 w-8 p-0"
                          aria-label={`Edit ${member.email}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(member)} className="h-8 px-2 text-xs">
                          {member.status === "active" ? "Remove access" : "Restore"}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {editing && (
        <MemberDialog
          member={editing === "new" ? null : editing}
          roles={assignableRoles}
          channels={channels}
          channelLimited={currentUser.channel_ids.length > 0}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            showToast("Team member saved");
            await reload();
          }}
        />
      )}
    </div>
  );
}

function MemberDialog({
  member,
  roles,
  channels,
  channelLimited,
  onClose,
  onSaved,
}: {
  member: Member | null;
  roles: Role[];
  channels: { id: string; platform: string; account_name: string }[];
  channelLimited: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const defaultRole = roles.find((r) => r.id === "creator")?.id ?? roles[0]?.id ?? "";
  const [email, setEmail] = useState(member?.email ?? "");
  const [name, setName] = useState(member?.name === member?.email ? "" : (member?.name ?? ""));
  const [roleId, setRoleId] = useState(member?.role_id ?? defaultRole);
  const [allChannels, setAllChannels] = useState(!channelLimited && (member?.channel_ids.length ?? 0) === 0);
  const [channelIds, setChannelIds] = useState<string[]>(member?.channel_ids ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnerRole = roleId === OWNER_ROLE_ID;

  const toggleChannel = (id: string, checked: boolean) =>
    setChannelIds((prev) => (checked ? [...prev, id] : prev.filter((c) => c !== id)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isOwnerRole && !allChannels && channelIds.length === 0) {
      setError("Pick at least one channel, or choose all channels.");
      return;
    }
    try {
      setSubmitting(true);
      await saveMember({
        id: member?.id,
        email: member ? undefined : email,
        name,
        role_id: roleId,
        channel_ids: isOwnerRole || allChannels ? [] : channelIds,
      });
      await onSaved();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save team member"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-6 sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {member ? "Edit Member" : "Add Member"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {member ? member.email : "They get access the next time they sign in with this Google account."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div role="alert" className="shrink-0 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-w-0 flex-1 space-y-4 overflow-y-auto pr-2 pt-1">
            {!member && (
              <div className="space-y-1.5">
                <Label htmlFor="memberEmail">Google email *</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="memberName">Name</Label>
              <Input
                id="memberName"
                placeholder="Filled in from Google if left blank"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={roleId}
                onValueChange={(value) => value && setRoleId(value)}
                items={roles.map((role) => ({ value: role.id, label: role.name }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isOwnerRole ? (
              <p className="text-xs text-muted-foreground">Owners can always access every channel.</p>
            ) : (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Channels</legend>
                {!channelLimited && (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={allChannels} onCheckedChange={(checked) => setAllChannels(checked)} />
                    <span>All channels, including future ones</span>
                  </label>
                )}
                {!allChannels &&
                  channels.map((channel) => (
                    <label key={channel.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={channelIds.includes(channel.id)}
                        onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                      />
                      <span>
                        {channel.platform} — {channel.account_name}
                      </span>
                    </label>
                  ))}
              </fieldset>
            )}
          </div>

          <DialogFooter className="mt-2 shrink-0 border-t pt-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
