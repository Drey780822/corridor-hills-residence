import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminSession } from "@/lib/admin-session";
import { getAdminMembers } from "@/lib/operations-service";
import { Shield, Lock, ArrowRight, Building2, UserCheck, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAdminSession();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to /admin
  if (isAuthenticated) {
    navigate({ to: "/admin" });
    return null;
  }

  const admins = getAdminMembers();

  const handleLogin = (idToUse?: string) => {
    setError(null);
    const targetId = idToUse || adminId.trim();

    if (!targetId) {
      setError("Please enter or select an Administrator ID.");
      return;
    }

    const res = login(targetId);
    if (res.success) {
      navigate({ to: "/admin" });
    } else {
      setError(
        res.error || `Administrator with ID "${targetId}" not found in operations registry.`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0050A0] text-white shadow-xl shadow-blue-500/20 mb-1 border border-blue-400/30">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-[#10A080] font-bold">
              Tshwane University of Technology
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Corridor Hills Residence
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Operations Control Centre & Administration Portal
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-700/60">
            <Shield className="w-4 h-4 text-[#10A080]" />
            <span>Authorized Personnel Sign-In</span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Roster Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Select Active Administrator:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {admins.map((adm) => (
                <button
                  key={adm.id}
                  type="button"
                  onClick={() => {
                    setAdminId(adm.id);
                    handleLogin(adm.id);
                  }}
                  className="w-full p-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-left border border-slate-600/60 hover:border-[#10A080] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center font-bold text-xs group-hover:bg-[#0050A0] transition-colors">
                      {adm.name?.[0]}
                      {adm.surname?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-snug">
                        {adm.name} {adm.surname}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {adm.roleTitle} · <span className="font-mono text-[#10A080]">{adm.id}</span>
                      </p>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-[#10A080] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              Or Manual ID
            </span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Manual Entry */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Staff ID / Email
              </label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="e.g. CH-ADM-001 or admin@tut.ac.za"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Security Password (Optional in Demo)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0050A0] hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              <span>Access Control Centre</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-1 text-slate-500 text-xs">
          <p>Restricted to Corridor Hills Residence Facilities & Management Staff.</p>
          <div className="flex justify-center space-x-4 pt-2">
            <a href="/staff/login" className="hover:text-slate-300 underline">
              Maintenance Staff Portal
            </a>
            <span>·</span>
            <a href="/" className="hover:text-slate-300 underline">
              Student Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
