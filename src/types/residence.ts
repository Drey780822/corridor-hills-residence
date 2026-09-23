export type Block = "A" | "B" | "C" | "D" | "E" | "F";

export type Room = "A" | "B" | "C";

export type ProblemArea = "My Room" | "Bathroom 1" | "Bathroom 2" | "Kitchen" | "Common Area";

export type MaintenanceCategory =
  | "Electrical"
  | "Plumbing"
  | "Furniture"
  | "Blinds / Curtains"
  | "Carpet / Flooring"
  | "Doors / Locks"
  | "Bathroom"
  | "Kitchen"
  | "Cleaning / Basic Maintenance"
  | "Other";

export type TechnicianSkill = "electrical" | "plumbing" | "general";

export interface IssueTypeConfig {
  id: string;
  label: string;
  category: MaintenanceCategory;
  skillRequired: TechnicianSkill;
  defaultDescriptionPlaceholder?: string;
}

export type RequestStatus =
  | "submitted"
  | "triaged"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "awaiting_parts"
  | "resolved"
  | "verified"
  | "closed"
  | "reopened";

export interface StatusTimelineEvent {
  id: string;
  status: RequestStatus;
  title: string;
  description: string;
  timestamp: string; // ISO string
  actor?: string;
  formattedTime?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface MaintenanceRequest {
  id: string; // e.g. "CH-2026-001042"
  idempotencyKey: string;
  studentNumber: string;
  unit: string; // e.g. "F301"
  room: Room; // e.g. "C"
  location: string; // e.g. "F301C"
  area: ProblemArea;
  category: MaintenanceCategory;
  issueType: string;
  description: string;
  attachments: Attachment[];
  status: RequestStatus;
  urgency: "low" | "standard" | "high" | "emergency";
  assignedTechnician?: {
    name: string;
    specialty: string;
    isQueued?: boolean;
    queuePosition?: number;
  };
  timestamps: {
    reported_at: string;
    triaged_at?: string;
    assigned_at?: string;
    accepted_at?: string;
    started_at?: string;
    resolved_at?: string;
    verified_at?: string;
    closed_at?: string;
    reopened_at?: string;
  };
  history: StatusTimelineEvent[];
  reopenReason?: string;
}

export interface ResidentSession {
  studentNumber: string;
  unit: string;
  room: Room;
  location: string; // e.g. "F301C"
  block: Block;
  floor: number;
  token: string;
  verifiedAt: string;
  expiresAt: string;
}

export interface OfflineDraft {
  idempotencyKey: string;
  unit: string;
  room: Room;
  area?: ProblemArea;
  category?: MaintenanceCategory;
  issueType?: string;
  description?: string;
  attachments?: {
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  }[];
  savedAt: string;
  syncStatus: "draft" | "pending_upload" | "failed";
}
