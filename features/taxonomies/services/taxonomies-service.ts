import { ContentTypeConfig } from "@/lib/types";

export async function addContentTypeConfig(
  type: Omit<ContentTypeConfig, "id">
): Promise<ContentTypeConfig> {
  const res = await fetch("/api/taxonomies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add-content-type", data: type }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to add content category");
  }
  return json.item;
}

export async function updateContentTypeConfig(
  type: ContentTypeConfig
): Promise<ContentTypeConfig> {
  const res = await fetch("/api/taxonomies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update-content-type", data: type }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to update content category");
  }
  return json.item;
}

export async function deleteContentTypeConfig(id: string): Promise<void> {
  const res = await fetch("/api/taxonomies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete-content-type", data: { id } }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to delete content category");
  }
}

