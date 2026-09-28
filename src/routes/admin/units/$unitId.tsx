import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import { getUnits, getExtendedRequests } from "@/lib/operations-service";
import type { UnitStructure, ExtendedMaintenanceRequest } from "@/types/operations";
import {
  ArrowLeft,
  Building2,
  Users,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  Shield,
  Zap,
  Droplets,
} from "lucide-react";

export const Route = createFileRoute("/admin/units/$unitId")({
  component: AdminUnitDetailPage,
});

export function AdminUnitDetailPage() {
  const { unitId } = Route.useParams();
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [unit, setUnit] = useState<UnitStructure | null>(null);
  const [unitRequests, setUnitRequests] = useState<ExtendedMaintenanceRequest[]>([]);

  const loadData = useCallback(() => {
    const allUnits = getUnits();
    const found = allUnits.find((u) => u.id === unitId || u.unitNumber === unitId);
    if (found) {
      setUnit(found);
      const allRequests = getExtendedRequests();
      const matching = allRequests.filter(
        (r) =>
          r.location.includes(found.unitNumber) ||
          r.location.includes(found.id) ||
          r.location.toUpperCase().includes(found.block.toUpperCase()),
      );
      setUnitRequests(matching);
    }
  }, [unitId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate, loadData]);

  if (!isAuthenticated || !admin) {
    return null;
  }

  if (!unit) {
    return (
      <AdminLayout activeNav="units">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Unit Not Found</h2>
          <p className="text-xs text-slate-500">No unit record found with identifier {unitId}.</p>
          <Link
            to="/admin/units"
            className="inline-flex items-center space-x-1 text-xs font-bold text-[#0050A0] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Residence Units</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isResolved = (status: string) =>
    status === "resolved" || status === "closed" || status === "verified";

  const openTickets = unitRequests.filter((r) => !isResolved(r.status));
  const historicalTickets = unitRequests.filter((r) => isResolved(r.status));

  return (
    <AdminLayout activeNav="units">
      <div className="space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="space-y-1">
            <Link
              to="/admin/units"
              className="inline-flex items-center space-x-1 text-xs font-bold text-[#0050A0] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Units Hierarchy</span>
            </Link>
            <div className="flex items-center space-x-3 mt-1">
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                Unit {unit.unitNumber} ({unit.block})
              </h1>
              {unit.recurringAlert && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertTriangle className="w-3 h-3 mr-1" /> RECURRING FAULT PATTERN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Floor {unit.floor} · Digital ID: <span className="font-mono">{unit.id}</span>
            </p>
          </div>
        </div>

        {/* Recurring Fault Banner */}
        {unit.recurringAlert && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-xs space-y-1">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-900">
                Preventative Maintenance Alert: Recurring Problem Detected
              </h2>
            </div>
            <p className="text-xs text-amber-800">
              {unit.recurringAlertReason ||
                "This unit has registered multiple repeated failures within the last 30 days. Facility management suggests equipment overhaul rather than routine element replacement."}
            </p>
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Open Tickets & Maintenance History */}
          <div className="lg:col-span-7 space-y-6">
            {/* Open Maintenance Tickets */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-[#0050A0]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Active Open Work Orders ({openTickets.length})
                  </h2>
                </div>
              </div>

              {openTickets.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span>No open maintenance tickets in this unit. Systems normal.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {openTickets.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-700">
                            {req.id}
                          </span>
                          <span className="font-bold text-xs text-[#0A1F3D]">{req.issueType}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">{req.description}</p>
                        <div className="text-[11px] text-slate-400">
                          Assigned: {req.assignedStaffName || "Queued Backlog"}
                        </div>
                      </div>

                      <Link
                        to="/admin/requests/$requestId"
                        params={{ requestId: req.id }}
                        className="px-3 py-1.5 rounded-lg bg-[#0050A0] text-white font-bold text-xs flex items-center space-x-1 shrink-0 w-fit hover:bg-[#0A1F3D]"
                      >
                        <span>Audit Ticket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historical Maintenance Log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Historical Work Order Records ({historicalTickets.length})
              </h2>

              {historicalTickets.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No historical maintenance records on file.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {historicalTickets.map((req) => (
                    <div key={req.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-slate-700">{req.id}</span>
                          <span className="font-medium text-slate-800">{req.issueType}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{req.description}</p>
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold shrink-0">
                        Resolved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Resident Roster for this Unit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#0050A0]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Occupancy Roster ({unit.occupancy} / {unit.maxOccupancy})
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {unit.rooms.map((room) => {
                  const resident = unit.students.find((s) => s.room === room);

                  return (
                    <div
                      key={room}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0050A0]/10 text-[#0050A0] font-bold flex items-center justify-center border border-[#0050A0]/20">
                          {room}
                        </div>
                        {resident ? (
                          <div>
                            <p className="font-bold text-slate-800">
                              {resident.name} {resident.surname}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {resident.studentNumber}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-slate-400">Vacant Room</p>
                            <p className="text-[11px] text-slate-300">
                              Ready for student placement
                            </p>
                          </div>
                        )}
                      </div>

                      {resident && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          {resident.residenceStatus}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
