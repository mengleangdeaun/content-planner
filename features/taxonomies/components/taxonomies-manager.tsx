"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Archive, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT, Field, FieldRow, FormActions, FormError, FormSection } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { TYPE_COLORS, TYPE_FORMATS, typeMix } from "@/lib/settings-rules";
import { ContentTypeConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { UpgradeSheetButton } from "@/features/integrations";
import { TYPE_COLOR_CLASSES, TypeBadge } from "./type-badge";

export function TaxonomiesManager() {
  const { contentTypes, items, onDeleteContentType, showToast } = useWorkspace();
  const canManage = useAuth().can("types.manage");
  const [editing, setEditing] = useState<ContentTypeConfig | "new" | null>(null);

  const month = format(new Date(), "yyyy-MM");
  const mix = typeMix(items, contentTypes, month);
  const targetTotal = contentTypes.reduce((sum, t) => sum + (t.target_share_pct || 0), 0);
  const usage = (name: string) => items.filter((i) => i.content_type === name && i.status !== "Archived").length;

  const archive = async (type: ContentTypeConfig) => {
    const used = usage(type.name);
    const note = used ? ` Its ${used} post${used === 1 ? "" : "s"} keep the type, but it can't be picked for new posts.` : "";
    if (!confirm(`Archive "${type.name}"?${note}`)) return;
    try {
      await onDeleteContentType(type.id);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to archive content type");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Content Types</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The kinds of content you plan, with a color, a target share of each month, and a starting brief.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <UpgradeSheetButton />
          {canManage && (
            <Button onClick={() => setEditing("new")} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Content Type</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Content mix, {format(new Date(), "MMMM yyyy")}</h2>
          {targetTotal !== 100 && targetTotal > 0 && (
            <span className="text-xs text-amber-700 dark:text-amber-400">Targets add up to {targetTotal}%, not 100%.</span>
          )}
        </div>
        <ul className="space-y-2.5">
          {mix.map((row) => (
            <li key={row.name} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <TypeBadge name={row.name} />
                <span className="text-muted-foreground">
                  {row.actualPct}% of posts{row.targetPct > 0 && ` · target ${row.targetPct}%`}
                </span>
              </div>
              <div className="relative h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${row.actualPct}%` }} />
                {row.targetPct > 0 && (
                  <span
                    aria-hidden
                    className="absolute -top-0.5 h-2.5 w-0.5 rounded bg-foreground"
                    style={{ left: `calc(${row.targetPct}% - 1px)` }}
                  />
                )}
              </div>
            </li>
          ))}
          {mix.length === 0 && <li className="text-sm text-muted-foreground">No content types yet.</li>}
        </ul>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contentTypes.map((type) => (
          <Card key={type.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <TypeBadge name={type.name} className="text-sm" />
              <span className="text-xs text-muted-foreground">{usage(type.name)} posts</span>
            </div>
            <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{type.description || "No description."}</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Target share</dt>
                <dd className="font-medium text-foreground">{type.target_share_pct ? `${type.target_share_pct}%` : "None"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Default format</dt>
                <dd className="font-medium text-foreground">
                  {TYPE_FORMATS.find((f) => f.value === (type.default_format ?? ""))?.label ?? "No default"}
                </dd>
              </div>
            </dl>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(type)} className="h-10 flex-1 gap-1.5 md:h-8">
                  <Pencil /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => archive(type)} className="h-10 flex-1 gap-1.5 md:h-8">
                  <Archive /> Archive
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {editing && <TypeDialog type={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TypeDialog({ type, onClose }: { type: ContentTypeConfig | null; onClose: () => void }) {
  const { items, onAddContentType, onUpdateContentType } = useWorkspace();
  const [name, setName] = useState(type?.name ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [color, setColor] = useState(type?.badge_color ?? "");
  const [target, setTarget] = useState(type?.target_share_pct ? String(type.target_share_pct) : "");
  const [defaultFormat, setDefaultFormat] = useState(type?.default_format ?? "");
  const [brief, setBrief] = useState(type?.brief_template ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renaming = type && name.trim() && name.trim() !== type.name;
  const affected = type ? items.filter((i) => i.content_type === type.name).length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fields = {
      name: name.trim(),
      description: description.trim(),
      badge_color: color,
      target_share_pct: target === "" ? undefined : Number(target),
      default_format: defaultFormat,
      brief_template: brief,
    };
    try {
      setIsSaving(true);
      if (type) await onUpdateContentType({ ...type, ...fields, target_share_pct: fields.target_share_pct ?? 0 });
      else await onAddContentType(fields);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save content type");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title={type ? "Edit content type" : "New content type"}
      description="Types appear in the post form and the content mix."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" form="type-form" disabled={isSaving}>{isSaving ? "Saving..." : "Save type"}</Button>
          </FormActions>
        </div>
      }
    >
      <form id="type-form" onSubmit={submit} className="space-y-6">
        <FormSection title="Basics">
          <Field label="Name" htmlFor="type-name" required>
            <Input
              id="type-name"
              className={CONTROL_HEIGHT}
              placeholder="e.g. Case Study"
              value={name}
              autoCapitalize="words"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          {renaming && affected > 0 && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Renaming also updates the {affected} post{affected === 1 ? "" : "s"} that use &quot;{type?.name}&quot;.
            </p>
          )}
          <Field label="Description" htmlFor="type-description">
            <Textarea
              id="type-description"
              rows={2}
              placeholder="When creators should use this type..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
            />
          </Field>
          <Field label="Color">
            <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
              {["", ...TYPE_COLORS].map((option) => (
                <button
                  key={option || "none"}
                  type="button"
                  role="radio"
                  aria-checked={color === option}
                  aria-label={option || "No color"}
                  title={option || "No color"}
                  onClick={() => setColor(option)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8 md:w-8",
                    color === option ? "border-foreground" : "border-transparent"
                  )}
                >
                  <span className={cn("h-7 w-7 rounded-full md:h-5 md:w-5", option ? TYPE_COLOR_CLASSES[option].swatch : "border bg-muted")} />
                </button>
              ))}
            </div>
          </Field>
        </FormSection>

        <FormSection title="Planning defaults">
          <FieldRow>
            <Field label="Target share" htmlFor="type-target" hint="% of monthly posts">
              <Input
                id="type-target"
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                className={CONTROL_HEIGHT}
                placeholder="e.g. 40"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </Field>
            <Field label="Default format" htmlFor="type-format">
              <ResponsiveSelect
                id="type-format"
                value={defaultFormat}
                onValueChange={setDefaultFormat}
                options={TYPE_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </Field>
          </FieldRow>
          <Field label="Brief template" htmlFor="type-brief" hint="Starts the caption of new posts">
            <Textarea
              id="type-brief"
              rows={4}
              placeholder={"Hook:\nKey points:\nCall to action:"}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="resize-none"
            />
          </Field>
        </FormSection>
      </form>
    </ResponsiveModal>
  );
}
