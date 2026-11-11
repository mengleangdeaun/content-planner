"use client";

import React, { useState } from "react";
import { ChannelAccount, Platform } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT, Field, FieldRow, FormActions, FormError, FormSection } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/context/workspace-context";

const PLATFORMS = ["Facebook", "Instagram", "LinkedIn", "YouTube", "TikTok"];
const NONE = "none";
const urlProps = { type: "url", inputMode: "url", autoCapitalize: "none", autoCorrect: "off" } as const;

interface ChannelModalProps {
  onClose: () => void;
  channelToEdit?: ChannelAccount | null;
}

// Parent mounts this only while open, so initial state is the form reset.
export function ChannelModal({ onClose, channelToEdit }: ChannelModalProps) {
  const { channels, people, onSaveChannel } = useWorkspace();
  const [platform, setPlatform] = useState<Platform>(channelToEdit?.platform ?? "Facebook");
  const [accountName, setAccountName] = useState(channelToEdit?.account_name ?? "");
  const [handle, setHandle] = useState(channelToEdit?.handle ?? "");
  const [pageUrl, setPageUrl] = useState(channelToEdit?.page_url ?? "");
  const [avatarUrl, setAvatarUrl] = useState(channelToEdit?.avatar_url ?? "");
  const [weeklyQuota, setWeeklyQuota] = useState(String(channelToEdit?.weekly_target_quota || 3));
  const [status, setStatus] = useState<ChannelAccount["status"]>(channelToEdit?.status ?? "Active");
  const [brand, setBrand] = useState(channelToEdit?.brand ?? "");
  const [owner, setOwner] = useState(channelToEdit?.owner_email || NONE);
  const [notes, setNotes] = useState(channelToEdit?.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brands = [...new Set(channels.map((c) => c.brand).filter(Boolean))] as string[];
  const platformOptions = [...new Set([...PLATFORMS, platform])].map((p) => ({ value: p, label: p === "Twitter" ? "Twitter / X" : p }));
  // "Archived" only shows for older rows that used it as a status; archiving is its own action now.
  const statusOptions = ["Active", "Paused", ...(status === "Archived" ? ["Archived"] : [])].map((s) => ({ value: s, label: s }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!accountName.trim()) return setError("Account name is required.");

    try {
      setIsSubmitting(true);
      await onSaveChannel({
        id: channelToEdit?.id,
        platform,
        account_name: accountName.trim(),
        handle: handle.trim() || undefined,
        page_url: pageUrl.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        weekly_target_quota: Number(weeklyQuota),
        status,
        brand: brand.trim() || undefined,
        owner_email: owner === NONE ? undefined : owner,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save channel");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title={channelToEdit ? "Edit channel" : "Add channel"}
      description="A social account or page you publish to."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="channel-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : channelToEdit ? "Save changes" : "Add channel"}
            </Button>
          </FormActions>
        </div>
      }
    >
      <form id="channel-form" onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Account">
          <FieldRow>
            <Field label="Platform" htmlFor="platform" required>
              <ResponsiveSelect id="platform" value={platform} onValueChange={setPlatform} options={platformOptions} />
            </Field>
            <Field label="Account name" htmlFor="accountName" required>
              <Input
                id="accountName"
                className={CONTROL_HEIGHT}
                placeholder="e.g. ABC, Main Page"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </Field>
            <Field label="Handle" htmlFor="handle">
              <Input
                id="handle"
                className={CONTROL_HEIGHT}
                placeholder="@brand_official"
                autoCapitalize="none"
                autoCorrect="off"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </Field>
            <Field label="Brand" htmlFor="brand" hint="Groups channels">
              <Input
                id="brand"
                list="brand-options"
                className={CONTROL_HEIGHT}
                placeholder="e.g. ABC Group"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
              <datalist id="brand-options">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>
          </FieldRow>
          <Field label="Page link" htmlFor="pageUrl">
            <Input id="pageUrl" {...urlProps} className={CONTROL_HEIGHT} placeholder="https://facebook.com/yourpage" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} />
          </Field>
          <Field label="Avatar image link" htmlFor="avatarUrl">
            <Input id="avatarUrl" {...urlProps} className={CONTROL_HEIGHT} placeholder="https://" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </Field>
        </FormSection>

        <FormSection title="Planning">
          <FieldRow columns={3}>
            <Field label="Posts per week" htmlFor="weeklyQuota" required>
              <Input
                id="weeklyQuota"
                type="number"
                min="1"
                max="50"
                inputMode="numeric"
                className={CONTROL_HEIGHT}
                value={weeklyQuota}
                onChange={(e) => setWeeklyQuota(e.target.value)}
                required
              />
            </Field>
            <Field label="Status" htmlFor="channelStatus">
              <ResponsiveSelect
                id="channelStatus"
                value={status}
                onValueChange={(value) => setStatus(value as ChannelAccount["status"])}
                options={statusOptions}
              />
            </Field>
            <Field label="Owner" htmlFor="owner">
              <ResponsiveSelect
                id="owner"
                value={owner}
                onValueChange={setOwner}
                options={[{ value: NONE, label: "No owner" }, ...people.map((p) => ({ value: p.email, label: p.name }))]}
              />
            </Field>
          </FieldRow>
          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              rows={2}
              placeholder="Audience, brand voice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </Field>
        </FormSection>
      </form>
    </ResponsiveModal>
  );
}
