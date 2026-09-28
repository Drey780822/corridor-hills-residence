import type {
  AdminMember,
  CategorySkillMapping,
  ExtendedMaintenanceRequest,
  OperationalPriority,
  QueueItem,
  SkillDefinition,
  SLAPolicy,
  StaffAvailability,
  StaffMember,
  UnitStructure,
  WorkEvidence,
} from "../types/operations";
import { recordAuditEvent } from "./audit-service";
import {
  INITIAL_ADMIN_MEMBERS,
  INITIAL_CATEGORY_SKILL_MAPPINGS,
  INITIAL_EXTENDED_REQUESTS,
  INITIAL_QUEUES,
  INITIAL_SKILLS,
  INITIAL_SLA_POLICIES,
  INITIAL_STAFF_MEMBERS,
  INITIAL_UNITS,
} from "./operations-data";
import { detectRecurringPattern } from "./recurring-detector";

const STORAGE_KEYS = {
  STAFF: "corridor_hills_staff_v1",
  REQUESTS: "corridor_hills_extended_requests_v1",
  QUEUES: "corridor_hills_queues_v1",
  UNITS: "corridor_hills_units_v1",
  SKILLS: "corridor_hills_skills_v1",
  MAPPINGS: "corridor_hills_category_mappings_v1",
  SLA: "corridor_hills_sla_policies_v1",
};

const OPERATIONS_CHANGE_EVENT = "ch_operations_data_change";

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPERATIONS_CHANGE_EVENT));
  }
}

// ----------------- STORAGE GETTERS & SETTERS -----------------

const memoryStore: Record<string, string> = {};

function getStoredJson<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    const mem = memoryStore[key];
    return mem ? (JSON.parse(mem) as T) : defaultValue;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setStoredJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    memoryStore[key] = JSON.stringify(value);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
  emitChange();
}

export function getStaffMembers(): StaffMember[] {
  return getStoredJson(STORAGE_KEYS.STAFF, INITIAL_STAFF_MEMBERS);
}

export function saveStaffMembers(staff: StaffMember[]): void {
  setStoredJson(STORAGE_KEYS.STAFF, staff);
}

export function getExtendedRequests(): ExtendedMaintenanceRequest[] {
  const list = getStoredJson(STORAGE_KEYS.REQUESTS, INITIAL_EXTENDED_REQUESTS);
  // Dynamically refresh SLA states based on current wall clock
  const now = Date.now();
  return list.map((req) => {
    if (req.status === "resolved" || req.status === "closed" || req.status === "verified") {
      return req;
    }
    const dueTime = new Date(req.sla.dueAt).getTime();
    const reportedTime = new Date(req.timestamps.reported_at).getTime();
    const totalWindow = dueTime - reportedTime;
    const timeLeft = dueTime - now;

    let slaStatus = req.sla.slaStatus;
    let breachedAt = req.sla.breachedAt;

    if (timeLeft <= 0) {
      slaStatus = "breached";
      if (!breachedAt) breachedAt = new Date(dueTime).toISOString();
    } else if (timeLeft / totalWindow <= 0.25 || timeLeft <= 30 * 60 * 1000) {
      slaStatus = "at_risk";
    } else {
      slaStatus = "on_track";
    }

    return {
      ...req,
      sla: {
        ...req.sla,
        slaStatus,
        breachedAt,
      },
    };
  });
}

export function saveExtendedRequests(requests: ExtendedMaintenanceRequest[]): void {
  setStoredJson(STORAGE_KEYS.REQUESTS, requests);
}

export function getQueues(): QueueItem[] {
  return getStoredJson(STORAGE_KEYS.QUEUES, INITIAL_QUEUES);
}

export function saveQueues(queues: QueueItem[]): void {
  setStoredJson(STORAGE_KEYS.QUEUES, queues);
}

export function getUnits(): UnitStructure[] {
  return getStoredJson(STORAGE_KEYS.UNITS, INITIAL_UNITS);
}

export function saveUnits(units: UnitStructure[]): void {
  setStoredJson(STORAGE_KEYS.UNITS, units);
}

