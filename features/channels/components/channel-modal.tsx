"use client";

import React, { useState } from "react";
import { ChannelAccount, Platform } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Share2 } from "lucide-react";

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (channel: Omit<ChannelAccount, "id"> & { id?: string }) => Promise<void>;
  channelToEdit?: ChannelAccount | null;
}

export function ChannelModal({
  isOpen,
  onClose,
  onSave,
  channelToEdit,
}: ChannelModalProps) {
  // Parent mounts this only while open, so initial state is the form reset.
  const [platform, setPlatform] = useState<Platform>(channelToEdit?.platform ?? "Facebook");
  const [accountName, setAccountName] = useState(channelToEdit?.account_name ?? "");
  const [handle, setHandle] = useState(channelToEdit?.handle ?? "");
  const [pageUrl, setPageUrl] = useState(channelToEdit?.page_url ?? "");
  const [avatarUrl, setAvatarUrl] = useState(channelToEdit?.avatar_url ?? "");
  const [weeklyQuota, setWeeklyQuota] = useState(String(channelToEdit?.weekly_target_quota || 3));
  const [status, setStatus] = useState<"Active" | "Paused" | "Archived">(channelToEdit?.status ?? "Active");
  const [notes, setNotes] = useState(channelToEdit?.notes ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountName.trim()) {
      setError("Account or page name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: channelToEdit?.id,
        platform,
        account_name: accountName.trim(),
        handle: handle.trim() || undefined,
        page_url: pageUrl.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        weekly_target_quota: Number(weeklyQuota) || 3,
        status,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save channel";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight truncate">
                {channelToEdit ? "Edit Channel Account" : "Add Publishing Channel"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Register brand profiles, social accounts, and target weekly output.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pr-1.5 space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Platform *
              </Label>
              <Select
                value={platform}
                onValueChange={(val) => val && setPlatform(val as Platform)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Twitter">Twitter / X</SelectItem>
                  <SelectItem value="Pinterest">Pinterest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="accountName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account Name *
              </Label>
              <Input
                id="accountName"
                placeholder="e.g. ABC, Main Page"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="handle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Social Handle
              </Label>
              <Input
                id="handle"
                placeholder="@brand_official"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weeklyQuota" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Target Quota
              </Label>
              <Input
                id="weeklyQuota"
                type="number"
                min="1"
                max="50"
                value={weeklyQuota}
                onChange={(e) => setWeeklyQuota(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pageUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profile / Page Web Link
            </Label>
            <Input
              id="pageUrl"
              type="url"
              placeholder="https://facebook.com/yourpage"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatarUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profile Avatar Image URL
            </Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/brand-avatar.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Account Status
            </Label>
            <Select
              value={status}
              onValueChange={(val) =>
                val && setStatus(val as "Active" | "Paused" | "Archived")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active (Publishing)</SelectItem>
                <SelectItem value="Paused">Paused (On Hold)</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Strategy / Audience Notes
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Target demographics, brand voice nuances..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : channelToEdit ? "Update Channel" : "Save Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
