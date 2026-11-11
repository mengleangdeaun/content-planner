export type Platform =
  | "Facebook"
  | "TikTok"
  | "Instagram"
  | "YouTube"
  | "LinkedIn"
  | string;

export interface ChannelAccount {
  id: string; // e.g. "CHAN-101"
  platform: Platform;
  account_name: string; // e.g. "ABC"
  handle?: string; // e.g. "@abc_official"
  page_url?: string;
  avatar_url?: string; // Brand profile image URL
  avatar_color?: string;
  weekly_target_quota: number; // e.g. 5 posts/week
  status: "Active" | "Paused" | "Archived";
  notes?: string;
  owner_email?: string;
  brand?: string;
}

export interface ChannelSnapshot {
  id: string;
  channel_id: string;
  captured_at: string; // "YYYY-MM-DD"
  followers: number;
  entered_by: string;
}