export function getSkillDefinitions(): SkillDefinition[] {
  if (typeof window === "undefined") return INITIAL_SKILLS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SKILLS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(INITIAL_SKILLS));
      return INITIAL_SKILLS;
    }
    return JSON.parse(raw) as SkillDefinition[];
  } catch {
    return INITIAL_SKILLS;
  }
}

export function saveSkillDefinitions(skills: SkillDefinition[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
  emitChange();
}

export function getCategorySkillMappings(): CategorySkillMapping[] {
  if (typeof window === "undefined") return INITIAL_CATEGORY_SKILL_MAPPINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAPPINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(INITIAL_CATEGORY_SKILL_MAPPINGS));
      return INITIAL_CATEGORY_SKILL_MAPPINGS;
    }
    return JSON.parse(raw) as CategorySkillMapping[];
  } catch {
    return INITIAL_CATEGORY_SKILL_MAPPINGS;
  }
}

export function saveCategorySkillMappings(mappings: CategorySkillMapping[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.MAPPINGS, JSON.stringify(mappings));
  emitChange();
}

export function getSLAPolicies(): Record<string, SLAPolicy> {
  if (typeof window === "undefined") return INITIAL_SLA_POLICIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SLA, JSON.stringify(INITIAL_SLA_POLICIES));
      return INITIAL_SLA_POLICIES;
    }
    return JSON.parse(raw) as Record<string, SLAPolicy>;
  } catch {
    return INITIAL_SLA_POLICIES;
  }
}

export function saveSLAPolicies(policies: Record<string, SLAPolicy>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SLA, JSON.stringify(policies));
  emitChange();
}

// ----------------- AUTOMATIC ASSIGNMENT ENGINE -----------------

/**
 * Resolves required skill from configurable category/issue-type mappings.
 */
export function resolveRequiredSkill(category: string, issueType: string): string {
  const mappings = getCategorySkillMappings();
  const directMatch = mappings.find(
    (m) =>
      m.category.toLowerCase() === category.toLowerCase() &&
      m.issueType.toLowerCase() === issueType.toLowerCase(),
  );
  if (directMatch) return directMatch.requiredSkill;

  // Fallback by category
  if (category.toLowerCase().includes("electric")) return "electrical";
  if (category.toLowerCase().includes("plumb") || category.toLowerCase().includes("bathroom"))
    return "plumbing";
  return "general";
}

/**
 * Computes deterministic operational priority (not relying on student urgency input alone).
 */
export function computeOperationalPriority(
  category: string,
  issueType: string,
  userUrgency?: string,
): OperationalPriority {
  const mappings = getCategorySkillMappings();
  const match = mappings.find(
    (m) =>
      m.category.toLowerCase() === category.toLowerCase() &&
      m.issueType.toLowerCase() === issueType.toLowerCase(),
  );

  if (match) {
    if (match.defaultPriority === "emergency") return "emergency";
    if (userUrgency === "emergency" && (match.safetyRisk || match.waterElectricityImpact)) {
      return "emergency";
    }
    return match.defaultPriority;
  }

  if (userUrgency === "emergency") return "high";
  if (userUrgency === "high") return "high";
  if (userUrgency === "low") return "low";
  return "standard";
}

/**
 * Automatically classifies, calculates SLA, checks eligible technicians,
 * and either assigns immediately or enqueues deterministically.
 */
