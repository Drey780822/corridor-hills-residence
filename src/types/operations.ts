import type {
  Block,
  MaintenanceCategory,
  MaintenanceRequest,
  ProblemArea,
  RequestStatus,
  Room,
} from "./residence";

export type UserRole = "STUDENT" | "STAFF" | "ADMIN";

export type StaffAvailability = "AVAILABLE" | "BUSY" | "ON_BREAK" | "OFF_DUTY" | "UNAVAILABLE";

export type OperationalPriority = "emergency" | "high" | "standard" | "low";

export type SLAStatus = "on_track" | "at_risk" | "breached";

export interface StaffMember {
  id: string; // e.g. "CH-ST-001"
  name: string;
  surname: string;
  email: string;
  phone: string;
  roleTitle: string; // e.g. "Electrical Specialist", "Lead Plumber"
  skills: string[]; // e.g. ["electrical", "general"]
  status: StaffAvailability;
  active: boolean;
  activeJobsCount: number;
  completedTodayCount: number;
  shiftHours: string;
  avatarUrl?: string;
}

export interface AdminMember {
  id: string; // e.g. "CH-ADM-001"
  name: string;
  surname: string;
  email: string;
  roleTitle: string; // e.g. "Residence Operations Manager", "Dean of Residence"
  permissions: string[];
}

export interface StaffSession {
  token: string;
  role: "STAFF";
  staff: StaffMember;
  verifiedAt: string;
  expiresAt: string;
}

export interface AdminSession {
  token: string;
  role: "ADMIN";
  admin: AdminMember;
  verifiedAt: string;
  expiresAt: string;
}

export interface SLAPolicy {
  priority: OperationalPriority;
  targetHours: number;
  escalationHours: number;
  description: string;
}

export interface SkillDefinition {
  id: string; // "electrical", "plumbing", "general", "hvac", "access_control"
  name: string;
  description: string;
  active: boolean;
}

export interface CategorySkillMapping {
  category: MaintenanceCategory;
  issueType: string;
  requiredSkill: string;
  defaultPriority: OperationalPriority;
  safetyRisk: boolean;
  waterElectricityImpact: boolean;
}

export interface QueueItem {
  id: string;
  queueId: string; // e.g. "queue-electrical"
  skill: string;
  requestId: string;
  priority: OperationalPriority;
  queuedAt: string;
  effectiveScore: number;
  reason: string;
}

export interface RejectionRecord {
  id: string;
  staffId: string;
  staffName: string;
  reason: string;
  timestamp: string;
}

export interface WorkEvidence {
  id: string;
  type: "before" | "during" | "after";
  name: string;
  url: string;
  uploadedAt: string;
  uploadedByStaffId: string;
}

export interface ExtendedMaintenanceRequest extends MaintenanceRequest {
  operationalPriority: OperationalPriority;
  requiredSkill: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  sla: {
    targetHours: number;
    dueAt: string;
    slaStatus: SLAStatus;
    breachedAt?: string;
  };
  pauseReason?:
    "awaiting_parts" | "awaiting_access" | "needs_specialist" | "cannot_reproduce" | "other";
  pauseNote?: string;
  technicianNotes?: Array<{
    id: string;
    author: string;
    note: string;
    timestamp: string;
  }>;
  workEvidence?: WorkEvidence[];
  rejectionHistory?: RejectionRecord[];
  resolutionSummary?: string;
  resolvedPhotoUrl?: string;
  studentConfirmation?: {
    confirmed: boolean;
    feedback?: string;
    respondedAt: string;
  };
  recurringDetected?: boolean;
  recurringNote?: string;
  queuePosition?: number;
}

export interface UnitStructure {
  id: string; // e.g. "F301"
  block: Block;
  floor: number;
  unitNumber: string; // "301"
  rooms: Room[];
  occupancy: number;
  maxOccupancy: number;
  students: Array<{
    studentNumber: string;
    name: string;
    surname: string;
    room: Room;
    residenceStatus: "Active" | "Notice" | "Vacated";
  }>;
  openIssuesCount: number;
  urgentIssuesCount: number;
  lastMaintenanceDate?: string;
  recurringAlert?: boolean;
  recurringAlertReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: "request" | "staff" | "unit" | "resident" | "configuration" | "auth";
  targetId: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface StaffOfflineAction {
  id: string;
  idempotencyKey: string;
  staffId: string;
  requestId: string;
  action: "accept" | "start" | "pause" | "note" | "evidence" | "resolve" | "reject";
  payload: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
}

export interface StudentImportRecord {
  studentNumber: string;
  name: string;
  surname: string;
  block: Block;
  floor: number;
  unit: string;
  room: Room;
  academicStatus?: string;
}

export interface ImportValidationResult {
  validRecords: StudentImportRecord[];
  errors: Array<{
    row: number;
    studentNumber?: string;
    message: string;
  }>;
  duplicates: Array<{
    row: number;
    studentNumber: string;
  }>;
  summary: {
    totalRows: number;
    validCount: number;
    errorCount: number;
    duplicateCount: number;
  };
}
