"use client";

import React, { useState } from "react";
import { ContentItem, ContentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  CONTROL_HEIGHT,
  Field,
  FieldRow,
  FormActions,
  FormError,
  FormSection,
  ToggleChip,
} from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Video, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { PostFormState, useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { resolveChannelId, statusPermission } from "@/lib/auth/permissions";
import { BOARD_STATUSES, LIVE_URL_REQUIRED, PRIORITIES, nextStatuses } from "@/lib/workflow";
import { formatFlags } from "@/lib/settings-rules";

const NONE = "none";
const FORM_ID = "post-form";
const urlProps = { type: "url", inputMode: "url", autoCapitalize: "none", autoCorrect: "off" } as const;

// Mounted only while open, so each open starts from fresh values.
export function CreatePostModal() {
  const { postForm } = useWorkspace();
  return postForm ? <PostForm form={postForm} /> : null;
}

function PostForm({ form }: { form: PostFormState }) {
  const { channels, contentTypes, campaigns, people, closePostForm, onCreateContent, onUpdateContent } =
    useWorkspace();
  const { can } = useAuth();

  const editing = form.mode === "edit" ? form.item : null;
  const source: Partial<ContentItem> = form.mode === "edit" ? form.item : (form.preset ?? {});
  // A brand-new post (not an edit or duplicate) starts from its type's default format and brief.
  const isFresh = form.mode === "create" && source.title === undefined;
  const typeOf = (name?: string) => contentTypes.find((t) => t.name === name);
  const initialType = source.content_type ?? contentTypes[0]?.name ?? "";
  const initialFormat = isFresh ? formatFlags(typeOf(initialType)?.default_format) : null;

  const [title, setTitle] = useState(source.title ?? "");
  const [publishDate, setPublishDate] = useState(source.publish_date ?? format(new Date(), "yyyy-MM-dd"));
  const [publishTime, setPublishTime] = useState(source.publish_time ?? "");
  const [dueDate, setDueDate] = useState(source.due_date ?? "");
  const [channelIds, setChannelIds] = useState<string[]>(() => {
    const id = source.platform ? resolveChannelId(source as ContentItem, channels) : channels[0]?.id;
    return id ? [id] : [];
  });
  const [contentType, setContentType] = useState(initialType);
  const [campaignId, setCampaignId] = useState(source.campaign_id || NONE);
  const [assignee, setAssignee] = useState(source.assignee_email || NONE);
  const [reviewer, setReviewer] = useState(source.reviewer_email || NONE);
  const [priority, setPriority] = useState(source.priority || "Normal");
  const [isPoster, setIsPoster] = useState(source.is_poster ?? initialFormat?.poster ?? true);
  const [isVideo, setIsVideo] = useState(source.is_video ?? initialFormat?.video ?? false);
  const [status, setStatus] = useState<ContentStatus>(
    (form.mode === "edit" && form.presetStatus) || source.status || "Draft"
  );
  const [workspaceUrl, setWorkspaceUrl] = useState(source.workspace_file_url ?? "");
  const [liveUrl, setLiveUrl] = useState(source.live_post_url ?? "");
  const [copyText, setCopyText] = useState(
    source.copy_text ?? (isFresh ? (typeOf(initialType)?.brief_template ?? "") : "")
  );

  // Switching type on a new post applies that type's defaults, without overwriting a caption already written.
  const changeType = (name: string) => {
    const previousBrief = typeOf(contentType)?.brief_template ?? "";
    setContentType(name);
    if (editing) return;
    const next = typeOf(name);
    const flags = formatFlags(next?.default_format);
    if (flags) {
      setIsPoster(flags.poster);
      setIsVideo(flags.video);
    }
    if (!copyText.trim() || copyText === previousBrief) setCopyText(next?.brief_template ?? "");
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = (editing ? [editing.status, ...nextStatuses(editing.status)] : [...BOARD_STATUSES])
    .filter((option) => option === editing?.status || can(statusPermission(option)))
    .map((option) => ({ value: option, label: option }));

  const peopleOptions = [
    { value: NONE, label: "Unassigned" },
    ...people.map((p) => ({ value: p.email, label: p.name })),
  ];
  const campaignOptions = [
    { value: NONE, label: "No campaign" },
    ...campaigns.map((c) => ({ value: c.id, label: c.name })),
  ];
  const channelOptions = channels.map((c) => ({ value: c.id, label: `${c.platform} — ${c.account_name}` }));
  const typeOptions = contentTypes.map((ct) => ({ value: ct.name, label: ct.name }));
  const priorityOptions = PRIORITIES.map((option) => ({ value: option, label: option }));

  const showLiveUrl = status === "Scheduled" || status === "Published" || Boolean(source.live_post_url);

  const toggleChannel = (id: string) =>
    setChannelIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Add a title.");
    if (!isPoster && !isVideo) return setError("Choose at least one format: Poster, Video, or both.");
    if (!publishDate) return setError("Choose a publish date.");
    // A post whose channel was archived has no selection, and can still be edited.
    if (!editing && channelIds.length === 0) return setError("Choose at least one channel.");
    if (status === "Published" && !liveUrl.trim()) return setError(LIVE_URL_REQUIRED);

    const fields = {
      title: title.trim(),
      publish_date: publishDate,
      publish_time: publishTime,
      due_date: dueDate,
      content_type: contentType,
      campaign_id: campaignId === NONE ? "" : campaignId,
      assignee_email: assignee === NONE ? "" : assignee,
      reviewer_email: reviewer === NONE ? "" : reviewer,
      priority: priority === "Normal" && !editing?.priority ? "" : priority, // Blank already means Normal.
      status,
      copy_text: copyText.trim(),
      workspace_file_url: workspaceUrl.trim(),
      live_post_url: liveUrl.trim(),
      is_poster: isPoster,
      is_video: isVideo,
    };

    try {
      setIsSubmitting(true);
      if (editing) {
        // Channel fields go only if the channel was actually changed.
        const moved = channelIds[0] !== resolveChannelId(editing, channels);
        const channel = moved ? channels.find((c) => c.id === channelIds[0]) : undefined;
        const next: Partial<ContentItem> = {
          ...fields,
          channel_id: channel?.id,
          platform: channel?.platform,
          account_name: channel?.account_name,
        };
        // Send only what changed, so this cannot overwrite someone else's edit to other fields.
        const current = editing as unknown as Record<string, unknown>;
        const changed = Object.fromEntries(
          Object.entries(next).filter(([key, value]) => value !== undefined && value !== (current[key] ?? ""))
        );
        if (Object.keys(changed).length > 0) {
          await onUpdateContent({ ...changed, id: editing.id, expected_updated_at: editing.updated_at ?? "" });
        }
      } else {
        await onCreateContent({ ...fields, channel_ids: channelIds });
      }
      closePostForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save this post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={closePostForm}
      size="lg"
      title={editing ? "Edit post" : "Create post"}
      description={editing ? editing.title : "Pick several channels to create one post for each."}
      footer={
        // In the fixed footer, so an error is visible wherever the form is scrolled to.
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={closePostForm} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editing ? "Save changes" : "Create post"}
            </Button>
          </FormActions>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Basics">
          <Field label="Title" htmlFor="title" required>
            <Input
              id="title"
              className={CONTROL_HEIGHT}
              placeholder="e.g. 5 signs you need a systems strategy"
              value={title}
              enterKeyHint="next"
              autoCapitalize="sentences"
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>

          <Field label={editing ? "Channel" : "Channels"} htmlFor={editing ? "channel" : undefined} required={!editing}>
            {editing ? (
              <SearchableSelect
                id="channel"
                value={channelIds[0] ?? ""}
                onValueChange={(value) => setChannelIds([value])}
                options={channelOptions}
                placeholder="Select a channel"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {channelOptions.map((c) => (
                  <ToggleChip key={c.value} active={channelIds.includes(c.value)} onClick={() => toggleChannel(c.value)}>
                    <span className="truncate">{c.label}</span>
                  </ToggleChip>
                ))}
                {channelOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Add a channel account first.</p>
                )}
              </div>
            )}
          </Field>

          <FieldRow>
            <Field label="Content type" htmlFor="contentType">
              <SearchableSelect
                id="contentType"
                value={contentType}
                onValueChange={changeType}
                options={typeOptions}
                placeholder="Select a type"
              />
            </Field>
            <Field label="Format" required>
              <div className="flex flex-wrap gap-2">
                <ToggleChip active={isPoster} onClick={() => setIsPoster(!isPoster)}>
                  <ImageIcon /> Poster
                </ToggleChip>
                <ToggleChip active={isVideo} onClick={() => setIsVideo(!isVideo)}>
                  <Video /> Video
                </ToggleChip>
              </div>
            </Field>
          </FieldRow>
        </FormSection>

        <FormSection title="Schedule">
          <FieldRow columns={3}>
            <Field label="Publish date" htmlFor="publishDate" required>
              <ResponsiveDatePicker id="publishDate" value={publishDate} onChange={setPublishDate} clearable={false} />
            </Field>
            <Field label="Publish time" htmlFor="publishTime">
              <Input
                id="publishTime"
                type="time"
                className={CONTROL_HEIGHT}
                value={publishTime}
                onChange={(e) => setPublishTime(e.target.value)}
              />
            </Field>
            <Field label="Due date" htmlFor="dueDate">
              <ResponsiveDatePicker id="dueDate" value={dueDate} onChange={setDueDate} placeholder="No due date" />
            </Field>
          </FieldRow>
        </FormSection>

        <FormSection title="Team & workflow">
          <FieldRow>
            <Field label="Assignee" htmlFor="assignee">
              <SearchableSelect id="assignee" value={assignee} onValueChange={setAssignee} options={peopleOptions} />
            </Field>
            <Field label="Reviewer" htmlFor="reviewer">
              <SearchableSelect id="reviewer" value={reviewer} onValueChange={setReviewer} options={peopleOptions} />
            </Field>
            <Field label="Status" htmlFor="status">
              <ResponsiveSelect
                id="status"
                value={status}
                onValueChange={(value) => setStatus(value as ContentStatus)}
                options={statusOptions}
              />
            </Field>
            <Field label="Priority" htmlFor="priority">
              <ResponsiveSelect id="priority" value={priority} onValueChange={setPriority} options={priorityOptions} />
            </Field>
            <Field label="Campaign" htmlFor="campaign">
              <SearchableSelect id="campaign" value={campaignId} onValueChange={setCampaignId} options={campaignOptions} />
            </Field>
          </FieldRow>
        </FormSection>

        <FormSection title="Content & links">
          <Field label="Caption" htmlFor="copyText" hint="Optional">
            <Textarea
              id="copyText"
              rows={4}
              placeholder="Caption, hooks, hashtags..."
              value={copyText}
              onChange={(e) => setCopyText(e.target.value)}
              className="resize-none"
            />
          </Field>
          <Field label="Document link" htmlFor="workspaceUrl" hint="Google Docs, Figma">
            <Input
              id="workspaceUrl"
              {...urlProps}
              className={CONTROL_HEIGHT}
              placeholder="https://"
              value={workspaceUrl}
              onChange={(e) => setWorkspaceUrl(e.target.value)}
            />
          </Field>
          {showLiveUrl && (
            <Field label="Live post link" htmlFor="liveUrl" required={status === "Published"}>
              <Input
                id="liveUrl"
                {...urlProps}
                className={CONTROL_HEIGHT}
                placeholder="https://"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                required={status === "Published"}
              />
            </Field>
          )}
        </FormSection>
      </form>
    </ResponsiveModal>
  );
}
