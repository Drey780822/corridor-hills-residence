import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import { getAuditLogs } from "@/lib/audit-service";
import type { AuditLogEntry, UserRole } from "@/types/operations";
import {
  History,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
});

export function AdminAuditPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const loadData = () => {
    setLogs(getAuditLogs());
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  // Filter logs
  const filtered = logs.filter((log) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTarget = log.targetId?.toLowerCase().includes(q) || false;
      const matchActor = log.actorName?.toLowerCase().includes(q) || false;
      const matchAction = log.action?.toLowerCase().includes(q) || false;
      const matchReason = log.reason?.toLowerCase().includes(q) || false;
      if (!matchTarget && !matchActor && !matchAction && !matchReason) return false;
    }

    if (roleFilter !== "ALL" && log.actorRole !== roleFilter) return false;
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;

    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "ADMIN_REASSIGNMENT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "WORK_STARTED":
      case "JOB_ACCEPTED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "JOB_RESOLVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "WORK_PAUSED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "STAFF_STATUS_CHANGE":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "STUDENT_BULK_IMPORT":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AdminLayout activeNav="audit">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-[#0050A0]" />
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                Immutable Operational Audit Log
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only security log recording every work order dispatch, state transition,
              technician reassignment, and system change.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            {filtered.length} of {logs.length} Logged Events
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search target ticket, actor, reason..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "ALL" | UserRole)}
              aria-label="Filter by actor role"

              className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
              <option value="STUDENT">STUDENT</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by action type"
              className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            {(search || roleFilter !== "ALL" || actionFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setActionFilter("ALL");
                }}
                className="p-2 text-rose-600 hover:text-rose-700 cursor-pointer"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp (SAST)</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Details & Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit events match your search filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {new Date(log.timestamp).toLocaleString([], {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getActionBadgeColor(
                            log.action,
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800">{log.targetId}</span>
                        <span className="text-[10px] text-slate-400 block uppercase">
                          {log.targetType}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{log.actorName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {log.actorRole} ({log.actorId})
                        </span>
                      </td>

                      {/* Details & Transition */}
                      <td className="py-3.5 px-4 max-w-md">
                        {log.reason && (
                          <p className="font-semibold text-amber-800 text-[11px] mb-0.5">
                            Reason: {log.reason}
                          </p>
                        )}
                        {log.previousValue && log.newValue ? (
                          <p className="text-slate-500 font-mono text-[11px] truncate">
                            {log.previousValue} → {log.newValue}
                          </p>
                        ) : log.newValue ? (
                          <p className="text-slate-500 text-[11px] truncate">{log.newValue}</p>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic">Logged action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
