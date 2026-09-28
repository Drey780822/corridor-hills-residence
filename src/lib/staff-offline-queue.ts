import { useEffect, useState } from "react";
import type { StaffOfflineAction } from "../types/operations";
import {
  acceptJob,
  addTechnicianNote,
  addWorkEvidence,
  pauseWork,
  resolveJob,
  resumeWork,
  startWork,
} from "./operations-service";

const OFFLINE_QUEUE_KEY = "corridor_hills_staff_offline_queue_v1";
const OFFLINE_QUEUE_EVENT = "ch_staff_offline_queue_change";

let offlineMemoryStore: StaffOfflineAction[] = [];

export function getOfflineActions(): StaffOfflineAction[] {
  if (typeof window === "undefined") return offlineMemoryStore;
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as StaffOfflineAction[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineActions(actions: StaffOfflineAction[]): void {
  if (typeof window === "undefined") {
    offlineMemoryStore = actions;
    return;
  }
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(actions));
  window.dispatchEvent(new CustomEvent(OFFLINE_QUEUE_EVENT, { detail: actions }));
}

export function queueStaffAction(
  action: Omit<StaffOfflineAction, "id" | "timestamp" | "synced">,
): StaffOfflineAction {
  const item: StaffOfflineAction = {
    ...action,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    synced: false,
  };

  const list = getOfflineActions();
  // Prevent duplicate action via idempotencyKey
  if (list.some((a) => a.idempotencyKey === item.idempotencyKey)) {
    return item;
  }

  saveOfflineActions([...list, item]);
  return item;
}

export async function processOfflineQueue(): Promise<{ syncedCount: number; errors: string[] }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { syncedCount: 0, errors: ["Offline: waiting for network connection"] };
  }

  const actions = getOfflineActions();
  if (actions.length === 0) return { syncedCount: 0, errors: [] };

  let syncedCount = 0;
  const errors: string[] = [];
  const remaining: StaffOfflineAction[] = [];

  for (const act of actions) {
    try {
      if (act.action === "accept") {
        acceptJob(act.requestId, act.staffId);
      } else if (act.action === "start") {
        startWork(act.requestId, act.staffId);
      } else if (act.action === "pause") {
        pauseWork(
          act.requestId,
          act.staffId,
          act.payload.reason as
            | "awaiting_parts"
            | "awaiting_access"
            | "needs_specialist"
            | "cannot_reproduce"
            | "other",
          (act.payload.note as string) || "",
        );
      } else if (act.action === "note") {
        addTechnicianNote(act.requestId, act.staffId, (act.payload.noteText as string) || "");
      } else if (act.action === "evidence") {
        addWorkEvidence(
          act.requestId,
          act.staffId,
          act.payload.type as "before" | "during" | "after",
          act.payload.name as string,
          act.payload.url as string,
        );
      } else if (act.action === "resolve") {
        resolveJob(
          act.requestId,
          act.staffId,
          (act.payload.summary as string) || "Resolved on-site",
          act.payload.afterPhotoUrl as string | undefined,
        );
      }
      syncedCount++;
    } catch (err) {
      console.error("Failed to sync offline action:", act, err);
      errors.push(`Action ${act.action} on ${act.requestId} failed: ${String(err)}`);
      remaining.push(act);
    }
  }

  saveOfflineActions(remaining);
  return { syncedCount, errors };
}

export async function syncOfflineQueueNow(): Promise<{ processedCount: number; errors: string[] }> {
  const result = await processOfflineQueue();
  return { processedCount: result.syncedCount, errors: result.errors };
}

export function useStaffOfflineQueue() {
  const [queue, setQueue] = useState<StaffOfflineAction[]>(() => getOfflineActions());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const update = () => {
      setQueue(getOfflineActions());
    };

    const handleOnline = async () => {
      setIsSyncing(true);
      try {
        await processOfflineQueue();
      } finally {
        setIsSyncing(false);
        update();
      }
    };

    window.addEventListener(OFFLINE_QUEUE_EVENT, update);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener(OFFLINE_QUEUE_EVENT, update);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return {
    queue,
    pendingCount: queue.filter((a) => !a.synced).length,
    isSyncing,
    queueAction: queueStaffAction,
    syncNow: processOfflineQueue,
  };
}