export function processNewRequestThroughAssignmentEngine(
  request: ExtendedMaintenanceRequest,
): ExtendedMaintenanceRequest {
  const allStaff = getStaffMembers();
  const slaPolicies = getSLAPolicies();
  const allRequests = getExtendedRequests();

  // 1. Determine skill and priority
  const requiredSkill = resolveRequiredSkill(request.category, request.issueType);
  const operationalPriority = computeOperationalPriority(
    request.category,
    request.issueType,
    request.urgency,
  );

  // 2. SLA target calculation
  const policy = slaPolicies[operationalPriority] || slaPolicies.standard;
  const targetHours = policy.targetHours;
  const reportedTime = new Date(request.timestamps.reported_at).getTime();
  const dueAt = new Date(reportedTime + targetHours * 3600 * 1000).toISOString();

  // 3. Recurring issue check
  const recurringCheck = detectRecurringPattern(request, allRequests);

  // 4. Find eligible active staff with matching skill
  const eligibleStaff = allStaff.filter((s) => s.active && s.skills.includes(requiredSkill));

  // Filter for available staff (or staff within concurrent capacity <= 2 active jobs)
  const availableCandidates = eligibleStaff.filter(
    (s) => (s.status === "AVAILABLE" || s.activeJobsCount === 0) && s.activeJobsCount < 3,
  );

  let updatedRequest: ExtendedMaintenanceRequest = {
    ...request,
    requiredSkill,
    operationalPriority,
    sla: {
      targetHours,
      dueAt,
      slaStatus: "on_track",
    },
    recurringDetected: recurringCheck.isRecurring,
    recurringNote: recurringCheck.reason,
  };

  if (availableCandidates.length > 0) {
    // Sort deterministically: least active jobs -> least completed today -> alphabetical ID
    availableCandidates.sort((a, b) => {
      if (a.activeJobsCount !== b.activeJobsCount) return a.activeJobsCount - b.activeJobsCount;
      if (a.completedTodayCount !== b.completedTodayCount)
        return a.completedTodayCount - b.completedTodayCount;
      return a.id.localeCompare(b.id);
    });

    const chosenStaff = availableCandidates[0];

    // Assign to chosen staff
    updatedRequest = {
      ...updatedRequest,
      status: "assigned",
      assignedStaffId: chosenStaff.id,
      assignedStaffName: `${chosenStaff.name} ${chosenStaff.surname}`,
      assignedTechnician: {
        name: `${chosenStaff.name} ${chosenStaff.surname}`,
        specialty: chosenStaff.roleTitle,
        isQueued: false,
      },
      timestamps: {
        ...updatedRequest.timestamps,
        assigned_at: new Date().toISOString(),
      },
      history: [
        ...updatedRequest.history,
        {
          id: `hist-auto-${Date.now()}`,
          status: "assigned",
          title: `Assigned to ${chosenStaff.name} ${chosenStaff.surname}`,
          description: `Automatic assignment based on matching skill (${requiredSkill}) and technician availability.`,
          timestamp: new Date().toISOString(),
          actor: "Automated Assignment Engine",
        },
      ],
    };

    // Update staff activeJobsCount
    const updatedStaff = allStaff.map((s) =>
      s.id === chosenStaff.id ? { ...s, activeJobsCount: s.activeJobsCount + 1 } : s,
    );
    saveStaffMembers(updatedStaff);

    recordAuditEvent({
      actorId: "SYSTEM",
      actorName: "Assignment Engine",
      actorRole: "ADMIN",
      action: "AUTO_ASSIGN_SUCCESS",
      targetType: "request",
      targetId: request.id,
      newValue: `${chosenStaff.id} (${chosenStaff.name} ${chosenStaff.surname})`,
      reason: `Matched skill: ${requiredSkill}, Priority: ${operationalPriority}`,
    });
  } else {
    // No eligible staff available right now -> Enter Skill Queue
    const queues = getQueues();
    const queueId = `queue-${requiredSkill}`;
    const priorityWeight =
      operationalPriority === "emergency"
        ? 4
        : operationalPriority === "high"
          ? 3
          : operationalPriority === "standard"
            ? 2
            : 1;

    const queueItem: QueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      queueId,
      skill: requiredSkill,
      requestId: request.id,
      priority: operationalPriority,
      queuedAt: new Date().toISOString(),
      effectiveScore: priorityWeight * 1000,
      reason: `All technicians with skill '${requiredSkill}' are currently busy or off duty.`,
    };

    saveQueues([...queues, queueItem]);

    updatedRequest = {
      ...updatedRequest,
      status: "submitted",
      queuePosition: queues.filter((q) => q.queueId === queueId).length + 1,
      assignedTechnician: {
        name: "Queued",
        specialty: `${requiredSkill} Queue`,
        isQueued: true,
        queuePosition: queues.filter((q) => q.queueId === queueId).length + 1,
      },
      history: [
        ...updatedRequest.history,
        {
          id: `hist-queue-${Date.now()}`,
          status: "submitted",
          title: `Queued in ${requiredSkill.toUpperCase()} Dispatch`,
          description: `All eligible technicians are occupied. Ticket queued at priority: ${operationalPriority.toUpperCase()}.`,
          timestamp: new Date().toISOString(),
          actor: "Queue Dispatcher",
        },
      ],
    };

    recordAuditEvent({
      actorId: "SYSTEM",
      actorName: "Assignment Engine",
      actorRole: "ADMIN",
      action: "ENQUEUED",
      targetType: "request",
      targetId: request.id,
      newValue: queueId,
      reason: `No available technician with skill: ${requiredSkill}`,
    });
  }

  return updatedRequest;
}

