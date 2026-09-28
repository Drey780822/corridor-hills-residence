import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import { recordAuditEvent } from "@/lib/audit-service";
import {
  Settings,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Droplets,
  Wrench,
  RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/admin/configuration")({
  component: AdminConfigurationPage,
});

export function AdminConfigurationPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();

  // Local config state
  const [slaHours, setSlaHours] = useState({
    emergency: 2,
    high: 6,
    standard: 24,
    low: 48,
  });

  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(true);
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(3);
  const [mandatoryRejectionReason, setMandatoryRejectionReason] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !admin) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    recordAuditEvent({
      actorId: admin.id,
      actorName: `${admin.name} ${admin.surname}`,
      actorRole: "ADMIN",
      action: "CONFIG_UPDATED",
      targetType: "configuration",
      targetId: "sys-config-v1",
      newValue: `Emergency: ${slaHours.emergency}h, High: ${slaHours.high}h, Std: ${slaHours.standard}h, AutoDispatch: ${autoDispatchEnabled}`,
      reason: `System parameters updated by ${admin.name}`,
    });

    setSavedFeedback("System operational parameters and SLA thresholds successfully updated!");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  return (
    <AdminLayout activeNav="configuration">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-[#0050A0]" />
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                System Configuration & Policies
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune operational Service Level Agreement (SLA) windows, automatic routing heuristics,
              and dispatch safety limits.
            </p>
          </div>
        </div>

        {savedFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedFeedback}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: SLA Target Windows */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#0050A0]" />
                <h2 className="text-base font-bold text-[#0A1F3D]">
                  SLA Target Resolution Windows
                </h2>
              </div>
              <span className="text-xs text-slate-400">Hours before ticket marks breached</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Emergency */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>Emergency Priority</span>
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold uppercase">
                    Immediate Dispatch
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Power outage, geyser bursts, severe water leak, fire hazard.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={slaHours.emergency}
                    onChange={(e) =>
                      setSlaHours({ ...slaHours, emergency: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
                  />
                  <span className="font-semibold text-slate-700">Hours target</span>
                </div>
              </div>

              {/* High */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                    <span>High Priority</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold uppercase">
                    Same-Day Window
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Stove failure, blocked toilet, main room light inoperable.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="number"
                    min={2}
                    max={48}
                    value={slaHours.high}
                    onChange={(e) =>
                      setSlaHours({ ...slaHours, high: parseInt(e.target.value, 10) || 6 })
                    }
                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
                  />
                  <span className="font-semibold text-slate-700">Hours target</span>
                </div>
              </div>

              {/* Standard */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-blue-800">
                    <span>Standard Priority</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold uppercase">
                    Next Business Day
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Dripping tap, cupboard hinge, study lamp replacement.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="number"
                    min={6}
                    max={72}
                    value={slaHours.standard}
                    onChange={(e) =>
                      setSlaHours({ ...slaHours, standard: parseInt(e.target.value, 10) || 24 })
                    }
                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
                  />
                  <span className="font-semibold text-slate-700">Hours target</span>
                </div>
              </div>

              {/* Low */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <span>Low Priority</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    48h Window
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Aesthetic paint touch-up, curtain hook, desk scratch.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={slaHours.low}
                    onChange={(e) =>
                      setSlaHours({ ...slaHours, low: parseInt(e.target.value, 10) || 48 })
                    }
                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
                  />
                  <span className="font-semibold text-slate-700">Hours target</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Automated Dispatch & Routing Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-[#0050A0]" />
                <h2 className="text-base font-bold text-[#0A1F3D]">
                  Automated Assignment Engine Controls
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Auto-Dispatch from Skill Queue</p>
                  <p className="text-[11px] text-slate-500">
                    Automatically assign next queued job when a technician resolves a ticket or
                    toggles to AVAILABLE.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDispatchEnabled}
                    onChange={(e) => setAutoDispatchEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0050A0]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">
                    Enforce Mandatory Rejection Justification
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Requires technician to select a validated operational reason when unable to
                    accept a routed job.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mandatoryRejectionReason}
                    onChange={(e) => setMandatoryRejectionReason(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0050A0]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-800">Maximum Concurrent Jobs per Artisan</p>
                  <p className="text-[11px] text-slate-500">
                    If active assignments reach this limit, subsequent requests route to the skill
                    queue.
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={maxConcurrentJobs}
                  onChange={(e) => setMaxConcurrentJobs(parseInt(e.target.value, 10) || 3)}
                  className="w-16 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-800 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#0050A0] hover:bg-[#0A1F3D] text-white font-bold text-xs shadow-md shadow-blue-500/10 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save System Parameters</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
