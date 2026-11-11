export type Platform =
  | "Facebook"
  | "TikTok"
  | "Instagram"
  | "YouTube"
  | "LinkedIn"
  | "Twitter"
  | "Pinterest"
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
}
