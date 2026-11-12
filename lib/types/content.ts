import { Platform } from "./channel";

export type ContentStatus =
  | "Draft"
  | "In Production"
  | "In Review"
  | "In Revise"
  | "Approved"
  | "Scheduled"
  | "Published"
  | "Archived";

export interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  publish_date: string; // "YYYY-MM-DD"
  platform: Platform;
  account_name: string;
  channel_id?: string;

  // Media Formats: Poster, Video, or BOTH
  is_poster: boolean;
  is_video: boolean;

  copy_text: string;
  workspace_file_url: string;
  status: ContentStatus;

  // Planning
  group_id?: string; // Shared by posts created together for several channels.
  campaign_id?: string;
  assignee_email?: string;
  reviewer_email?: string;
  due_date?: string; // "YYYY-MM-DD"
  publish_time?: string; // "HH:MM"
  priority?: string;
  live_post_url?: string;

  // Metadata timestamps
  created_at?: string; // ISO 8601 creation timestamp
  created_by?: string;
  updated_at?: string;
}

export interface ContentInsight {
  id: string;
  views_impressions: number;
  engagements: number;
  clicks: number;
  reach?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  /** The day the numbers were counted, "YYYY-MM-DD" (older rows hold a full timestamp). */
  captured_at?: string;
  entered_by?: string;
}

export interface ContentWithInsight extends ContentItem {
  insight?: ContentInsight;
}

export interface MetricSummary {
  totalPlanned: number;
  educationalPlanned: number;
  promotionalPlanned: number;
  totalPublished: number;
  targetAccountCount: number;
}
