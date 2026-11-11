import { ChannelAccount } from "@/lib/types";

export async function fetchChannels(): Promise<ChannelAccount[]> {
  const res = await fetch("/api/channels");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to fetch channels");
  }
  return json.channels || [];
}

export async function saveChannelAccount(
  channel: Omit<ChannelAccount, "id"> & { id?: string }
): Promise<ChannelAccount> {
  const method = channel.id ? "PUT" : "POST";
  const res = await fetch("/api/channels", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(channel),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to save channel");
  }
  return json.channel;
}

export async function deleteChannelAccount(id: string): Promise<void> {
  const res = await fetch(`/api/channels?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || "Failed to delete channel");
  }
}

