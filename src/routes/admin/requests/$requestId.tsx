import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import {
  getExtendedRequests,
  getStaffMembers,
  adminReassignRequest,
} from "@/lib/operations-service";
import { getAuditLogsForRequest } from "@/lib/audit-service";
import type { ExtendedMaintenanceRequest, AuditLogEntry, StaffMember } from "@/types/operations";
import {
  ArrowLeft,
  Clock,
  Flame,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Droplets,
  Wrench,
  Camera,
  History,
  Shield,
  Send,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/requests/$requestId")({
  component: AdminRequestDetailPage,
});

export function AdminRequestDetailPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [request, setRequest] = useState<ExtendedMaintenanceRequest | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSuccess, setReassignSuccess] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const all = getExtendedRequests();
    const found = all.find((r) => r.id === requestId);
    if (found) {
      setRequest(found);
      const logs = getAuditLogsForRequest(requestId);
      setAuditLogs(logs);
    }
  }, [requestId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, loadData]);

  if (!isAuthenticated || !admin) {
    return null;
  }

  if (!request) {
    return (
      <AdminLayout activeNav="requests">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Request Not Found</h2>
          <p className="text-xs text-slate-500">
            No maintenance work order found with identifier #{requestId}.
          </p>
          <Link
            to="/admin/requests"
            className="inline-flex items-center space-x-1 text-xs font-bold text-[#0050A0] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Requests Manager</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const staffList = getStaffMembers();
  const isEmergency = request.operationalPriority === "emergency";
  const isBreached = request.sla?.slaStatus === "breached";
  const isAtRisk = request.sla?.slaStatus === "at_risk";
  const isResolved =
    request.status === "resolved" || request.status === "closed" || request.status === "verified";

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReassignError(null);
    setReassignSuccess(null);

    if (!selectedStaffId) {
      setReassignError("Please select a technician from the roster.");
      return;
    }
    if (!reassignReason.trim() || reassignReason.trim().length < 8) {
      setReassignError("Mandatory justification reason required (minimum 8 characters).");
      return;
    }

    try {
      const updated = adminReassignRequest(
        request.id,
        selectedStaffId,
        reassignReason.trim(),
        `${admin.name} ${admin.surname}`,
      );

      if (updated) {
        setReassignSuccess("Work order successfully reassigned! Audit trail logged.");
        setRequest(updated);
        setIsReassignModalOpen(false);
        setReassignReason("");
        loadData();
      } else {
        setReassignError("Failed to execute reassignment.");
      }
    } catch (err: unknown) {
      setReassignError((err as Error).message || "Error occurred during reassignment.");
    }
  };

  return (
    <AdminLayout activeNav="requests">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="space-y-1">
            <Link
              to="/admin/requests"
              className="inline-flex items-center space-x-1 text-xs font-bold text-[#0050A0] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Requests Manager</span>
            </Link>
            <div className="flex items-center space-x-3 mt-1">
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                Work Order Audit: #{request.id}
              </h1>
              {isEmergency && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white animate-pulse">
                  <Flame className="w-3 h-3 mr-0.5" /> EMERGENCY DISPATCH
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Location: <span className="font-bold text-slate-800">{request.location}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsReassignModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#0050A0] hover:bg-[#0A1F3D] text-white font-bold text-xs shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reassign Work Order</span>
            </button>
          </div>
        </div>

        {reassignSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reassignSuccess}</span>
          </div>
        )}

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Issue Details, Photos, Technician Notes */}
          <div className="lg:col-span-8 space-y-6">
            {/* Issue Description Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Problem Description & Evidence
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Category
                  </span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">
                    {request.category}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Problem Area
                  </span>
                  <span className="font-bold text-slate-800 capitalize mt-0.5 block">
                    {request.problemArea}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Specific Issue
                  </span>
                  <span className="font-bold text-slate-800 mt-0.5 block truncate">
                    {request.issueType}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Operational Priority
                  </span>
                  <span
                    className={`font-bold uppercase mt-0.5 block ${
                      isEmergency
                        ? "text-rose-600"
                        : request.operationalPriority === "high"
                          ? "text-amber-600"
                          : "text-slate-800"
                    }`}
                  >
                    {request.operationalPriority}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Resident Description:
                </span>
                <p className="text-xs text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                  {request.description}
                </p>
              </div>

              {/* Photo Evidence */}
              {(request.photoUrl || (request.photoUrls && request.photoUrls.length > 0)) && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-500 flex items-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <span>Resident Submitted Photos:</span>
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {request.photoUrls ? (
                      request.photoUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={url}
                            alt={`Evidence ${i + 1}`}
                            className="w-32 h-32 object-cover"
                          />
                        </a>
                      ))
                    ) : (
                      <a
                        href={request.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={request.photoUrl}
                          alt="Evidence"
                          className="w-32 h-32 object-cover"
                        />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Technician Notes & Work Evidence */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                On-Site Technician Field Notes & Proof of Work
              </h2>

              {request.pauseReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-800">
                    Paused: {request.pauseReason.replace(/_/g, " ")}
                  </span>
                  {request.pauseNote && <p className="text-amber-700">{request.pauseNote}</p>}
                </div>
              )}

              {request.technicianNotes && request.technicianNotes.length > 0 ? (
                <div className="space-y-2">
                  {request.technicianNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-700">{note.author}</span>
                        <span>{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800">{note.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No technician field notes have been logged for this ticket yet.
                </p>
              )}

              {/* Work Evidence photos if uploaded by technician */}
              {request.workEvidence && request.workEvidence.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600 block">
                    Technician Work Evidence ({request.workEvidence.length} items):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {request.workEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50"
                      >
                        <img src={ev.url} alt={ev.name} className="w-full h-24 object-cover" />
                        <div className="p-2 text-[10px]">
                          <span className="font-bold uppercase text-[#0050A0]">{ev.type}</span>
                          <p className="text-slate-500 truncate">{ev.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.resolutionSummary && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-emerald-900 block">Resolution Summary:</span>
                  <p className="text-emerald-800">{request.resolutionSummary}</p>
                </div>
              )}
            </div>

            {/* Complete Immutable Audit Trail */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-[#0050A0]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Immutable Audit Trail
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {auditLogs.length} logged events
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No audit entries recorded yet.
                </p>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#0050A0] border-2 border-white shadow-2xs" />
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800">{log.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          By <span className="font-semibold text-slate-800">{log.actorName}</span> (
                          {log.actorRole})
                        </p>
                        {log.reason && (
                          <p className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 text-[11px] mt-1">
                            Reason: {log.reason}
                          </p>
                        )}
                        {log.previousValue && log.newValue && (
                          <div className="text-[11px] text-slate-500 font-mono mt-1">
                            Transition: {log.previousValue} → {log.newValue}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Dispatch & Assignment Info, Resident Profile */}
          <div className="lg:col-span-4 space-y-6">
            {/* SLA & Status Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                SLA Compliance Matrix
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Window:</span>
                  <span className="font-bold text-slate-800">
                    {request.sla?.targetHours || 24} hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">SLA Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      isBreached
                        ? "bg-rose-100 text-rose-800"
                        : isAtRisk
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isBreached ? "Breached" : isAtRisk ? "At Risk" : "On Track"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Deadline:</span>
                  <span className="font-mono text-slate-700">
                    {request.sla?.dueAt ? new Date(request.sla.dueAt).toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Technician Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Technician
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">
                  {request.assignedStaffId || "UNASSIGNED"}
                </span>
              </div>

              {request.assignedStaffId ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0050A0] text-white flex items-center justify-center font-bold text-sm">
                      {request.assignedStaffName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {request.assignedStaffName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {request.assignedStaffId}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsReassignModalOpen(true)}
                    className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Change Assigned Technician</span>
                  </button>
                </div>
              ) : (
                <div className="py-3 text-center space-y-2">
                  <p className="text-xs text-amber-700 font-semibold">
                    Currently Queued in Backlog
                  </p>
                  <button
                    onClick={() => setIsReassignModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#0050A0] text-white font-bold text-xs hover:bg-[#0A1F3D] transition-colors cursor-pointer"
                  >
                    Assign Technician Now
                  </button>
                </div>
              )}
            </div>

            {/* Resident Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Reporting Student Resident
              </h2>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-800">
                    {request.reportedBy?.name || "Resident"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Student Number:</span>
                  <span className="font-mono text-slate-800">
                    {request.reportedBy?.studentNumber || "TUT-STD-2026"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-semibold text-slate-800">
                    {request.reportedBy?.room || "Room C"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="text-slate-700">
                    {request.reportedBy?.contactNumber || "+27 71 000 0000"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reassignment Modal */}
        {isReassignModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[#0050A0]" />
                  <h3 className="text-base font-bold text-[#0A1F3D]">
                    Reassign Work Order #{request.id}
                  </h3>
                </div>
                <button
                  onClick={() => setIsReassignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {reassignError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{reassignError}</span>
                </div>
              )}

              <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select New Assigned Technician:
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    aria-label="Select technician for reassignment"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                  >
                    <option value="">-- Choose Technician from Roster --</option>
                    {staffList.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.surname} ({st.id}) — {st.roleTitle} [{st.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mandatory Operational Justification (Recorded in Immutable Audit Log):
                  </label>
                  <textarea
                    rows={3}
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="Provide specific reason for reassignment (e.g. Technician unavailable, specialist electrical required, load balancing)..."
                    className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Minimum 8 characters. Stored permanently under administrative audit.
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsReassignModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0050A0] hover:bg-[#0A1F3D] text-white font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Confirm Reassignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
