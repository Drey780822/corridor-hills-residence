import { Link, useLocation } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAdminSession } from "../../lib/admin-session";
import { getExtendedRequests, getStaffMembers } from "../../lib/operations-service";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { admin, logout } = useAdminSession();
  const location = useLocation();
  const currentPath = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-ZA", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const allRequests = getExtendedRequests();
  const allStaff = getStaffMembers();

  const emergencyCount = allRequests.filter(
    (r) =>
      r.operationalPriority === "emergency" &&
      r.status !== "resolved" &&
      r.status !== "verified" &&
      r.status !== "closed",
  ).length;

  const activeStaffCount = allStaff.filter((s) => s.active && s.status !== "OFF_DUTY").length;

  const navLinks = [
    { label: "Overview", path: "/admin", icon: LayoutDashboard },
    { label: "Requests", path: "/admin/requests", icon: Wrench },
    { label: "Units & Hierarchy", path: "/admin/units", icon: Building2 },
    { label: "Residents", path: "/admin/residents", icon: Users },
    { label: "Staff & Skills", path: "/admin/staff", icon: Shield },
    { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    { label: "Audit Log", path: "/admin/audit", icon: History },
    { label: "Configuration", path: "/admin/configuration", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#061325] text-white font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0A1F3D] lg:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0050A0] font-mono text-sm font-black tracking-wider text-white shadow-md border border-white/20">
            CH
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#10A080]">
              Control Centre
            </span>
            <h2 className="text-sm font-bold tracking-tight text-white">Corridor Hills</h2>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 p-3" aria-label="Admin sidebar">
          {navLinks.map((item) => {
            const isActive =
              item.path === "/admin" ? currentPath === "/admin" : currentPath.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0050A0] text-white shadow-sm border border-white/10"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#10A080]" : "text-white/50"}`} />
                <span>{item.label}</span>
                {item.label === "Requests" && emergencyCount > 0 && (
                  <span className="ml-auto rounded-full bg-rose-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300 border border-rose-500/50">
                    {emergencyCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin User Footer */}
        {admin && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <p className="truncate text-xs font-bold text-white">
                  {admin.name} {admin.surname}
                </p>
                <p className="truncate text-[10px] font-mono text-white/50">{admin.roleTitle}</p>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:bg-rose-500/20 hover:text-rose-300 transition-colors border border-white/10"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Modal */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-col border-r border-white/10 bg-[#0A1F3D] p-4 shadow-2xl z-50">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0050A0] font-mono text-xs font-black text-white">
                  CH
                </div>
                <span className="text-sm font-bold text-white">Operations Centre</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-1">
              {navLinks.map((item) => {
                const isActive =
                  item.path === "/admin"
                    ? currentPath === "/admin"
                    : currentPath.startsWith(item.path);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                      isActive
                        ? "bg-[#0050A0] text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-[#10A080]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {admin && (
              <div className="border-t border-white/10 pt-3">
                <p className="text-xs font-bold text-white">
                  {admin.name} {admin.surname}
                </p>
                <p className="text-[10px] text-white/50">{admin.roleTitle}</p>
                <button
                  onClick={logout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500/20 py-2 text-xs font-semibold text-rose-300 border border-rose-500/30"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Operations Status Bar */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0A1F3D]/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10A080]">
                Tshwane University of Technology
              </span>
              <p className="text-xs font-semibold text-white/90">
                Corridor Hills Residence Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="hidden items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-white/70 border border-white/10 md:flex">
              <Clock className="h-3.5 w-3.5 text-[#10A080]" />
              <span>{currentTime} SAST</span>
            </div>

            {/* Active Staff Counter */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeStaffCount} On Duty</span>
            </div>

            {/* Emergency Indicator */}
            {emergencyCount > 0 && (
              <Link
                to="/admin/requests"
                className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 border border-rose-500/40 animate-pulse"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>{emergencyCount} Emergency</span>
              </Link>
            )}
          </div>
        </header>

        {/* Child Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#061325]">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