/**
 * When a staff member completes a job or changes status to AVAILABLE,
 * automatically evaluates the queue for matching skills and assigns the top item!
 */
export function evaluateQueueForStaff(staffId: string): ExtendedMaintenanceRequest | null {
  const allStaff = getStaffMembers();
  const staff = allStaff.find((s) => s.id === staffId);
  if (!staff || !staff.active || staff.status === "OFF_DUTY" || staff.status === "UNAVAILABLE") {
    return null;
  }

  const queues = getQueues();
  // Filter queue items matching any of staff's skills
  const matchingItems = queues.filter((q) => staff.skills.includes(q.skill));
  if (matchingItems.length === 0) return null;

  // Sort queue by effectiveScore descending
  matchingItems.sort((a, b) => b.effectiveScore - a.effectiveScore);
  const nextItem = matchingItems[0];

  // Retrieve request
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === nextItem.requestId);
  if (!req) {
    // Clean orphan queue item
    saveQueues(queues.filter((q) => q.id !== nextItem.id));
    return null;
  }

  // Remove from queue
  saveQueues(queues.filter((q) => q.id !== nextItem.id));

  // Assign to this staff member
  const updatedReq: ExtendedMaintenanceRequest = {
    ...req,
    status: "assigned",
    assignedStaffId: staff.id,
    assignedStaffName: `${staff.name} ${staff.surname}`,
    assignedTechnician: {
      name: `${staff.name} ${staff.surname}`,
      specialty: staff.roleTitle,
      isQueued: false,
    },
    timestamps: {
      ...req.timestamps,
      assigned_at: new Date().toISOString(),
    },
    history: [
      ...req.history,
      {
        id: `hist-deq-${Date.now()}`,
        status: "assigned",
        title: `Assigned from Queue to ${staff.name} ${staff.surname}`,
        description: `Technician became available and claimed highest priority queued task.`,
        timestamp: new Date().toISOString(),
        actor: "Queue Dispatcher",
      },
    ],
  };

  // Update staff workload
  saveStaffMembers(
    allStaff.map((s) => (s.id === staff.id ? { ...s, activeJobsCount: s.activeJobsCount + 1 } : s)),
  );

  saveExtendedRequests(requests.map((r) => (r.id === updatedReq.id ? updatedReq : r)));

  recordAuditEvent({
    actorId: "SYSTEM",
    actorName: "Queue Dispatcher",
    actorRole: "ADMIN",
    action: "QUEUE_AUTO_DISPATCH",
    targetType: "request",
    targetId: updatedReq.id,
    newValue: `${staff.id} (${staff.name} ${staff.surname})`,
    reason: `Dispatched from ${nextItem.queueId} upon technician availability`,
  });

  return updatedReq;
}

// ----------------- TECHNICIAN ACTIONS -----------------

export function acceptJob(requestId: string, staffId: string): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const staff = getStaffMembers().find((s) => s.id === staffId);
  if (!req || !staff) return null;

  const now = new Date().toISOString();
  const updated: ExtendedMaintenanceRequest = {
    ...req,
    status: "accepted",
    timestamps: {
      ...req.timestamps,
      accepted_at: now,
    },
    history: [
      ...req.history,
      {
        id: `hist-accept-${Date.now()}`,
        status: "accepted",
        title: "Work Order Accepted",
        description: `Technician ${staff.name} ${staff.surname} accepted the work order.`,
        timestamp: now,
        actor: `${staff.name} ${staff.surname} (${staff.id})`,
      },
    ],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "JOB_ACCEPTED",
    targetType: "request",
    targetId: requestId,
    previousValue: req.status,
    newValue: "accepted",
  });

  return updated;
}

