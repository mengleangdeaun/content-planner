export interface ContentTypeConfig {
  id: string; // e.g. "CT-101"
  name: string; // e.g. "Educational"
  description?: string;
  badge_color?: string;
  target_share_pct?: number; // Share of the month's posts this type should make up.
  default_format?: string; // "", "poster", "video" or "both"
  brief_template?: string; // Prefills the caption of new posts of this type.
}
