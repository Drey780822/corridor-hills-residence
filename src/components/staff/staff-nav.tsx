import { Link, useLocation } from "@tanstack/react-router";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Home,
  Layers,
  LogOut,
  RefreshCw,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import type { StaffAvailability } from "../../types/operations";
import { updateStaffAvailability } from "../../lib/operations-service";
import { useStaffOfflineQueue } from "../../lib/staff-offline-queue";
import { useStaffSession } from "../../lib/staff-session";

export function StaffHeader() {
  const { staff, logout } = useStaffSession();
  const { pendingCount, isSyncing, syncNow } = useStaffOfflineQueue();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  if (!staff) return null;

  const handleStatusChange = (newStatus: StaffAvailability) => {
    updateStaffAvailability(staff.id, newStatus, `${staff.name} ${staff.surname}`, "STAFF");
    setStatusMenuOpen(false);
  };

  const statusColors: Record<StaffAvailability, string> = {
    AVAILABLE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    BUSY: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    ON_BREAK: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    OFF_DUTY: "bg-slate-500/20 text-slate-300 border-slate-500/40",
    UNAVAILABLE: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  };

  const statusLabels: Record<StaffAvailability, string> = {
    AVAILABLE: "Available",
    BUSY: "Busy with Job",
    ON_BREAK: "On Break",
    OFF_DUTY: "Off Duty",
    UNAVAILABLE: "Unavailable",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A1F3D]/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/staff" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0050A0] font-mono text-xs font-black tracking-wider text-white shadow-sm border border-white/20">
              CH
            </span>
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10A080]">
                Technician Portal
              </span>
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white">
              {staff.name} {staff.surname}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline / Sync Indicator */}
          {pendingCount > 0 ? (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-medium text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
              title="Actions queued locally while offline"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{pendingCount} queued</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60 border border-white/10">
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span>Synced</span>
            </span>
          )}

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${statusColors[staff.status]} transition-all`}
              aria-label="Change technician status"
            >
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              <span>{statusLabels[staff.status]}</span>
            </button>

            {statusMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/15 bg-[#0A1F3D] p-1.5 shadow-2xl z-50">
                <p className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/50">
                  Set My Status
                </p>
                {(["AVAILABLE", "BUSY", "ON_BREAK", "OFF_DUTY"] as StaffAvailability[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-left transition-colors ${
                        staff.status === st
                          ? "bg-white/15 text-white font-bold"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{statusLabels[st]}</span>
                      {staff.status === st && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#10A080]" />
                      )}
                    </button>
                  ),
                )}
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function StaffBottomDock() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: "Home", path: "/staff", icon: Home },
    { label: "My Work", path: "/staff/work", icon: Briefcase },
    { label: "Queue", path: "/staff/queue", icon: Layers },
    { label: "Profile", path: "/staff/profile", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0A1F3D]/95 px-3 py-2 backdrop-blur-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Staff navigation dock"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.path === "/staff" ? currentPath === "/staff" : currentPath.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex min-h-[48px] min-w-[56px] flex-col items-center justify-center rounded-xl px-2 py-1 text-xs transition-colors ${
                isActive ? "text-[#10A080] font-bold" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-[#10A080]" : "text-current"}`} />
              <span className="mt-1 text-[11px] leading-none tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
