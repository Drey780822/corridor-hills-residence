import { useEffect, useState } from "react";
import type { StaffAvailability, StaffMember, StaffSession } from "../types/operations";
import { getStaffMembers } from "./operations-service";

const STAFF_SESSION_KEY = "corridor_hills_staff_session_v1";
const STAFF_SESSION_EVENT = "ch_staff_session_change";

export function getStaffSession(): StaffSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAFF_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StaffSession;
    if (!session || !session.token || !session.expiresAt) {
      localStorage.removeItem(STAFF_SESSION_KEY);
      return null;
    }
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(STAFF_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setStaffSession(session: StaffSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(STAFF_SESSION_EVENT, { detail: session }));
}

export function clearStaffSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STAFF_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(STAFF_SESSION_EVENT, { detail: null }));
}

export function loginStaffMember(staffId: string): {
  success: boolean;
  staff?: StaffMember;
  error?: string;
} {
  const staffList = getStaffMembers();
  const staff = staffList.find(
    (s) => s.id.toUpperCase() === staffId.trim().toUpperCase() && s.active,
  );

  if (!staff) {
    return {
      success: false,
      error:
        "Staff ID not recognized or inactive. Try 'CH-ST-001' (Sipho Mhlongo) or check with operations.",
    };
  }

  const session: StaffSession = {
    token: `st-tok-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    role: "STAFF",
    staff,
    verifiedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // 12 hour shift
  };

  setStaffSession(session);
  return { success: true, staff };
}

export function updateStaffSessionAvailability(newStatus: StaffAvailability): StaffMember | null {
  const session = getStaffSession();
  if (!session) return null;
  const staffList = getStaffMembers();
  const staff = staffList.find((s) => s.id === session.staff.id);
  if (!staff) return null;

  const updatedStaff: StaffMember = {
    ...staff,
    status: newStatus,
  };
  setStaffSession({
    ...session,
    staff: updatedStaff,
  });
  return updatedStaff;
}

export function useStaffSession() {
  const [session, setSessionState] = useState<StaffSession | null>(() => getStaffSession());

  useEffect(() => {
    const update = () => {
      setSessionState(getStaffSession());
    };

    window.addEventListener(STAFF_SESSION_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(STAFF_SESSION_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return {
    session,
    isAuthenticated: session !== null,
    staff: session?.staff || null,
    login: loginStaffMember,
    logout: clearStaffSession,
    updateAvailability: updateStaffSessionAvailability,
  };
}
