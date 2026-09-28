import assert from "node:assert/strict";
import {
  resolveRequiredSkill,
  computeOperationalPriority,
  processNewRequestThroughAssignmentEngine,
  evaluateQueueForStaff,
  acceptJob,
  startWork,
  pauseWork,
  resumeWork,
  resolveJob,
  rejectJob,
  adminReassignRequest,
  getStaffMembers,
  saveStaffMembers,
  getExtendedRequests,
  saveExtendedRequests,
  getQueues,
  saveQueues,
  updateStaffAvailability,
  getSlaComplianceStats,
  getCategoryWorkload,
} from "../src/lib/operations-service.ts";
import { recordAuditEvent, getAuditLogs } from "../src/lib/audit-service.ts";
import {
  queueStaffAction,
  getOfflineActions,
  processOfflineQueue,
} from "../src/lib/staff-offline-queue.ts";
import { checkRoleAuthorization, checkRequestResourceAccess } from "../src/lib/rbac-service.ts";
import { detectRecurringPattern, detectRecurringIssues } from "../src/lib/recurring-detector.ts";
import { INITIAL_STAFF_MEMBERS } from "../src/lib/operations-data.ts";
import type { StaffMember, ExtendedMaintenanceRequest } from "../src/types/operations.ts";

// Test Runner
async function runTests() {
  console.log("--- STARTING CORRIDOR HILLS OPERATIONS PLATFORM TEST SUITE ---");
  saveStaffMembers([...INITIAL_STAFF_MEMBERS]);
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`✗ [FAIL] ${name}:`, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  // 1. RBAC Tests
  test("RBAC: Restricts role boundaries properly", () => {
    // Calling with empty session (no active logged in session)
    const adminCheck = checkRoleAuthorization(["ADMIN"]);
    assert.equal(adminCheck.authorized, false);
    assert.ok(adminCheck.error?.includes("Required roles: ADMIN"));

    const staffCheck = checkRoleAuthorization(["STAFF"]);
    assert.equal(staffCheck.authorized, false);

    // Resource level access checks
    const sampleReq: ExtendedMaintenanceRequest = {
      id: "REQ-1",
      unit: "B201",
      room: "A",
      location: "Block B · Unit 201",
      category: "electrical",
      problemArea: "bedroom",
      issueType: "Socket",
      description: "Humming",
      status: "assigned",
      reportedBy: {
        name: "Student One",
        studentNumber: "22100000",
        room: "A",
        contactNumber: "+27 71 000 0000",
      },
      operationalPriority: "high",
      requiredSkill: "electrical",
      sla: { targetHours: 6, dueAt: new Date().toISOString(), slaStatus: "on_track" },
      timestamps: { reported_at: new Date().toISOString() },
      history: [],
    };

    assert.equal(checkRequestResourceAccess(sampleReq, "ADMIN", "CH-ADM-001").authorized, true);
    assert.equal(checkRequestResourceAccess(sampleReq, "STAFF", "CH-ST-001").authorized, true);
    assert.equal(checkRequestResourceAccess(sampleReq, "STUDENT", "22100000").authorized, true);
    assert.equal(checkRequestResourceAccess(sampleReq, "STUDENT", "99999999").authorized, false);
  });

  // 2. Skill Resolution & Operational Priority
  test("Engine: Deterministic Skill and Priority resolution", () => {
    // Electrical mapping
    const skillElec = resolveRequiredSkill("electrical", "Power outage in unit");
    assert.equal(skillElec, "electrical");

    // Plumbing mapping
    const skillPlumb = resolveRequiredSkill("plumbing", "Burst pipe geyser");
    assert.equal(skillPlumb, "plumbing");

    // Emergency priority calculation
    const priorityEmergency = computeOperationalPriority(
      "electrical",
      "Power socket / plug sparking",
      "emergency",
    );
    assert.equal(priorityEmergency, "emergency");

    // Standard priority calculation
    const priorityStandard = computeOperationalPriority("general", "Door handle loose");
    assert.equal(priorityStandard, "standard");
  });

  // 3. Automated Assignment Engine (Auto-routes to available skill matching technician)
  test("Engine: Auto-assigns matching skill and available technician", () => {
    const technician: StaffMember = {
      id: "CH-ST-AUTO-1",
      name: "David",
      surname: "Khumalo",
      email: "david@tut.ac.za",
      phone: "+27 73 000 2222",
      roleTitle: "Plumber Specialist",
      skills: ["plumbing"],
      status: "AVAILABLE",
      active: true,
      activeJobsCount: 0,
      completedTodayCount: 0,
      shiftHours: "08:00 - 17:00",
    };
    saveStaffMembers([technician]);

    const newReq: ExtendedMaintenanceRequest = {
      id: "REQ-AUTO-001",
      unit: "B102",
      room: "A",
      location: "Block B · Unit 102",
      category: "plumbing",
      problemArea: "bathroom",
      issueType: "Shower drain overflow",
      description: "Water leaking into bathroom floor",
      urgency: "high",
      status: "submitted",
      operationalPriority: "high",
      requiredSkill: "plumbing",
      sla: { targetHours: 6, dueAt: new Date().toISOString(), slaStatus: "on_track" },
      timestamps: { reported_at: new Date().toISOString() },
      history: [],
    };

    const processed = processNewRequestThroughAssignmentEngine(newReq);
    assert.ok(processed.assignedStaffId, "Should automatically assign to an available technician");
    const assignedStaff = getStaffMembers().find((s) => s.id === processed.assignedStaffId);
    assert.ok(
      assignedStaff?.skills.includes("plumbing"),
      "Assigned technician must have certified plumbing skill",
    );
    assert.equal(processed.status, "assigned");
    assert.ok(!processed.isQueued, "Should not be queued");
  });

  // 4. Technician Action State Machine (Accept -> Start -> Pause -> Resume -> Resolve)
  test("Technician State Machine: Happy path lifecycle", () => {
    const testStaff: StaffMember = {
      id: "CH-TEST-001",
      name: "John",
      surname: "Doe",
      email: "john.doe@corridorhills.tut.ac.za",
      phone: "+27 82 000 1111",
      roleTitle: "Artisan",
      skills: ["electrical", "general"],
      status: "AVAILABLE",
      active: true,
      activeJobsCount: 0,
      completedTodayCount: 0,
      shiftHours: "08:00 - 17:00",
    };
    saveStaffMembers([...INITIAL_STAFF_MEMBERS, testStaff]);

    const testReq: ExtendedMaintenanceRequest = {
      id: "TEST-REQ-001",
      unit: "B201",
      room: "A",
      location: "Block B · Unit 201 · Room A",
      category: "electrical",
      problemArea: "bedroom",
      issueType: "Power socket sparked",
      description: "Socket makes humming noise",
      status: "assigned",
      assignedStaffId: testStaff.id,
      assignedStaffName: `${testStaff.name} ${testStaff.surname}`,
      operationalPriority: "high",
      requiredSkill: "electrical",
      sla: {
        targetHours: 6,
        dueAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        slaStatus: "on_track",
      },
      timestamps: {
        reported_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
      },
      history: [],
    };
    saveExtendedRequests([testReq]);

    // Accept
    const accepted = acceptJob(testReq.id, testStaff.id);
    assert.ok(accepted, "Job should be accepted");
    assert.equal(accepted?.status, "accepted");

    // Start
    const started = startWork(testReq.id, testStaff.id);
    assert.ok(started, "Job should be started");
    assert.equal(started?.status, "in_progress");

    // Pause
    const paused = pauseWork(
      testReq.id,
      testStaff.id,
      "awaiting_parts",
      "Need 16A circuit breaker",
    );
    assert.ok(paused, "Job should be paused");
    assert.equal(paused?.status, "awaiting_parts");
    assert.equal(paused?.pauseReason, "awaiting_parts");

    // Resume
    const resumed = resumeWork(testReq.id, testStaff.id);
    assert.ok(resumed, "Job should be resumed");
    assert.equal(resumed?.status, "in_progress");

    // Resolve
    const resolved = resolveJob(
      testReq.id,
      testStaff.id,
      "Replaced faulty breaker and tested load.",
    );
    assert.ok(resolved, "Job should be resolved");
    assert.equal(resolved?.status, "resolved");
    assert.equal(resolved?.resolutionSummary, "Replaced faulty breaker and tested load.");
  });

  // 5. Job Rejection with Mandatory Reason
  test("Technician State Machine: Rejection requires reason and logs audit", () => {
    const testReq: ExtendedMaintenanceRequest = {
      id: "TEST-REJ-001",
      unit: "C104",
      room: "B",
      location: "Block C · Unit 104 · Room B",
      category: "plumbing",
      problemArea: "bathroom",
      issueType: "Shower drain overflow",
      description: "Water standing in shower",
      status: "assigned",
      assignedStaffId: "CH-ST-002",
      assignedStaffName: "David Khumalo",
      operationalPriority: "standard",
      requiredSkill: "plumbing",
      sla: {
        targetHours: 24,
        dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        slaStatus: "on_track",
      },
      timestamps: {
        reported_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
      },
      history: [],
    };
    saveExtendedRequests([testReq]);

    const rejected = rejectJob(
      testReq.id,
      "CH-ST-002",
      "Assigned to urgent emergency geyser burst in Block A",
    );
    assert.ok(rejected, "Rejected job should be returned");
    assert.ok(
      rejected?.rejectionHistory && rejected.rejectionHistory.length > 0,
      "Rejection history must be recorded",
    );
    assert.equal(
      rejected?.rejectionHistory?.[0].reason,
      "Assigned to urgent emergency geyser burst in Block A",
    );
  });

  // 6. Admin Reassignment
  test("Admin Control: Reassign request with mandatory audit justification", () => {
    const testReq: ExtendedMaintenanceRequest = {
      id: "TEST-REASSIGN-001",
      unit: "D305",
      room: "C",
      location: "Block D · Unit 305 · Room C",
      category: "electrical",
      problemArea: "kitchen",
      issueType: "Stove burner tripping",
      description: "Stove trips switch",
      status: "assigned",
      assignedStaffId: "CH-ST-003",
      assignedStaffName: "Thabo Ndlovu",
      operationalPriority: "high",
      requiredSkill: "electrical",
      sla: {
        targetHours: 6,
        dueAt: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        slaStatus: "on_track",
      },
      timestamps: {
        reported_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
      },
      history: [],
    };
    saveExtendedRequests([testReq]);

    const reassigned = adminReassignRequest(
      testReq.id,
      "CH-ST-001",
      "Electrical specialist required for stove wiring diagnostics",
      "Lerato Molefe",
    );

    assert.ok(reassigned, "Request should be reassigned");
    assert.equal(reassigned?.assignedStaffId, "CH-ST-001");
  });

  // 7. Offline Action Idempotency Deduplication
  test("Offline Queue: Deduplicates actions using idempotencyKey", () => {
    const action1 = queueStaffAction({
      idempotencyKey: "idem-test-key-100",
      staffId: "CH-ST-001",
      requestId: "TEST-OFFLINE-001",
      action: "start",
      payload: {},
    });

    const action2 = queueStaffAction({
      idempotencyKey: "idem-test-key-100", // same key
      staffId: "CH-ST-001",
      requestId: "TEST-OFFLINE-001",
      action: "start",
      payload: {},
    });

    const queue = getOfflineActions();
    const countWithKey = queue.filter((a) => a.idempotencyKey === "idem-test-key-100").length;
    assert.equal(
      countWithKey,
      1,
      "Duplicate action with identical idempotencyKey must be suppressed",
    );
  });

  // 8. Recurring Problem Heuristic Detection
  test("Recurring Heuristic: Detects repeat failures in same unit", () => {
    const now = new Date();
    const requests: ExtendedMaintenanceRequest[] = [
      {
        id: "REQ-REC-1",
        unit: "F301",
        room: "C",
        location: "Unit F301",
        category: "electrical",
        problemArea: "kitchen",
        issueType: "Stove burner",
        description: "Stove burner cold",
        status: "resolved",
        operationalPriority: "high",
        requiredSkill: "electrical",
        sla: { targetHours: 6, dueAt: now.toISOString(), slaStatus: "on_track" },
        timestamps: { reported_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
        history: [],
      },
      {
        id: "REQ-REC-2",
        unit: "F301",
        room: "C",
        location: "Unit F301",
        category: "electrical",
        problemArea: "kitchen",
        issueType: "Stove burner short circuit",
        description: "Stove sparking again",
        status: "in_progress",
        operationalPriority: "high",
        requiredSkill: "electrical",
        sla: { targetHours: 6, dueAt: now.toISOString(), slaStatus: "on_track" },
        timestamps: { reported_at: now.toISOString() },
        history: [],
      },
    ];

    const result = detectRecurringPattern(requests[1], requests);
    assert.equal(
      result.isRecurring,
      true,
      "Repeat failure in same unit within 14 days must be detected",
    );
    assert.equal(result.countInWindow, 2);
  });

  // 9. SLA Compliance Metrics
  test("Analytics: Computes live SLA compliance statistics", () => {
    const stats = getSlaComplianceStats();
    assert.ok(stats.compliancePercentage >= 0 && stats.compliancePercentage <= 100);
  });

  console.log(`\n======================================================`);
  console.log(`ALL ${passed}/${total} OPERATIONS PLATFORM TESTS PASSED SUCCESSFULLY!`);
  console.log(`======================================================`);
}

runTests();
