import type {
  Attachment,
  MaintenanceCategory,
  MaintenanceRequest,
  OfflineDraft,
  ProblemArea,
  RequestStatus,
  ResidentSession,
  StatusTimelineEvent,
} from "../types/residence";
import type { ExtendedMaintenanceRequest } from "../types/operations";
import { getCategoryMeta } from "./categories-config";
import {
  confirmStudentResolution,
  getExtendedRequests,
  processNewRequestThroughAssignmentEngine,
  saveExtendedRequests,
} from "./operations-service";

// Initial realistic seed requests for demonstration & testing
const SEED_REQUESTS: MaintenanceRequest[] = [
  {
    id: "CH-2026-001042",
    idempotencyKey: "seed-key-1042",
    studentNumber: "220123456",
    unit: "F301",
    room: "C",
    location: "F301C",
    area: "Kitchen",
    category: "Electrical",
    issueType: "Stove / Hot plate",
    description:
      "The front-left stove plate is not heating up. When turning the dial, the indicator light does not turn on.",
    attachments: [
      {
        id: "att-1",
        name: "stove_plate.jpg",
        size: 1024 * 780,
        type: "image/jpeg",
        url: "/pic00.jpg",
        uploadedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
    ],
    status: "in_progress",
    urgency: "standard",
    assignedTechnician: {
      name: "Sipho M.",
      specialty: "Electrical Specialist",
      isQueued: false,
    },
    timestamps: {
      reported_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      triaged_at: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
      assigned_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      accepted_at: new Date(Date.now() - 2.8 * 3600 * 1000).toISOString(),
      started_at: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString(),
    },
    history: [
      {
        id: "hist-1",
        status: "submitted",
        title: "Report Submitted",
        description: "We received your report and our residence desk has logged it.",
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        actor: "Resident (220123456)",
      },
      {
        id: "hist-2",
        status: "triaged",
        title: "Triaged by Residence Desk",
        description: "Priority verified as standard. Routed to electrical maintenance queue.",
        timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
        actor: "Residence Desk",
      },
      {
        id: "hist-3",
        status: "assigned",
        title: "Technician Assigned",
        description:
          "A maintenance team member has been assigned: Sipho M. (Electrical Specialist).",
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        actor: "Automated Assignment Engine",
      },
      {
        id: "hist-4",
        status: "accepted",
        title: "Work Accepted",
        description: "Technician accepted the job and scheduled unit visit.",
        timestamp: new Date(Date.now() - 2.8 * 3600 * 1000).toISOString(),
        actor: "Sipho M.",
      },
      {
        id: "hist-5",
        status: "in_progress",
        title: "Work In Progress",
        description:
          "Your issue is being worked on. Technician is currently inspecting the stove wiring.",
        timestamp: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString(),
        actor: "Sipho M.",
      },
    ],
  },
  {
    id: "CH-2026-000984",
    idempotencyKey: "seed-key-0984",
    studentNumber: "220123456",
    unit: "F301",
    room: "C",
    location: "F301C",
    area: "Bathroom 1",
    category: "Plumbing",
    issueType: "Tap / Faucet leak",
    description:
      "Cold water tap in Bathroom 1 basin is constantly dripping and won't turn off firmly.",
    attachments: [],
    status: "resolved",
    urgency: "standard",
    assignedTechnician: {
      name: "David K.",
      specialty: "Plumbing Specialist",
      isQueued: false,
    },
    timestamps: {
      reported_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      triaged_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      assigned_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      accepted_at: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      started_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    history: [
      {
        id: "hist-0984-1",
        status: "submitted",
        title: "Report Submitted",
        description: "We received your report.",
        timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
        actor: "Resident (220123456)",
      },
      {
        id: "hist-0984-2",
        status: "assigned",
        title: "Technician Assigned",
        description: "Assigned to David K. (Plumbing Specialist).",
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        actor: "Automated Assignment Engine",
      },
      {
        id: "hist-0984-3",
        status: "in_progress",
        title: "Work In Progress",
        description: "Tap washer and spindle replacement underway.",
        timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        actor: "David K.",
      },
      {
        id: "hist-0984-4",
        status: "resolved",
        title: "Maintenance Marked Resolved",
        description: "New ceramic tap washer installed and tested. Please confirm if fixed.",
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        actor: "David K.",
      },
    ],
  },
  {
    id: "CH-2026-001105",
    idempotencyKey: "seed-key-1105",
    studentNumber: "220123456",
    unit: "F301",
    room: "C",
    location: "F301C",
    area: "My Room",
    category: "Blinds / Curtains",
    issueType: "Broken blind cord / mechanism",
    description:
      "The pull cord snapped on the window blinds, so the blinds are stuck halfway down.",
    attachments: [],
    status: "submitted",
    urgency: "low",
    assignedTechnician: {
      name: "Thabo N.",
      specialty: "General Maintenance",
      isQueued: true,
      queuePosition: 2,
    },
    timestamps: {
      reported_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    history: [
      {
        id: "hist-1105-1",
        status: "submitted",
        title: "Report Submitted",
        description: "We received your report and logged your ticket.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        actor: "Resident (220123456)",
      },
    ],
  },
];

function getAllStoredRequests(): MaintenanceRequest[] {
  return getExtendedRequests();
}

function saveAllStoredRequests(requests: MaintenanceRequest[]): void {
  saveExtendedRequests(requests as ExtendedMaintenanceRequest[]);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ch_maintenance_request_change"));
  }
}

/**
 * Retrieves only authorized requests belonging to the resident's unit and room.
 */
export async function getRequestsForResident(
  session: ResidentSession,
): Promise<MaintenanceRequest[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const all = getAllStoredRequests();
  // Filter by matching unit and (room or common area in that unit)
  return all
    .filter((req) => req.unit === session.unit)
    .sort(
      (a, b) =>
        new Date(b.timestamps.reported_at).getTime() - new Date(a.timestamps.reported_at).getTime(),
    );
}

export async function getRequestById(
  requestId: string,
  session: ResidentSession,
): Promise<MaintenanceRequest | null> {
  const requests = await getRequestsForResident(session);
  return requests.find((r) => r.id === requestId) || null;
}

export interface SubmitReportPayload {
  idempotencyKey: string;
  area: ProblemArea;
  category: MaintenanceCategory;
  issueType: string;
  description: string;
  attachments: {
    name: string;
    size: number;
    type: string;
    dataUrl: string;
  }[];
}

/**
 * Submits a new maintenance report.
 * Supports idempotency keys to prevent accidental duplicates.
 */
export async function submitMaintenanceReport(
  payload: SubmitReportPayload,
  session: ResidentSession,
): Promise<MaintenanceRequest> {
  // Simulate network round-trip
  await new Promise((resolve) => setTimeout(resolve, 600));

  const all = getAllStoredRequests();

  // Check for idempotency match
  const existing = all.find((req) => req.idempotencyKey === payload.idempotencyKey);
  if (existing) {
    return existing;
  }

  // Generate reference: CH-2026-XXXXXX
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const refId = `CH-2026-${randomNum}`;

  const now = new Date().toISOString();
  const categoryMeta = getCategoryMeta(payload.category);

  // Determine technician based on skill requirement
  let techName = "Thabo N.";
  let techSpecialty = "General Maintenance";
  const isQueued = false;

  if (categoryMeta.primarySkill === "electrical") {
    techName = "Sipho M.";
    techSpecialty = "Electrical Specialist";
  } else if (categoryMeta.primarySkill === "plumbing") {
    techName = "David K.";
    techSpecialty = "Plumbing Specialist";
  }

  // Common areas vs room location
  const location =
    payload.area === "My Room" ? session.location : `${session.unit} (${payload.area})`;

  const newAttachments: Attachment[] = payload.attachments.map((att, i) => ({
    id: `att-${Date.now()}-${i}`,
    name: att.name,
    size: att.size,
    type: att.type,
    url: att.dataUrl,
    uploadedAt: now,
  }));

  const initialHistory: StatusTimelineEvent[] = [
    {
      id: `hist-${Date.now()}-1`,
      status: "submitted",
      title: "Report Submitted",
      description: "We received your report and our residence operations desk has logged it.",
      timestamp: now,
      actor: `Resident (${session.studentNumber})`,
    },
  ];

  const rawRequest: ExtendedMaintenanceRequest = {
    id: refId,
    idempotencyKey: payload.idempotencyKey,
    studentNumber: session.studentNumber,
    unit: session.unit,
    room: session.room,
    location,
    area: payload.area,
    category: payload.category,
    issueType: payload.issueType,
    description: payload.description,
    attachments: newAttachments,
    status: "submitted",
    urgency: "standard",
    operationalPriority: "standard",
    requiredSkill: "general",
    sla: {
      targetHours: 24,
      dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      slaStatus: "on_track",
    },
    timestamps: {
      reported_at: now,
    },
    history: initialHistory,
  };

  // Run through automated deterministic assignment engine
  const processed = processNewRequestThroughAssignmentEngine(rawRequest);

  const updated = [processed, ...all];
  saveAllStoredRequests(updated);

  // Clear any existing draft since it was submitted
  clearOfflineDraft();

  return processed;
}

/**
 * Confirm resolution by student: marks request as "verified".
 */
export async function confirmResolution(
  requestId: string,
  session: ResidentSession,
): Promise<MaintenanceRequest> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const res = confirmStudentResolution(requestId, true);
  if (!res) {
    throw new Error("Request not found");
  }
  return res;
}

/**
 * Reopen request by student: asks what still needs attention and retains full history.
 */
export async function reopenRequest(
  requestId: string,
  reason: string,
  session: ResidentSession,
): Promise<MaintenanceRequest> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const res = confirmStudentResolution(requestId, false, reason);
  if (!res) {
    throw new Error("Request not found");
  }
  return res;
}

/* =========================================================================
 * Offline Draft Management
 * ========================================================================= */

export function saveOfflineDraft(draft: OfflineDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error("Failed to save draft:", err);
  }
}

export function getOfflineDraft(): OfflineDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineDraft) : null;
  } catch (err) {
    console.error("Failed to load draft:", err);
    return null;
  }
}

export function clearOfflineDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear draft:", err);
  }
}

/* =========================================================================
 * Offline Outbox Queue (Auto-Sync)
 * ========================================================================= */

export function queueOutboxReport(payload: SubmitReportPayload, session: ResidentSession): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ payload, session, queuedAt: new Date().toISOString() });
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Failed to queue outbox report:", err);
  }
}

export async function syncOutboxQueue(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return 0;

    let synced = 0;
    for (const item of list) {
      try {
        await submitMaintenanceReport(item.payload, item.session);
        synced++;
      } catch (e) {
        console.error("Sync item failed:", e);
      }
    }
    localStorage.removeItem(OUTBOX_STORAGE_KEY);
    return synced;
  } catch (err) {
    console.error("Failed to sync outbox queue:", err);
    return 0;
  }
}

export function subscribeToRequestChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(REQUEST_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(REQUEST_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
