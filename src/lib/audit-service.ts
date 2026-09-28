import type { AuditLogEntry, UserRole } from "../types/operations";
import { INITIAL_AUDIT_LOGS } from "./operations-data";

const AUDIT_STORAGE_KEY = "corridor_hills_audit_log_v1";
const AUDIT_EVENT_NAME = "ch_audit_log_change";

let auditMemoryStore: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return auditMemoryStore;
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    const parsed = JSON.parse(raw) as AuditLogEntry[];
    return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error("Failed to read audit logs:", err);
    return INITIAL_AUDIT_LOGS;
  }
}

export function recordAuditEvent(params: {
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
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...params,
  };

  if (typeof window === "undefined") {
    auditMemoryStore = [entry, ...auditMemoryStore];
    return entry;
  }

  try {
    const logs = getAuditLogs();
    // Append-only: unshift new entry to front
    const updated = [entry, ...logs];
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(AUDIT_EVENT_NAME, { detail: entry }));
  } catch (err) {
    console.error("Failed to persist audit log entry:", err);
  }

  return entry;
}

export function getAuditLogsForRequest(requestId: string): AuditLogEntry[] {
  const logs = getAuditLogs();
  return logs.filter(
    (l) =>
      l.targetId === requestId || (l.targetType === "request" && l.targetId.includes(requestId)),
  );
}
