import type { ExtendedMaintenanceRequest, UserRole } from "../types/operations";
import { getAdminSession } from "./admin-session";
import { getResidentSession } from "./session";
import { getStaffSession } from "./staff-session";

export interface AuthorizationResult {
  authorized: boolean;
  role?: UserRole;
  error?: string;
}

/**
 * Validates whether the active caller has the required role.
 * Used for both API/domain boundary checks and frontend guards.
 */
export function checkRoleAuthorization(allowedRoles: UserRole[]): AuthorizationResult {
  if (allowedRoles.includes("ADMIN")) {
    const adminSession = getAdminSession();
    if (adminSession && adminSession.role === "ADMIN") {
      return { authorized: true, role: "ADMIN" };
    }
  }

  if (allowedRoles.includes("STAFF")) {
    const staffSession = getStaffSession();
    if (staffSession && staffSession.role === "STAFF") {
      return { authorized: true, role: "STAFF" };
    }
  }

  if (allowedRoles.includes("STUDENT")) {
    const studentSession = getResidentSession();
    if (studentSession && studentSession.token) {
      return { authorized: true, role: "STUDENT" };
    }
  }

  return {
    authorized: false,
    error: `Access restricted. Required roles: ${allowedRoles.join(", ")}.`,
  };
}

/**
 * Validates request-level resource ownership.
 * - Admin: full access to all requests.
 * - Staff: access to any assigned job, queue, or residence ticket for operational maintenance.
 * - Student: strictly limited to requests matching their unit.
 */
export function checkRequestResourceAccess(
  request: ExtendedMaintenanceRequest,
  userRole: UserRole,
  userId: string,
): AuthorizationResult {
  if (userRole === "ADMIN") {
    return { authorized: true, role: "ADMIN" };
  }

  if (userRole === "STAFF") {
    return { authorized: true, role: "STAFF" };
  }

  if (userRole === "STUDENT") {
    const studentSession = getResidentSession();
    if (
      (studentSession &&
        (studentSession.unit === request.unit || studentSession.studentNumber === userId)) ||
      request.reportedBy?.studentNumber === userId ||
      request.unit === userId
    ) {
      return { authorized: true, role: "STUDENT" };
    }
    return {
      authorized: false,
      error:
        "You are not authorized to view or modify maintenance requests for another residence unit.",
    };
  }

  return {
    authorized: false,
    error: "Unauthorized user.",
  };
}

/**
 * Checks whether an admin member has a specific granular permission.
 */
export function hasAdminPermission(permission: string): boolean {
  const session = getAdminSession();
  if (!session || session.role !== "ADMIN") return false;
  return session.admin.permissions.includes(permission) || session.admin.permissions.includes("*");
}
