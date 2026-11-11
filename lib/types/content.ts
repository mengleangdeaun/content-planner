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

  // Metadata timestamps
  created_at?: string; // ISO 8601 creation timestamp
  updated_at?: string;
}

export interface ContentInsight {
  id: string;
  views_impressions: number;
  engagements: number;
  clicks: number;
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
