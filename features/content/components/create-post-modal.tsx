"use client";

import React, { useState } from "react";
import { ContentStatus } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PlusCircle,
  Link as LinkIcon,
  Video,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useWorkspace } from "@/context/workspace-context";

export function CreatePostModal() {
  const {
    channels,
    contentTypes,
    isCreateModalOpen,
    setIsCreateModalOpen,
    onCreateContent,
  } = useWorkspace();

  const [title, setTitle] = useState("");
  const [publishDate, setPublishDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Selected Channel ID & Content Type state
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");

  const effectiveChannelId = selectedChannelId && channels.some((c) => c.id === selectedChannelId)
    ? selectedChannelId
    : channels[0]?.id || "CHAN-101";

  const effectiveContentType = contentType && contentTypes.some((ct) => ct.name === contentType)
    ? contentType
    : contentTypes[0]?.name || "Educational";

  // Format Checkboxes
  const [isPoster, setIsPoster] = useState(true);
  const [isVideo, setIsVideo] = useState(false);

  const [status, setStatus] = useState<ContentStatus>("Draft");
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [copyText, setCopyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Content title or internal headline is required");
      return;
    }

    if (!isPoster && !isVideo) {
      setError("Please check at least one format: Poster, Video, or both.");
      return;
    }

    if (!publishDate) {
      setError("Please select a target publication date.");
      return;
    }

    const channel = channels.find((c) => c.id === effectiveChannelId) || channels[0];

    try {
      setIsSubmitting(true);
      await onCreateContent({
        title: title.trim(),
        publish_date: publishDate,
        created_at: new Date().toISOString(),
        platform: channel?.platform || "Facebook",
        account_name: channel?.account_name || "ABC",
        channel_id: channel?.id,
        content_type: effectiveContentType,
        status,
        copy_text: copyText.trim(),
        workspace_file_url: workspaceUrl.trim(),
        is_poster: isPoster,
        is_video: isVideo,
      });

      // Reset Form
      setTitle("");
      setCopyText("");
      setWorkspaceUrl("");
      setStatus("Draft");
      setIsPoster(true);
      setIsVideo(false);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create piece";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedDate = publishDate ? new Date(`${publishDate}T00:00:00`) : undefined;

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold tracking-tight truncate">
                Create Content Piece
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Register a new asset in the schedule ledger and sync with cloud records.
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
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pr-2 space-y-4 pt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Working Title / Internal Headline *
            </Label>
            <Input
              id="title"
              placeholder="e.g. 5 Signs You Need Systems Strategy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Target Channel Page & Content Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Channel & Page
              </Label>
              <Select
                value={effectiveChannelId}
                onValueChange={(val) => val && setSelectedChannelId(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.platform} — {ch.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Strategic Content Type
              </Label>
              <Select
                value={effectiveContentType}
                onValueChange={(val) => val && setContentType(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Content Type" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.name}>
                      {ct.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Media Format Specification: Poster, Video, or Both */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Media Format Required *
              </Label>
              <span className="text-xs text-muted-foreground">Select one or both formats</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsPoster(!isPoster)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-left transition-[transform,border-color,background-color,box-shadow] duration-150 ease-[var(--ease-out)] active:scale-[0.98] cursor-pointer",
                  isPoster
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                    : "border-input bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-md", isPoster ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Poster / Graphic</div>
                    <div className="text-[11px] text-muted-foreground">Still images, carousels</div>
                  </div>
                </div>
                {isPoster && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setIsVideo(!isVideo)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-left transition-[transform,border-color,background-color,box-shadow] duration-150 ease-[var(--ease-out)] active:scale-[0.98] cursor-pointer",
                  isVideo
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary shadow-xs"
                    : "border-input bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("p-1.5 rounded-md", isVideo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Short Video</div>
                    <div className="text-[11px] text-muted-foreground">Reels, TikToks, Shorts</div>
                  </div>
                </div>
                {isVideo && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
              </button>
            </div>
          </div>

          {/* Date Picker & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Publication Date *
              </Label>
              <DatePicker
                date={parsedDate}
                onSelectDate={(d) => setPublishDate(d ? format(d, "yyyy-MM-dd") : "")}
                placeholder="Pick target date"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Initial Status
              </Label>
              <Select
                value={status}
                onValueChange={(val) => val && setStatus(val as ContentStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="In Production">In Production</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="In Revise">In Revise</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Workspace / Google Doc URL */}
          <div className="space-y-1.5">
            <Label htmlFor="workspaceUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Connected Workspace Document (Google Docs / Figma URL)
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="workspaceUrl"
                type="url"
                placeholder="https://docs.google.com/document/d/..."
                value={workspaceUrl}
                onChange={(e) => setWorkspaceUrl(e.target.value)}
                className="pl-9 font-mono text-xs"
              />
            </div>
          </div>

          {/* Social Caption Draft */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="copyText" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Caption Copy / Post Script
              </Label>
              <span className="text-xs text-muted-foreground">Optional initial draft</span>
            </div>
            <Textarea
              id="copyText"
              rows={3}
              placeholder="Paste social post caption, hooks, hashtags..."
              value={copyText}
              onChange={(e) => setCopyText(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-3 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving Piece..." : "Register Content Piece"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
