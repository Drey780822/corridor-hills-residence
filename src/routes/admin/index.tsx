import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import {
  getExtendedRequests,
  getStaffMembers,
  getSlaComplianceStats,
  getCategoryWorkload,
} from "@/lib/operations-service";
import { getAuditLogs } from "@/lib/audit-service";
import { detectRecurringPattern } from "@/lib/recurring-detector";
import type { ExtendedMaintenanceRequest, AuditLogEntry } from "@/types/operations";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Flame,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  Wrench,
  Zap,
  Droplets,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [requests, setRequests] = useState<ExtendedMaintenanceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

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
    setRequests(getExtendedRequests());
    setAuditLogs(getAuditLogs().slice(0, 8));
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  const staff = getStaffMembers();

  // Compute live metrics
  const isResolved = (status: string) =>
    status === "resolved" || status === "closed" || status === "verified";

  const totalOpen = requests.filter((r) => !isResolved(r.status)).length;
  const inProgress = requests.filter((r) => r.status === "in_progress").length;
  const queued = requests.filter(
    (r) => r.isQueued || (r.status === "assigned" && r.queuePosition),
  ).length;
  const slaAtRisk = requests.filter(
    (r) => !isResolved(r.status) && r.sla?.slaStatus === "at_risk",
  ).length;
  const slaBreached = requests.filter(
    (r) => !isResolved(r.status) && r.sla?.slaStatus === "breached",
  ).length;
  const resolvedToday = requests.filter((r) => {
    if (!isResolved(r.status)) return false;
    const resDate = r.timestamps?.resolved_at
      ? new Date(r.timestamps.resolved_at)
      : new Date(r.timestamps?.reported_at || Date.now());
    const today = new Date();
    return resDate.toDateString() === today.toDateString();
  }).length;

  // Active tickets with highest urgency for SLA Watch
  const activeSlaWatch = requests
    .filter((r) => !isResolved(r.status))
    .sort((a, b) => {
      if (a.operationalPriority === "emergency") return -1;
      if (b.operationalPriority === "emergency") return 1;
      if (a.sla?.slaStatus === "breached") return -1;
      if (b.sla?.slaStatus === "breached") return 1;
      if (a.sla?.slaStatus === "at_risk") return -1;
      if (b.sla?.slaStatus === "at_risk") return 1;
      return new Date(a.sla?.dueAt || 0).getTime() - new Date(b.sla?.dueAt || 0).getTime();
    })
    .slice(0, 5);

  const getCategoryIcon = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "electrical":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "plumbing":
        return <Droplets className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <AdminLayout activeNav="overview">
      <div className="space-y-6">
        {/* Top Header / Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Operations Live Control
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight mt-1">
              Corridor Hills Operations Overview
            </h1>
            <p className="text-xs text-slate-500">
              Monitoring real-time student maintenance dispatches across Blocks A–F.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/requests"
              className="px-4 py-2 rounded-xl bg-[#0050A0] hover:bg-[#0A1F3D] text-white font-bold text-xs shadow-sm flex items-center space-x-2 transition-all"
            >
              <span>Manage All Requests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Operational Snapshot Metric Cards (6 cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Open */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Open Requests
            </p>
            <p className="text-2xl font-black text-[#0A1F3D] mt-1">{totalOpen}</p>
            <p className="text-[10px] text-slate-400 mt-1">Pending student issues</p>
          </div>

          {/* 2. In Progress */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
              In Progress
            </p>
            <p className="text-2xl font-black text-blue-700 mt-1">{inProgress}</p>
            <p className="text-[10px] text-slate-400 mt-1">Technicians on-site</p>
          </div>

          {/* 3. Queued Backlog */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Backlog Queue
            </p>
            <p className="text-2xl font-black text-amber-700 mt-1">{queued}</p>
            <p className="text-[10px] text-slate-400 mt-1">Awaiting free tech</p>
          </div>

          {/* 4. SLA At Risk */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              SLA at Risk
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">{slaAtRisk}</p>
            <p className="text-[10px] text-slate-400 mt-1">&lt; 2h SLA remaining</p>
          </div>

          {/* 5. SLA Breached */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">
              SLA Breached
            </p>
            <p className="text-2xl font-black text-red-700 mt-1">{slaBreached}</p>
            <p className="text-[10px] text-slate-400 mt-1">Past target window</p>
          </div>

          {/* 6. Resolved Today */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Resolved Today
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedToday}</p>
            <p className="text-[10px] text-slate-400 mt-1">Completed repairs</p>
          </div>
        </div>

        {/* 2-Column Grid: SLA Watch Radar & Active On-Site Technicians */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: SLA Watch Radar (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#0050A0]" />
                <h2 className="text-base font-bold text-[#0A1F3D]">SLA Watch Radar</h2>
              </div>
              <span className="text-xs text-slate-400">Target compliance tracking</span>
            </div>

            {activeSlaWatch.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No active work orders currently require urgent monitoring.
              </p>
            ) : (
              <div className="space-y-3">
                {activeSlaWatch.map((item) => {
                  const isBreached = item.sla?.slaStatus === "breached";
                  const isAtRisk = item.sla?.slaStatus === "at_risk";
                  const isEmergency = item.operationalPriority === "emergency";

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {item.id}
                          </span>
                          <span className="font-bold text-xs text-[#0A1F3D]">{item.location}</span>

                          {isEmergency && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                              <Flame className="w-3 h-3 mr-0.5" /> EMERGENCY
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-1">{item.description}</p>

                        <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            {getCategoryIcon(item.category)}
                            <span className="capitalize">{item.category}</span>
                          </span>
                          <span>·</span>
                          <span>
                            Tech:{" "}
                            <span className="font-medium text-slate-700">
                              {item.assignedStaffName || "Queued (Unassigned)"}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center md:flex-col md:items-end justify-between gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isBreached
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : isAtRisk
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isBreached ? "SLA Breached" : isAtRisk ? "At Risk" : "Within Target"}
                        </span>

                        <Link
                          to="/admin/requests/$requestId"
                          params={{ requestId: item.id }}
                          className="text-xs font-bold text-[#0050A0] hover:text-[#0A1F3D] flex items-center space-x-1"
                        >
                          <span>Audit & Reassign</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Staff Roster & Dispatch State (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#0050A0]" />
                <h2 className="text-base font-bold text-[#0A1F3D]">Technician Fleet Status</h2>
              </div>
              <Link
                to="/admin/staff"
                className="text-xs font-bold text-[#0050A0] hover:underline flex items-center space-x-1"
              >
                <span>Manage Staff</span>
              </Link>
            </div>

            <div className="space-y-3">
              {staff.map((tech) => {
                const activeJob = requests.find(
                  (r) =>
                    r.assignedStaffId === tech.id &&
                    (r.status === "in_progress" || r.status === "accepted"),
                );

                const getStatusPill = () => {
                  switch (tech.status) {
                    case "AVAILABLE":
                      return (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          AVAILABLE
                        </span>
                      );
                    case "BUSY":
                      return (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                          BUSY ON JOB
                        </span>
                      );
                    case "ON_BREAK":
                      return (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          ON BREAK
                        </span>
                      );
                    default:
                      return (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">
                          OFF DUTY
                        </span>
                      );
                  }
                };

                return (
                  <div
                    key={tech.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[#0A1F3D]">
                          {tech.name} {tech.surname}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({tech.id})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {tech.skills.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-600 uppercase"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      {activeJob && (
                        <p className="text-[11px] text-[#0050A0] font-medium truncate max-w-[220px]">
                          Working: {activeJob.location} ({activeJob.category})
                        </p>
                      )}
                    </div>

                    <div className="text-right">{getStatusPill()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Operational Audit Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#10A080]" />
              <h2 className="text-base font-bold text-[#0A1F3D]">Live System Audit Feed</h2>
            </div>
            <Link
              to="/admin/audit"
              className="text-xs font-bold text-[#0050A0] hover:underline flex items-center space-x-1"
            >
              <span>Full Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold text-[10px]">
                    {log.action}
                  </span>
                  <span className="font-semibold text-slate-800">Ticket #{log.targetId}</span>
                  <span className="text-slate-500 hidden md:inline">
                    Actor: <span className="font-medium text-slate-700">{log.actorName}</span> (
                    {log.actorRole})
                  </span>
                </div>
                <div className="text-slate-400 font-mono text-[11px] shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
