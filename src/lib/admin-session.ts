import { useEffect, useState } from "react";
import type { AdminMember, AdminSession } from "../types/operations";
import { INITIAL_ADMIN_MEMBERS } from "./operations-data";

const ADMIN_SESSION_KEY = "corridor_hills_admin_session_v1";
const ADMIN_SESSION_EVENT = "ch_admin_session_change";

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session || !session.token || !session.expiresAt) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT, { detail: session }));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT, { detail: null }));
}

export function loginAdminMember(idOrEmail: string): {
  success: boolean;
  admin?: AdminMember;
  error?: string;
} {
  const clean = idOrEmail.trim().toLowerCase();
  const admin = INITIAL_ADMIN_MEMBERS.find(
    (a) => a.id.toLowerCase() === clean || a.email.toLowerCase() === clean,
  );

  if (!admin) {
    return {
      success: false,
      error:
        "Administrator credential not recognized. Try 'CH-ADM-001' (Lerato Molefe) or your TUT staff email.",
    };
  }

  const session: AdminSession = {
    token: `adm-tok-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    role: "ADMIN",
    admin,
    verifiedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
  };

  setAdminSession(session);
  return { success: true, admin };
}

export function useAdminSession() {
  const [session, setSessionState] = useState<AdminSession | null>(() => getAdminSession());

  useEffect(() => {
    const update = () => {
      setSessionState(getAdminSession());
    };

    window.addEventListener(ADMIN_SESSION_EVENT, update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(ADMIN_SESSION_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return {
    session,
    isAuthenticated: session !== null,
    admin: session?.admin || null,
    login: loginAdminMember,
    logout: clearAdminSession,
  };
}