export function startWork(requestId: string, staffId: string): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const staff = getStaffMembers().find((s) => s.id === staffId);
  if (!req || !staff) return null;

  const now = new Date().toISOString();
  const updated: ExtendedMaintenanceRequest = {
    ...req,
    status: "in_progress",
    timestamps: {
      ...req.timestamps,
      started_at: now,
    },
    history: [
      ...req.history,
      {
        id: `hist-start-${Date.now()}`,
        status: "in_progress",
        title: "Physical Work Commenced",
        description: `Technician arrived on-site at ${req.location} and started physical maintenance.`,
        timestamp: now,
        actor: `${staff.name} ${staff.surname} (${staff.id})`,
      },
    ],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "WORK_STARTED",
    targetType: "request",
    targetId: requestId,
    previousValue: req.status,
    newValue: "in_progress",
  });

  return updated;
}

export function pauseWork(
  requestId: string,
  staffId: string,
  reason: "awaiting_parts" | "awaiting_access" | "needs_specialist" | "cannot_reproduce" | "other",
  note: string,
): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const staff = getStaffMembers().find((s) => s.id === staffId);
  if (!req || !staff) return null;

  const reasonLabels: Record<string, string> = {
    awaiting_parts: "Awaiting Parts",
    awaiting_access: "Awaiting Resident Access",
    needs_specialist: "Needs Specialist Assistance",
    cannot_reproduce: "Unable to Reproduce Issue",
    other: "Work Paused",
  };

  const now = new Date().toISOString();
  const updated: ExtendedMaintenanceRequest = {
    ...req,
    status: "awaiting_parts",
    pauseReason: reason,
    pauseNote: note,
    history: [
      ...req.history,
      {
        id: `hist-pause-${Date.now()}`,
        status: "awaiting_parts",
        title: `Work Paused: ${reasonLabels[reason] || "Awaiting"}`,
        description: note || `Job paused by technician (${reasonLabels[reason]}).`,
        timestamp: now,
        actor: `${staff.name} ${staff.surname} (${staff.id})`,
      },
    ],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "WORK_PAUSED",
    targetType: "request",
    targetId: requestId,
    previousValue: req.status,
    newValue: "awaiting_parts",
    reason: `${reasonLabels[reason]}: ${note}`,
  });

  return updated;
}

export function resumeWork(requestId: string, staffId: string): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const staff = getStaffMembers().find((s) => s.id === staffId);
  if (!req || !staff) return null;

  const now = new Date().toISOString();
  const updated: ExtendedMaintenanceRequest = {
    ...req,
    status: "in_progress",
    pauseReason: undefined,
    pauseNote: undefined,
    history: [
      ...req.history,
      {
        id: `hist-resume-${Date.now()}`,
        status: "in_progress",
        title: "Work Resumed",
        description: `Technician resumed maintenance operations on-site.`,
        timestamp: now,
        actor: `${staff.name} ${staff.surname} (${staff.id})`,
      },
    ],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "WORK_RESUMED",
    targetType: "request",
    targetId: requestId,
    previousValue: req.status,
    newValue: "in_progress",
  });

  return updated;
}

export function addTechnicianNote(
  requestId: string,
  staffId: string,
  noteText: string,
): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const staff = getStaffMembers().find((s) => s.id === staffId);
  if (!req || !staff || !noteText.trim()) return null;

  const now = new Date().toISOString();
  const newNote = {
    id: `tn-${Date.now()}`,
    author: `${staff.name} ${staff.surname}`,
    note: noteText.trim(),
    timestamp: now,
  };

  const updated: ExtendedMaintenanceRequest = {
    ...req,
    technicianNotes: [...(req.technicianNotes || []), newNote],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "TECHNICIAN_NOTE_ADDED",
    targetType: "request",
    targetId: requestId,
    reason: noteText.substring(0, 100),
  });

  return updated;
}

