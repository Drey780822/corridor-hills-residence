import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StaffHeader, StaffBottomDock } from "@/components/staff/staff-nav";
import { useStaffSession } from "@/lib/staff-session";
import { getStaffMembers, setStaffAvailability } from "@/lib/operations-service";
import { getOfflineActions, syncOfflineQueueNow } from "@/lib/staff-offline-queue";
import type { StaffAvailability } from "@/types/operations";
import {
  User,
  Shield,
  Clock,
  Phone,
  Mail,
  Zap,
  Droplets,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  LogOut,
  RefreshCw,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/staff/profile")({
  component: StaffProfilePage,
});

export function StaffProfilePage() {
  const navigate = useNavigate();
  const { staff, isAuthenticated, logout, updateAvailability } = useStaffSession();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isAuthenticated || !staff) {
    navigate({ to: "/staff/login" });
    return null;
  }

  const offlineActions = getOfflineActions();

  const handleStatusChange = (status: StaffAvailability) => {
    updateAvailability(status);
  };

  const handleForceSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncOfflineQueueNow();
      if (res.processedCount > 0) {
        setSyncMessage(`Successfully synced ${res.processedCount} queued offline actions.`);
      } else {
        setSyncMessage("Offline queue is already up to date.");
      }
    } catch {
      setSyncMessage("Sync failed: Network unreachable.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to end your shift and sign out?")) {
      logout();
      navigate({ to: "/staff/login" });
    }
  };

  const getSkillIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "electrical":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "plumbing":
        return <Droplets className="w-4 h-4 text-cyan-600" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      <StaffHeader />

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Profile Identity Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0050A0] text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
              {staff.name?.[0]}
              {staff.surname?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-[#0A1F3D] truncate">
                  {staff.name} {staff.surname}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {staff.id}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#10A080] uppercase tracking-wider mt-0.5">
                {staff.roleTitle || "Residence Maintenance Technician"}
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Shift: {staff.shiftHours || "07:30 — 16:30"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{staff.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-600 truncate">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{staff.email}</span>
            </div>
          </div>
        </div>

        {/* Operational Status Selector (min 48px touch targets) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Duty Availability Status
            </h2>
            <span className="text-[11px] text-slate-400">Updates automated routing</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: "AVAILABLE",
                label: "Available",
                desc: "Ready for assignment",
                activeClass: "bg-emerald-600 text-white border-emerald-700 shadow-sm",
                dot: "bg-emerald-400",
              },
              {
                id: "BUSY",
                label: "Busy",
                desc: "Currently working job",
                activeClass: "bg-blue-600 text-white border-blue-700 shadow-sm",
                dot: "bg-blue-400",
              },
              {
                id: "ON_BREAK",
                label: "On Break",
                desc: "30m lunch / break",
                activeClass: "bg-amber-600 text-white border-amber-700 shadow-sm",
                dot: "bg-amber-400",
              },
              {
                id: "OFF_DUTY",
                label: "Off Duty",
                desc: "Shift finished",
                activeClass: "bg-slate-700 text-white border-slate-800 shadow-sm",
                dot: "bg-slate-400",
              },
            ].map((opt) => {
              const isSelected = staff.status === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleStatusChange(opt.id as StaffAvailability)}
                  className={`min-h-[52px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? opt.activeClass
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isSelected ? opt.dot : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-bold leading-none">{opt.label}</span>
                  </div>
                  <p
                    className={`text-[10px] mt-1 ${
                      isSelected ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Certified Skills Matrix */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Certified Skills & Specializations
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {["electrical", "plumbing", "general"].map((cat) => {
              const hasSkill = staff.skills.map((s) => s.toLowerCase()).includes(cat);
              return (
                <div
                  key={cat}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    hasSkill
                      ? "bg-slate-50/80 border-slate-200"
                      : "bg-slate-50/30 border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      {getSkillIcon(cat)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 capitalize">
                        {cat} Maintenance
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {hasSkill
                          ? "Certified for automatic work order routing"
                          : "Not assigned to this profile"}
                      </p>
                    </div>
                  </div>

                  {hasSkill ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Inactive</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Offline Cache & Background Sync */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Offline Cache & Sync
            </h2>
            <span className="flex items-center text-xs font-semibold text-emerald-600">
              <Wifi className="w-3.5 h-3.5 mr-1" />
              Connected
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Pending Local Actions</p>
              <p className="text-slate-500 text-[11px]">
                {offlineActions.length === 0
                  ? "All changes synced to operations server"
                  : `${offlineActions.length} work updates waiting in local queue`}
              </p>
            </div>
            <button
              onClick={handleForceSync}
              disabled={syncing}
              className="min-h-[44px] px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          </div>

          {syncMessage && (
            <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
              {syncMessage}
            </p>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full min-h-[50px] rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-sm hover:bg-rose-100 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / End Shift</span>
        </button>
      </main>

      <StaffBottomDock />
    </div>
  );
}
