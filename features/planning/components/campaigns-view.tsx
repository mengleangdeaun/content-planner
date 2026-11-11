"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT, Field, FieldRow, FormActions, FormError } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { formatShortDate } from "@/lib/date-utils";
import { Campaign, CampaignStatus } from "@/lib/types";

const STATUSES: CampaignStatus[] = ["Planned", "Active", "Completed", "Archived"];

export function CampaignsView() {
  const { campaigns, items } = useWorkspace();
  const { can } = useAuth();
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);
  const canManage = can("planning.manage");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Group posts around a goal and track how far along each campaign is.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setEditing("new")} className="gap-2 self-start font-medium sm:self-auto">
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </Button>
        )}
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No campaigns yet.{canManage && " Create one, then choose it when planning a post."}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const posts = items.filter((i) => i.campaign_id === campaign.id && i.status !== "Archived");
            const published = posts.filter((i) => i.status === "Published").length;
            const percent = posts.length ? Math.round((published / posts.length) * 100) : 0;
            return (
              <Card key={campaign.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">{campaign.name}</h2>
                  <Badge variant="outline" className="shrink-0 text-xs">{campaign.status}</Badge>
                </div>
                {campaign.goal && <p className="line-clamp-2 text-xs text-muted-foreground">{campaign.goal}</p>}
                <p className="text-xs text-muted-foreground">
                  {formatShortDate(campaign.start_date)} – {formatShortDate(campaign.end_date)}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{published} of {posts.length} published</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                </div>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(campaign)} className="h-7 text-xs">
                    Edit
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <CampaignDialog campaign={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function CampaignDialog({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const { onSaveCampaign } = useWorkspace();
  const [name, setName] = useState(campaign?.name ?? "");
  const [goal, setGoal] = useState(campaign?.goal ?? "");
  const [startDate, setStartDate] = useState(campaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(campaign?.end_date ?? "");
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status || "Planned");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSaving(true);
      await onSaveCampaign({
        id: campaign?.id,
        name,
        goal,
        start_date: startDate,
        end_date: endDate,
        status,
        owner_email: campaign?.owner_email,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title={campaign ? "Edit campaign" : "New campaign"}
      description="Set the campaign goal and the dates it runs."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" form="campaign-form" disabled={isSaving}>{isSaving ? "Saving..." : "Save campaign"}</Button>
          </FormActions>
        </div>
      }
    >
      <form id="campaign-form" onSubmit={submit} className="space-y-3">
        <Field label="Name" htmlFor="campaign-name" required>
          <Input
            id="campaign-name"
            className={CONTROL_HEIGHT}
            value={name}
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Goal" htmlFor="campaign-goal">
          <Textarea id="campaign-goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} className="resize-none" />
        </Field>
        <FieldRow>
          <Field label="Start date" htmlFor="campaign-start">
            <ResponsiveDatePicker id="campaign-start" value={startDate} onChange={setStartDate} placeholder="Start" />
          </Field>
          <Field label="End date" htmlFor="campaign-end">
            <ResponsiveDatePicker id="campaign-end" value={endDate} onChange={setEndDate} placeholder="End" />
          </Field>
        </FieldRow>
        <Field label="Status" htmlFor="campaign-status">
          <ResponsiveSelect
            id="campaign-status"
            value={status}
            onValueChange={(value) => setStatus(value as CampaignStatus)}
            options={STATUSES.map((option) => ({ value: option, label: option }))}
          />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