export function addWorkEvidence(
  requestId: string,
  staffId: string,
  evidenceType: "before" | "during" | "after",
  name: string,
  url: string,
): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const staff = getStaffMembers().find((s) => s.id === staffId);
  if (!req || !staff) return null;

  const evidence: WorkEvidence = {
    id: `we-${Date.now()}`,
    type: evidenceType,
    name,
    url,
    uploadedAt: new Date().toISOString(),
    uploadedByStaffId: staff.id,
  };

  const updated: ExtendedMaintenanceRequest = {
    ...req,
    workEvidence: [...(req.workEvidence || []), evidence],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "EVIDENCE_UPLOADED",
    targetType: "request",
    targetId: requestId,
    reason: `${evidenceType} evidence photo attached`,
  });

  return updated;
}

export function resolveJob(
  requestId: string,
  staffId: string,
  resolutionSummary: string,
  afterPhotoUrl?: string,
): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const allStaff = getStaffMembers();
  const staff = allStaff.find((s) => s.id === staffId);
  if (!req || !staff) return null;

  const now = new Date().toISOString();
  const updated: ExtendedMaintenanceRequest = {
    ...req,
    status: "resolved",
    resolutionSummary: resolutionSummary.trim(),
    resolvedPhotoUrl: afterPhotoUrl || req.resolvedPhotoUrl,
    timestamps: {
      ...req.timestamps,
      resolved_at: now,
    },
    history: [
      ...req.history,
      {
        id: `hist-resolve-${Date.now()}`,
        status: "resolved",
        title: "Work Marked as Resolved",
        description: `Maintenance complete: "${resolutionSummary.trim()}". Awaiting student verification.`,
        timestamp: now,
        actor: `${staff.name} ${staff.surname} (${staff.id})`,
      },
    ],
  };

  // Decrement staff activeJobsCount, increment completedTodayCount
  saveStaffMembers(
    allStaff.map((s) =>
      s.id === staff.id
        ? {
            ...s,
            activeJobsCount: Math.max(0, s.activeJobsCount - 1),
            completedTodayCount: s.completedTodayCount + 1,
          }
        : s,
    ),
  );

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "JOB_RESOLVED",
    targetType: "request",
    targetId: requestId,
    previousValue: req.status,
    newValue: "resolved",
    reason: resolutionSummary,
  });

  // Evaluate the queue to automatically assign next pending job!
  evaluateQueueForStaff(staffId);

  return updated;
}

export function rejectJob(
  requestId: string,
  staffId: string,
  rejectionReason: string,
): ExtendedMaintenanceRequest | null {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error("A valid explanation is required when declining a job.");
  }

  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const allStaff = getStaffMembers();
  const staff = allStaff.find((s) => s.id === staffId);
  if (!req || !staff) return null;

  const now = new Date().toISOString();
  const rejectionRecord = {
    id: `rej-${Date.now()}`,
    staffId: staff.id,
    staffName: `${staff.name} ${staff.surname}`,
    reason: rejectionReason.trim(),
    timestamp: now,
  };

  // Unassign and decrement staff active count
  saveStaffMembers(
    allStaff.map((s) =>
      s.id === staff.id ? { ...s, activeJobsCount: Math.max(0, s.activeJobsCount - 1) } : s,
    ),
  );

  const updated: ExtendedMaintenanceRequest = {
    ...req,
    status: "submitted",
    assignedStaffId: undefined,
    assignedStaffName: undefined,
    assignedTechnician: undefined,
    rejectionHistory: [...(req.rejectionHistory || []), rejectionRecord],
    history: [
      ...req.history,
      {
        id: `hist-rej-${Date.now()}`,
        status: "submitted",
        title: "Work Order Declined",
        description: `Declined by ${staff.name} ${staff.surname}: "${rejectionReason.trim()}". Returned to dispatch.`,
        timestamp: now,
        actor: `${staff.name} ${staff.surname} (${staff.id})`,
      },
    ],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: staff.id,
    actorName: `${staff.name} ${staff.surname}`,
    actorRole: "STAFF",
    action: "JOB_DECLINED",
    targetType: "request",
    targetId: requestId,
    previousValue: "assigned",
    newValue: "submitted",
    reason: rejectionReason.trim(),
  });

  // Re-run through assignment engine to auto-route to another eligible technician
  return processNewRequestThroughAssignmentEngine(updated);
}

