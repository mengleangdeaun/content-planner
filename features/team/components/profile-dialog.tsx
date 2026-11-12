"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT, Field, FormActions, FormError } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { MAX_NAME_LENGTH } from "@/lib/auth/permissions";

export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const { currentUser, updateProfile } = useAuth();
  const { refreshData, showToast } = useWorkspace();
  // An unset name falls back to the email; start the field empty rather than prefilled with it.
  const [name, setName] = useState(currentUser.name === currentUser.email ? "" : currentUser.name);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSaving(true);
      await updateProfile(name.trim());
      showToast("Your name was updated");
      refreshData(); // So pickers and the timeline show the new name.
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update your name.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title="Your profile"
      description="How you appear to your team."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="profile-form" disabled={isSaving || !name.trim()}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </FormActions>
        </div>
      }
    >
      <form id="profile-form" onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4">
          <PersonAvatar name={name || currentUser.email} avatarUrl={currentUser.avatar_url} size="lg" />
          <div className="min-w-0 space-y-0.5 text-sm">
            <p className="truncate font-medium text-foreground">{currentUser.email}</p>
            <p className="text-muted-foreground">{currentUser.role_name}</p>
            <p className="text-xs text-muted-foreground">Your photo comes from your Google account.</p>
          </div>
        </div>
        <Field label="Name" htmlFor="profile-name" required>
          <Input
            id="profile-name"
            className={CONTROL_HEIGHT}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="name"
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
