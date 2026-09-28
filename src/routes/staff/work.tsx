import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Clock, Filter, MapPin, Search, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { StaffBottomDock, StaffHeader } from "../../components/staff/staff-nav";
import { getExtendedRequests } from "../../lib/operations-service";
import { useStaffSession } from "../../lib/staff-session";
import type { ExtendedMaintenanceRequest, RequestStatus } from "../../types/operations";

export const Route = createFileRoute("/staff/work")({
  component: StaffWorkPage,
});

type WorkFilterTab = "ALL" | "NEW" | "ACCEPTED" | "IN_PROGRESS" | "AWAITING" | "COMPLETED";

function StaffWorkPage() {
  const { staff, isAuthenticated } = useStaffSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WorkFilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/staff/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!staff) return null;

  const allRequests = getExtendedRequests();
  const myWork = allRequests.filter(
    (r) => r.assignedStaffId === staff.id || r.assignedTechnician?.name.includes(staff.name),
  );

  const filtered = myWork.filter((r) => {
    // Tab filter
    if (activeTab === "NEW" && r.status !== "assigned") return false;
    if (activeTab === "ACCEPTED" && r.status !== "accepted") return false;
    if (activeTab === "IN_PROGRESS" && r.status !== "in_progress") return false;
    if (activeTab === "AWAITING" && r.status !== "awaiting_parts") return false;
    if (
      activeTab === "COMPLETED" &&
      r.status !== "resolved" &&
      r.status !== "verified" &&
      r.status !== "closed"
    ) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchLoc = r.location.toLowerCase().includes(q);
      const matchIssue = r.issueType.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      return matchId || matchLoc || matchIssue || matchCat;
    }

    return true;
  });

  const tabCounts = {
    ALL: myWork.length,
    NEW: myWork.filter((r) => r.status === "assigned").length,
    ACCEPTED: myWork.filter((r) => r.status === "accepted").length,
    IN_PROGRESS: myWork.filter((r) => r.status === "in_progress").length,
    AWAITING: myWork.filter((r) => r.status === "awaiting_parts").length,
    COMPLETED: myWork.filter(
      (r) => r.status === "resolved" || r.status === "verified" || r.status === "closed",
    ).length,
  };

  const tabs: Array<{ key: WorkFilterTab; label: string }> = [
    { key: "ALL", label: "All" },
    { key: "NEW", label: "New" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "AWAITING", label: "Awaiting" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const formatShortTime = (isoString?: string) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <div className="min-h-screen bg-[#061325] pb-24 text-white">
      <StaffHeader />

      <main className="mx-auto max-w-lg px-4 pt-4">
        <div className="flex items-center justify-between pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">My Work Queue</h2>
            <p className="text-xs text-white/60">
              Jobs assigned to {staff.name} {staff.surname}
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-[#10A080]">
            {filtered.length} {filtered.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by ref, unit, or issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0A1F3D] py-2.5 pl-9 pr-3 text-xs text-white placeholder-white/40 focus:border-[#10A080] focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div
          className="mt-3 flex overflow-x-auto pb-1 scrollbar-none gap-1.5"
          aria-label="Work status filter"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-[#10A080] text-[#061325]"
                  : "bg-[#0A1F3D] text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  activeTab === tab.key ? "bg-black/20 text-[#061325]" : "bg-white/10 text-white/80"
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Job List */}
        <div className="mt-4 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((job) => {
              const priorityClass =
                job.operationalPriority === "emergency"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : job.operationalPriority === "high"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/40";

              const slaBadge =
                job.sla.slaStatus === "breached" ? (
                  <span className="flex items-center gap-1 rounded bg-rose-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-rose-200 border border-rose-500/50">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    SLA BREACHED
                  </span>
                ) : job.sla.slaStatus === "at_risk" ? (
                  <span className="flex items-center gap-1 rounded bg-amber-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-amber-200 border border-amber-500/50">
                    <Clock className="h-2.5 w-2.5" />
                    SLA AT RISK
                  </span>
                ) : (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-emerald-300">
                    SLA ON TRACK
                  </span>
                );

              return (
                <Link
                  key={job.id}
                  to="/staff/job/$jobId"
                  params={{ jobId: job.id }}
                  className="block rounded-2xl border border-white/10 bg-[#0A1F3D] p-4 shadow-sm hover:border-[#10A080]/50 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white/50">{job.id}</span>
                        {slaBadge}
                      </div>
                      <h3 className="mt-1 text-base font-bold text-white tracking-tight">
                        {job.issueType}
                      </h3>
                      <p className="text-xs text-[#10A080] font-medium">
                        {job.category} &bull; {job.area}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${priorityClass}`}
                    >
                      {job.operationalPriority}
                    </span>
                  </div>

                  {/* Location Banner */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-black/40 px-3 py-2 border border-white/5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#10A080]" />
                      <div>
                        <span className="text-sm font-black tracking-wide text-white">
                          {job.location}
                        </span>
                        <span className="ml-2 text-[10px] text-white/50">
                          Block {job.unit.charAt(0)} &bull; Floor {job.unit.charAt(1)} &bull; Unit{" "}
                          {job.unit} &bull; Room {job.room}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps & Status Footnote */}
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-white/50 font-mono">
                    <div className="flex items-center gap-3">
                      <span>Reported: {formatShortTime(job.timestamps.reported_at)}</span>
                      {job.timestamps.assigned_at && (
                        <span>Assigned: {formatShortTime(job.timestamps.assigned_at)}</span>
                      )}
                    </div>
                    <span className="font-sans font-bold capitalize text-white/70">
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0A1F3D]/50 p-8 text-center">
              <Wrench className="mx-auto h-8 w-8 text-white/30" />
              <p className="mt-2 text-sm font-semibold text-white">No jobs found</p>
              <p className="mt-1 text-xs text-white/50">
                {searchQuery
                  ? "No work orders matched your search query."
                  : "No tasks in this category."}
              </p>
            </div>
          )}
        </div>
      </main>

      <StaffBottomDock />
    </div>
  );
}