// ----------------- STUDENT CONFIRMATION / REOPEN -----------------

export function confirmStudentResolution(
  requestId: string,
  confirmed: boolean,
  feedback?: string,
): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return null;

  const now = new Date().toISOString();

  if (confirmed) {
    const updated: ExtendedMaintenanceRequest = {
      ...req,
      status: "verified",
      studentConfirmation: {
        confirmed: true,
        feedback: feedback || "Confirmed fixed by resident.",
        respondedAt: now,
      },
      timestamps: {
        ...req.timestamps,
        verified_at: now,
        closed_at: now,
      },
      history: [
        ...req.history,
        {
          id: `hist-ver-${Date.now()}`,
          status: "verified",
          title: "Resolution Verified by Student",
          description:
            feedback || "Student confirmed repair was successful and verified room condition.",
          timestamp: now,
          actor: `Resident (${req.studentNumber})`,
        },
      ],
    };

    saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

    recordAuditEvent({
      actorId: req.studentNumber,
      actorName: `Resident (${req.studentNumber})`,
      actorRole: "STUDENT",
      action: "RESOLUTION_VERIFIED",
      targetType: "request",
      targetId: requestId,
      previousValue: req.status,
      newValue: "verified",
    });

    return updated;
  } else {
    // Reopen request!
    const updated: ExtendedMaintenanceRequest = {
      ...req,
      status: "reopened",
      reopenReason: feedback || "Resident indicated problem persists.",
      studentConfirmation: {
        confirmed: false,
        feedback: feedback || "Still broken",
        respondedAt: now,
      },
      timestamps: {
        ...req.timestamps,
        reopened_at: now,
      },
      history: [
        ...req.history,
        {
          id: `hist-reopen-${Date.now()}`,
          status: "reopened",
          title: "Request Reopened by Resident",
          description: `Resident feedback: "${feedback || "Issue not fixed"}". Escalated back to operations dispatch.`,
          timestamp: now,
          actor: `Resident (${req.studentNumber})`,
        },
      ],
    };

    saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

    recordAuditEvent({
      actorId: req.studentNumber,
      actorName: `Resident (${req.studentNumber})`,
      actorRole: "STUDENT",
      action: "REQUEST_REOPENED",
      targetType: "request",
      targetId: requestId,
      previousValue: req.status,
      newValue: "reopened",
      reason: feedback,
    });

    // Re-dispatch through assignment engine
    return processNewRequestThroughAssignmentEngine(updated);
  }
}

// ----------------- ADMIN CONTROLS -----------------

export function adminReassignRequest(
  requestId: string,
  newStaffId: string,
  reason: string,
  adminName: string,
): ExtendedMaintenanceRequest | null {
  const requests = getExtendedRequests();
  const req = requests.find((r) => r.id === requestId);
  const allStaff = getStaffMembers();
  const newStaff = allStaff.find((s) => s.id === newStaffId);
  if (!req || !newStaff) return null;

  const now = new Date().toISOString();
  const previousStaff = req.assignedStaffName || "Unassigned";

  // If was previously assigned to another technician, decrement their count
  let updatedStaff = allStaff;
  if (req.assignedStaffId && req.assignedStaffId !== newStaff.id) {
    updatedStaff = updatedStaff.map((s) =>
      s.id === req.assignedStaffId
        ? { ...s, activeJobsCount: Math.max(0, s.activeJobsCount - 1) }
        : s,
    );
  }
  // Increment new staff count
  updatedStaff = updatedStaff.map((s) =>
    s.id === newStaff.id ? { ...s, activeJobsCount: s.activeJobsCount + 1 } : s,
  );
  saveStaffMembers(updatedStaff);

  const updated: ExtendedMaintenanceRequest = {
    ...req,
    status: "assigned",
    assignedStaffId: newStaff.id,
    assignedStaffName: `${newStaff.name} ${newStaff.surname}`,
    assignedTechnician: {
      name: `${newStaff.name} ${newStaff.surname}`,
      specialty: newStaff.roleTitle,
      isQueued: false,
    },
    timestamps: {
      ...req.timestamps,
      assigned_at: now,
    },
    history: [
      ...req.history,
      {
        id: `hist-reassign-${Date.now()}`,
        status: "assigned",
        title: `Manually Reassigned to ${newStaff.name} ${newStaff.surname}`,
        description: `Admin reassignment by ${adminName}. Reason: ${reason}`,
        timestamp: now,
        actor: `Admin (${adminName})`,
      },
    ],
  };

  saveExtendedRequests(requests.map((r) => (r.id === requestId ? updated : r)));

  recordAuditEvent({
    actorId: adminName,
    actorName: adminName,
    actorRole: "ADMIN",
    action: "ADMIN_REASSIGNMENT",
    targetType: "request",
    targetId: requestId,
    previousValue: previousStaff,
    newValue: `${newStaff.id} (${newStaff.name} ${newStaff.surname})`,
    reason,
  });

  return updated;
}

