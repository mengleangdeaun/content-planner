export type CampaignStatus = "Planned" | "Active" | "Completed" | "Archived";

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: CampaignStatus;
  owner_email: string;
  created_at?: string;
}

export interface ContentTask {
  id: string;
  content_id: string;
  title: string;
  assignee_email: string;
  due_date: string;
  status: "open" | "in_progress" | "done" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  actor_email: string;
  kind: "created" | "status" | "field" | "comment";
  entity: string;
  entity_id: string;
  from_value: string;
  to_value: string;
  body: string;
}

export interface Person {
  email: string;
  name: string;
  avatar_url?: string;
}
