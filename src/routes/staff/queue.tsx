import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StaffHeader, StaffBottomDock } from "@/components/staff/staff-nav";
import { useStaffSession } from "@/lib/staff-session";
import {
  getQueuedRequests,
  getStaffMembers,
  acceptJob,
  getExtendedRequests,
} from "@/lib/operations-service";
import type { ExtendedMaintenanceRequest } from "@/types/operations";
import {
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldAlert,
  Wrench,
  Droplets,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/staff/queue")({
  component: StaffQueuePage,
});

export function StaffQueuePage() {
  const navigate = useNavigate();
  const { staff, isAuthenticated } = useStaffSession();
  const [queuedRequests, setQueuedRequests] = useState<ExtendedMaintenanceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "ELECTRICAL" | "PLUMBING" | "GENERAL">("ALL");
  const [claimingJobId, setClaimingJobId] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/staff/login" });
      return;
    }
    loadQueue();
  }, [isAuthenticated, navigate]);

  const loadQueue = () => {
    const list = getQueuedRequests();
    setQueuedRequests(list);
  };

  const getCategoryIcon = (category: string) => {
    const c = category?.toLowerCase();
    switch (c) {
      case "electrical":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "plumbing":
        return <Droplets className="w-4 h-4 text-cyan-600" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  const allStaff = getStaffMembers();

  // Filter based on active tab
  const filteredRequests = queuedRequests.filter((req) => {
    if (activeTab === "ALL") return true;
    return req.category?.toLowerCase() === activeTab.toLowerCase();
  });

  // Check how many staff members have skills for this category and their statuses
  const getStaffStatusForCategory = (category: string) => {
    const cat = category.toLowerCase();
    const qualified = allStaff.filter(
      (s) => s.skills.map((sk) => sk.toLowerCase()).includes(cat) && s.active,
    );
    const available = qualified.filter((s) => s.status === "AVAILABLE");
    const busy = qualified.filter((s) => s.status === "BUSY");
    const onBreak = qualified.filter((s) => s.status === "ON_BREAK");
    const offDuty = qualified.filter((s) => s.status === "OFF_DUTY");

    if (qualified.length === 0) {
      return { text: "No active technician qualified for this skill", color: "text-amber-700" };
    }
    if (available.length > 0) {
      return {
        text: `${available.length} technician(s) available for assignment`,
        color: "text-emerald-700",
      };
    }
    if (busy.length > 0) {
      return {
        text: `All ${busy.length} technician(s) actively busy on other work orders`,
        color: "text-blue-700",
      };
    }
    return {
      text: `${onBreak.length + offDuty.length} technician(s) on break / off-duty`,
      color: "text-slate-600",
    };
  };

  const handleClaimJob = (request: ExtendedMaintenanceRequest) => {
    if (!staff) return;
    setClaimingJobId(request.id);
    setClaimError(null);
    setClaimSuccess(null);

    // Can current staff claim this?
    const hasSkill = staff.skills
      .map((s) => s.toLowerCase())
      .includes(request.category?.toLowerCase() || "");
    if (!hasSkill) {
      setClaimError(
        `Your assigned profile does not include ${request.category} certification. Admin dispatch or cross-skill authorization required.`,
      );
      setClaimingJobId(null);
      return;
    }

    try {
      const res = acceptJob(request.id, staff.id);
      if (res) {
        setClaimSuccess(`Job ${request.id} claimed! Directing to active work order...`);
        setTimeout(() => {
          navigate({ to: "/staff/job/$jobId", params: { jobId: request.id } });
        }, 800);
      } else {
        setClaimError("Failed to claim job.");
      }
    } catch (e: unknown) {
      setClaimError(e instanceof Error ? e.message : "Error occurred while claiming work order.");
    } finally {
      setClaimingJobId(null);
      loadQueue();
    }
  };

  if (!isAuthenticated || !staff) {
    return null;
  }

  // Count by categories
  const electricalCount = queuedRequests.filter(
    (r) => r.category?.toLowerCase() === "electrical",
  ).length;
  const plumbingCount = queuedRequests.filter(
    (r) => r.category?.toLowerCase() === "plumbing",
  ).length;
  const generalCount = queuedRequests.filter((r) => r.category?.toLowerCase() === "general").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      <StaffHeader />

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Title & Queue stats */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-[#0050A0]/10 flex items-center justify-center text-[#0050A0]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0A1F3D] tracking-tight">
                  Skill Backlog Queue
                </h1>
                <p className="text-xs text-slate-500">
                  {queuedRequests.length} unassigned tickets waiting for available technicians
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Auto-dispatches on finish
            </span>
          </div>

          {claimSuccess && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {claimError && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{claimError}</span>
            </div>
          )}
        </div>

        {/* Skill Category Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`py-2 px-1 rounded-lg transition-all text-center ${
              activeTab === "ALL"
                ? "bg-white text-[#0A1F3D] shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({queuedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("ELECTRICAL")}
            className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center space-x-1 ${
              activeTab === "ELECTRICAL"
                ? "bg-white text-amber-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Elec ({electricalCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("PLUMBING")}
            className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center space-x-1 ${
              activeTab === "PLUMBING"
                ? "bg-white text-cyan-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Droplets className="w-3 h-3 text-cyan-600" />
            <span>Plumb ({plumbingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab("GENERAL")}
            className={`py-2 px-1 rounded-lg transition-all text-center flex items-center justify-center space-x-1 ${
              activeTab === "GENERAL"
                ? "bg-white text-slate-800 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench className="w-3 h-3 text-slate-500" />
            <span>Gen ({generalCount})</span>
          </button>
        </div>

        {/* Status info bar for filtered category */}
        {activeTab !== "ALL" && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700">{activeTab} Dispatch Status: </span>
            <span className={getStaffStatusForCategory(activeTab).color}>
              {getStaffStatusForCategory(activeTab).text}
            </span>
          </div>
        )}

        {/* Queued List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Backlog Clear</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No maintenance requests are currently awaiting dispatch in this category. All new
                tickets will be routed immediately.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req, index) => {
              const isEligible = staff.skills
                .map((s) => s.toLowerCase())
                .includes(req.category?.toLowerCase() || "");
              const isEmergency = req.operationalPriority === "emergency";

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                    isEmergency
                      ? "border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/20"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                        #{index + 1}
                      </span>
                      <span className="font-bold text-sm text-[#0A1F3D]">{req.location}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {isEmergency ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white animate-pulse">
                          <Flame className="w-3 h-3 mr-0.5" /> EMERGENCY
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            req.operationalPriority === "high"
                              ? "bg-amber-100 text-amber-800"
                              : req.operationalPriority === "standard"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {req.operationalPriority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category and title */}
                  <div className="mt-2.5 flex items-center space-x-2">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                      {getCategoryIcon(req.category)}
                      <span className="capitalize">{req.category}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {req.id}</span>
                  </div>

                  <p className="mt-2 text-xs text-slate-700 line-clamp-2">{req.description}</p>

                  {/* Reason why it's queued */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Waiting for {req.category?.toLowerCase()} technician
                        {req.sla?.dueAt &&
                          ` (SLA: ${new Date(req.sla.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`}
                      </span>
                    </div>

                    {/* Claim action */}
                    {isEligible ? (
                      <button
                        onClick={() => handleClaimJob(req)}
                        disabled={claimingJobId === req.id}
                        className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0050A0] text-white font-semibold text-xs hover:bg-[#0A1F3D] active:scale-[0.98] transition-all flex items-center space-x-1 shadow-sm shrink-0 cursor-pointer"
                      >
                        {claimingJobId === req.id ? (
                          <span>Claiming...</span>
                        ) : (
                          <>
                            <span>Take Job Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Requires {req.category} skill
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <StaffBottomDock />
    </div>
  );
}