export function updateStaffAvailability(
  staffId: string,
  newStatus: StaffAvailability,
  actorName: string,
  actorRole: "STAFF" | "ADMIN" = "STAFF",
): StaffMember | null {
  const allStaff = getStaffMembers();
  const staff = allStaff.find((s) => s.id === staffId);
  if (!staff) return null;

  const previousStatus = staff.status;
  const updatedStaffMember: StaffMember = {
    ...staff,
    status: newStatus,
  };

  saveStaffMembers(allStaff.map((s) => (s.id === staffId ? updatedStaffMember : s)));

  recordAuditEvent({
    actorId: staff.id,
    actorName,
    actorRole,
    action: "STAFF_STATUS_CHANGE",
    targetType: "staff",
    targetId: staffId,
    previousValue: previousStatus,
    newValue: newStatus,
  });

  // If technician became AVAILABLE, check their queue!
  if (newStatus === "AVAILABLE") {
    evaluateQueueForStaff(staffId);
  }

  return updatedStaffMember;
}

export function getAdminMembers(): AdminMember[] {
  return INITIAL_ADMIN_MEMBERS;
}

export function getQueuedRequests(): ExtendedMaintenanceRequest[] {
  const all = getExtendedRequests();
  const queues = getQueues();
  const queuedRequestIds = new Set(queues.map((q) => q.requestId));
  return all.filter(
    (r) => r.isQueued || (r.status === "assigned" && r.queuePosition) || queuedRequestIds.has(r.id),
  );
}

export function setStaffAvailability(
  staffId: string,
  status: StaffAvailability,
  actorName = "System",
): StaffMember | null {
  return updateStaffAvailability(staffId, status, actorName);
}

export function getSlaComplianceStats() {
  const requests = getExtendedRequests();
  const total = requests.length;
  if (total === 0)
    return { onTrackCount: 0, atRiskCount: 0, breachedCount: 0, compliancePercentage: 100 };
  const onTrackCount = requests.filter((r) => r.sla?.slaStatus === "on_track").length;
  const atRiskCount = requests.filter((r) => r.sla?.slaStatus === "at_risk").length;
  const breachedCount = requests.filter((r) => r.sla?.slaStatus === "breached").length;
  const compliancePercentage = Math.round(((total - breachedCount) / total) * 100);
  return { onTrackCount, atRiskCount, breachedCount, compliancePercentage };
}

export function getCategoryWorkload() {
  const requests = getExtendedRequests();
  const workload: Record<
    string,
    { total: number; open: number; inProgress: number; resolved: number }
  > = {
    electrical: { total: 0, open: 0, inProgress: 0, resolved: 0 },
    plumbing: { total: 0, open: 0, inProgress: 0, resolved: 0 },
    general: { total: 0, open: 0, inProgress: 0, resolved: 0 },
  };

  requests.forEach((req) => {
    const cat = req.category?.toLowerCase() || "general";
    if (!workload[cat]) {
      workload[cat] = { total: 0, open: 0, inProgress: 0, resolved: 0 };
    }
    workload[cat].total++;
    if (req.status === "resolved" || req.status === "verified" || req.status === "closed") {
      workload[cat].resolved++;
    } else if (req.status === "in_progress") {
      workload[cat].inProgress++;
    } else {
      workload[cat].open++;
    }
  });

  return workload;
}
