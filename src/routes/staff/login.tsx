import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Wrench } from "lucide-react";
import { useState } from "react";
import { INITIAL_STAFF_MEMBERS } from "../../lib/operations-data";
import { useStaffSession } from "../../lib/staff-session";

export const Route = createFileRoute("/staff/login")({
  component: StaffLoginPage,
});

function StaffLoginPage() {
  const { login, isAuthenticated } = useStaffSession();
  const navigate = useNavigate();
  const [selectedStaffId, setSelectedStaffId] = useState("CH-ST-001");
  const [customId, setCustomId] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    navigate({ to: "/staff" });
  }

  const handleLogin = (idToUse: string) => {
    setError(null);
    const result = login(idToUse);
    if (result.success) {
      navigate({ to: "/staff" });
    } else {
      setError(result.error || "Failed to log in.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#061325] px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A1F3D] p-6 shadow-2xl sm:p-8">
        {/* Brand Crest */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0050A0] font-mono text-base font-black text-white shadow-lg border border-white/20">
            CH
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#10A080]">
              Tshwane University of Technology
            </p>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Maintenance Staff Portal
            </h1>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-white/70">
            Authorized technician terminal. Select your on-duty staff profile or enter your staff
            ID.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* Quick Roster Selector */}
          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">
              Active Technician Roster (Quick Access)
            </p>
            <div className="space-y-1.5">
              {INITIAL_STAFF_MEMBERS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedStaffId(st.id);
                    handleLogin(st.id);
                  }}
                  className={`flex w-full min-h-[48px] items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    selectedStaffId === st.id
                      ? "border-[#10A080] bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0050A0]/40 text-[#10A080]">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {st.name} {st.surname}
                      </p>
                      <p className="text-[10px] font-mono text-white/60">
                        {st.id} &bull; {st.roleTitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40" />
                </button>
              ))}
            </div>
          </div>

          {/* Or Custom ID */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <label
              htmlFor="custom-staff-id"
              className="block text-[11px] font-medium text-white/70"
            >
              Or Enter Staff ID
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="custom-staff-id"
                type="text"
                placeholder="e.g. CH-ST-001"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs text-white placeholder-white/40 focus:border-[#10A080] focus:outline-none"
              />
              <button
                onClick={() => handleLogin(customId)}
                disabled={!customId.trim()}
                className="flex min-h-[48px] items-center justify-center rounded-xl bg-[#0050A0] px-4 text-xs font-bold text-white hover:bg-[#0050A0]/80 disabled:opacity-50 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck className="h-3.5 w-3.5 text-[#10A080]" />
            <span>Corridor Hills RBAC Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
