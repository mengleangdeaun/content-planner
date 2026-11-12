"use client";

import { useConfirm } from "@/components/shared/confirm-dialog";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { OWNER_ROLE_ID, PERMISSION_GROUPS, Permission, Role, canGrant } from "@/lib/auth/permissions";
import { deleteRole, fetchRoles, saveRole } from "../services/team-service";

const errorText = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export function RolesView() {
  const { showToast } = useWorkspace();
  const { currentUser, can } = useAuth();
  const confirm = useConfirm();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Permission[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const reload = useCallback(
    () =>
      fetchRoles()
        .then((result) => setRoles(result.roles))
        .catch((err: unknown) => setError(errorText(err, "Failed to load roles"))),
    []
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const permissionsOf = (role: Role) => drafts[role.id] ?? role.permissions;

  const isLocked = (role: Role) =>
    role.id === OWNER_ROLE_ID || !canGrant(currentUser, role.permissions);

  const toggle = (role: Role, permission: Permission, checked: boolean) => {
    const current = permissionsOf(role);
    setDrafts((prev) => ({
      ...prev,
      [role.id]: checked ? [...current, permission] : current.filter((p) => p !== permission),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      for (const role of roles ?? []) {
        const permissions = drafts[role.id];
        if (permissions) await saveRole({ id: role.id, name: role.name, permissions });
      }
      setDrafts({});
      showToast("Roles saved");
      await reload();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to save roles"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    const ok = await confirm({
      title: `Delete the "${role.name}" role?`,
      description: "It disappears from the role list. A role that is still assigned to someone can't be deleted.",
      confirmLabel: "Delete role",
    });
    if (!ok) return;
    try {
      await deleteRole(role.id);
      showToast("Role deleted");
      await reload();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to delete role"));
    }
  };

  const hasChanges = Object.keys(drafts).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Choose what each role can do. Changes apply within about 30 seconds."
        actions={
          <>
            <Button variant="outline" onClick={() => setAdding(true)} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>New Role</span>
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="font-medium">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      />

      {error && (
        <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {!roles ? (
        <p className="text-sm text-muted-foreground">{error ? "Roles could not be loaded." : "Loading roles..."}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-52">Permission</TableHead>
              {roles.map((role) => (
                <TableHead key={role.id} className="min-w-24 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>{role.name}</span>
                    {!role.is_system && can("roles.manage") && !isLocked(role) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(role)}
                        className="h-6 w-6 p-0 hover:text-destructive"
                        aria-label={`Delete ${role.name} role`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSION_GROUPS.map((group) => (
              <Fragment key={group.label}>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell
                    colSpan={roles.length + 1}
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {group.label}
                  </TableCell>
                </TableRow>
                {group.permissions.map((permission) => (
                  <TableRow key={permission.key}>
                    <TableCell className="text-sm">{permission.label}</TableCell>
                    {roles.map((role) => (
                      <TableCell key={role.id} className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            aria-label={`${role.name}: ${permission.label}`}
                            checked={permissionsOf(role).includes(permission.key)}
                            disabled={isLocked(role) || !can(permission.key)}
                            onCheckedChange={(checked) => toggle(role, permission.key, checked)}
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      {adding && (
        <NewRoleDialog
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            showToast("Role created. Tick its permissions, then save.");
            await reload();
          }}
        />
      )}
    </div>
  );
}

function NewRoleDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await saveRole({ name, permissions: ["content.view"] });
      await onSaved();
    } catch (err: unknown) {
      setError(errorText(err, "Failed to create role"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">New Role</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            It starts with view access only.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="roleName">Role name *</Label>
            <Input id="roleName" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
