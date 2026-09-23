import { useEffect, useState } from "react";
import type { ResidentSession } from "../types/residence";

const SESSION_STORAGE_KEY = "corridor_hills_resident_session_v1";
const SESSION_EVENT_NAME = "ch_resident_session_change";

/**
 * Retrieves the currently active verified resident session, if any.
 * Checks for token validity and expiration.
 */
export function getResidentSession(): ResidentSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as ResidentSession;
    if (!session || !session.token || !session.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    // Check expiration
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch (err) {
    console.error("Failed to parse resident session:", err);
    return null;
  }
}

/**
 * Stores a verified resident session and dispatches change notification.
 */
export function setResidentSession(session: ResidentSession): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(SESSION_EVENT_NAME, { detail: session }));
  } catch (err) {
    console.error("Failed to save resident session:", err);
  }
}

/**
 * Clears the resident session (e.g. switch resident).
 */
export function clearResidentSession(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SESSION_EVENT_NAME, { detail: null }));
  } catch (err) {
    console.error("Failed to clear resident session:", err);
  }
}

/**
 * Convenience check for valid resident session.
 */
export function hasValidResidentSession(): boolean {
  return getResidentSession() !== null;
}

/**
 * React hook to reactively subscribe to the resident session state across components.
 */
export function useResidentSession() {
  const [session, setSessionState] = useState<ResidentSession | null>(() => getResidentSession());

  useEffect(() => {
    const update = () => {
      setSessionState(getResidentSession());
    };

    // Listen to custom cross-component events
    window.addEventListener(SESSION_EVENT_NAME, update);
    // Listen to other browser tabs
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener(SESSION_EVENT_NAME, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return {
    session,
    isVerified: session !== null,
    setSession: setResidentSession,
    clearSession: clearResidentSession,
  };
}
