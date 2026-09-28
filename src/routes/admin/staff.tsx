import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import {
  getStaffMembers,
  saveStaffMembers,
  getExtendedRequests,
  updateStaffAvailability,
} from "@/lib/operations-service";
import { recordAuditEvent } from "@/lib/audit-service";
import type { StaffMember, StaffAvailability } from "@/types/operations";
import {
  Users,
  Shield,
  Clock,
  Phone,
  Mail,
  Zap,
  Droplets,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Save,
} from "lucide-react";

export const Route = createFileRoute("/admin/staff")({
  component: AdminStaffPage,
});

export function AdminStaffPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

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
    setStaffList(getStaffMembers());
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  const allRequests = getExtendedRequests();

  const handleStatusOverride = (staffId: string, newStatus: StaffAvailability) => {
    const updated = updateStaffAvailability(
      staffId,
      newStatus,
      `${admin.name} ${admin.surname}`,
      "ADMIN",
    );
    if (updated) {
      setSaveFeedback(
        `Updated availability status for ${updated.name} ${updated.surname} to ${newStatus}.`,
      );
      loadData();
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleToggleSkill = (staffId: string, skill: string) => {
    const target = staffList.find((s) => s.id === staffId);
    if (!target) return;

    const lowerSkill = skill.toLowerCase();
    const has = target.skills.map((s) => s.toLowerCase()).includes(lowerSkill);
    const newSkills = has
      ? target.skills.filter((s) => s.toLowerCase() !== lowerSkill)
      : [...target.skills, lowerSkill];

    const updatedList = staffList.map((s) => (s.id === staffId ? { ...s, skills: newSkills } : s));
    saveStaffMembers(updatedList);
    setStaffList(updatedList);

    recordAuditEvent({
      actorId: admin.id,
      actorName: `${admin.name} ${admin.surname}`,
      actorRole: "ADMIN",
      action: "STAFF_SKILL_UPDATED",
      targetType: "staff",
      targetId: staffId,
      previousValue: target.skills.join(", "),
      newValue: newSkills.join(", "),
      reason: `Admin skill adjustment by ${admin.name}`,
    });

    setSaveFeedback(`Skills updated for technician ${target.name} ${target.surname}.`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleToggleActive = (staffId: string) => {
    const target = staffList.find((s) => s.id === staffId);
    if (!target) return;

    const newActive = !target.active;
    const updatedList = staffList.map((s) => (s.id === staffId ? { ...s, active: newActive } : s));
    saveStaffMembers(updatedList);
    setStaffList(updatedList);

    recordAuditEvent({
      actorId: admin.id,
      actorName: `${admin.name} ${admin.surname}`,
      actorRole: "ADMIN",
      action: "STAFF_ACTIVE_TOGGLED",
      targetType: "staff",
      targetId: staffId,
      previousValue: String(target.active),
      newValue: String(newActive),
      reason: `Admin active status adjustment by ${admin.name}`,
    });

    setSaveFeedback(
      `Technician ${target.name} ${target.surname} is now ${newActive ? "Active" : "Deactivated"}.`,
    );
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const availableSkills = [
    "electrical",
    "plumbing",
    "general",
    "carpentry",
    "access_control",
    "hvac",
  ];

  return (
    <AdminLayout activeNav="staff">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#0050A0]" />
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                Staff & Skills Matrix Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control technician rosters, availability overrides, and certified skill allocations
              for automatic dispatch.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            {staffList.filter((s) => s.active).length} of {staffList.length} Technicians Active
          </div>
        </div>

        {saveFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Staff Members Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {staffList.map((member) => {
            const activeJob = allRequests.find(
              (r) =>
                r.assignedStaffId === member.id &&
                (r.status === "in_progress" || r.status === "accepted"),
            );

            return (
              <div
                key={member.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 ${
                  member.active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
                }`}
              >
                {/* Technician Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-[#0050A0] text-white flex items-center justify-center font-bold text-lg">
                      {member.name?.[0]}
                      {member.surname?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-bold text-[#0A1F3D]">
                          {member.name} {member.surname}
                        </h2>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {member.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#10A080] font-semibold">{member.roleTitle}</p>
                      <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {member.shiftHours}
                        </span>
                        <span>·</span>
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active / Inactive switch */}
                  <button
                    onClick={() => handleToggleActive(member.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      member.active
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {member.active ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Availability Status Override */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-500 block">
                    Manager Status Override:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      {
                        id: "AVAILABLE",
                        label: "Available",
                        activeClass: "bg-emerald-600 text-white",
                      },
                      { id: "BUSY", label: "Busy", activeClass: "bg-blue-600 text-white" },
                      { id: "ON_BREAK", label: "On Break", activeClass: "bg-amber-600 text-white" },
                      { id: "OFF_DUTY", label: "Off Duty", activeClass: "bg-slate-700 text-white" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleStatusOverride(member.id, opt.id as StaffAvailability)}
                        className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                          member.status === opt.id
                            ? opt.activeClass
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Workload & Active Job */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Today's Completed: </span>
                    <span className="font-bold text-slate-800">{member.completedTodayCount}</span>
                  </div>
                  {activeJob ? (
                    <Link
                      to="/admin/requests/$requestId"
                      params={{ requestId: activeJob.id }}
                      className="text-xs font-bold text-[#0050A0] hover:underline"
                    >
                      Working on: {activeJob.location} →
                    </Link>
                  ) : (
                    <span className="text-slate-400 italic">No job currently active</span>
                  )}
                </div>

                {/* Certified Skills Matrix Checkboxes */}
                <div className="space-y-1.5 text-xs pt-1">
                  <span className="font-semibold text-slate-500 block">
                    Certified Skills (Affects Auto-Routing):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSkills.map((sk) => {
                      const has = member.skills.map((s) => s.toLowerCase()).includes(sk);
                      return (
                        <button
                          key={sk}
                          onClick={() => handleToggleSkill(member.id, sk)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                            has
                              ? "bg-[#0050A0] text-white"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {has && <Check className="w-3 h-3 mr-0.5" />}
                          <span className="capitalize">{sk.replace("_", " ")}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
