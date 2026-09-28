import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, MapPin, Play, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { StaffBottomDock, StaffHeader } from "../../components/staff/staff-nav";
import { getExtendedRequests } from "../../lib/operations-service";
import { useStaffSession } from "../../lib/staff-session";
import type { ExtendedMaintenanceRequest } from "../../types/operations";

export const Route = createFileRoute("/staff/")({
  component: StaffHomePage,
});

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const startTime = new Date(startedAt).getTime();
      const diffMs = Math.max(0, Date.now() - startTime);
      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setElapsed(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return <span>{elapsed}</span>;
}

function StaffHomePage() {
  const { staff, isAuthenticated } = useStaffSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/staff/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!staff) return null;

  const allRequests = getExtendedRequests();

  // Filter requests assigned to this staff member
  const myRequests = allRequests.filter(
    (r) => r.assignedStaffId === staff.id || r.assignedTechnician?.name.includes(staff.name),
  );

  // Active in-progress job
  const currentJob = myRequests.find((r) => r.status === "in_progress");

  // Next up: assigned or accepted jobs
  const upNextJobs = myRequests.filter(
    (r) => (r.status === "assigned" || r.status === "accepted") && r.id !== currentJob?.id,
  );

  // Today stats
  const assignedCount = myRequests.filter(
    (r) => r.status !== "closed" && r.status !== "verified",
  ).length;
  const inProgressCount = currentJob ? 1 : 0;
  const completedTodayCount = staff.completedTodayCount;

  // Emergency or High priority alert
  const urgentJob = myRequests.find(
    (r) =>
      r.operationalPriority === "emergency" && r.status !== "resolved" && r.status !== "verified",
  );

  return (
    <div className="min-h-screen bg-[#061325] pb-24 text-white">
      <StaffHeader />

      <main className="mx-auto max-w-lg px-4 pt-4">
        {/* Greeting Banner */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0A1F3D] to-[#061325] p-5 shadow-lg">
          <p className="text-[11px] font-mono uppercase tracking-widest text-[#10A080]">
            Operational Workstation
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
            Good morning, {staff.name}.
          </h2>
          <p className="text-xs text-white/70">
            {staff.roleTitle} &bull; Shift {staff.shiftHours}
          </p>
        </div>

        {/* Emergency Alert Banner */}
        {urgentJob && (
          <div className="mt-4 rounded-xl border border-rose-500/50 bg-rose-500/20 p-4 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertCircle className="h-5 w-5" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Emergency Priority Dispatched
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white">
              {urgentJob.category} &bull; {urgentJob.issueType} at {urgentJob.location}
            </p>
            <Link
              to="/staff/job/$jobId"
              params={{ jobId: urgentJob.id }}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-500 transition-colors"
            >
              <span>Respond Immediately</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* CURRENT JOB SECTION */}
        <section className="mt-6" aria-labelledby="current-job-heading">
          <div className="flex items-center justify-between pb-2">
            <h3
              id="current-job-heading"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#10A080]"
            >
              Current Job
            </h3>
            {currentJob && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                In Progress
              </span>
            )}
          </div>

          {currentJob ? (
            <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0A1F3D] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-white/50">{currentJob.id}</span>
                  <h4 className="mt-0.5 text-lg font-extrabold text-white tracking-tight">
                    {currentJob.issueType}
                  </h4>
                  <p className="text-xs text-[#10A080] font-medium">{currentJob.category}</p>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-1.5 text-right border border-white/10">
                  <span className="block text-[9px] font-mono uppercase text-white/40">
                    Elapsed
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-300">
                    <LiveTimer
                      startedAt={
                        currentJob.timestamps.started_at || currentJob.timestamps.reported_at
                      }
                    />
                  </span>
                </div>
              </div>

              {/* Location Highlight */}
              <div className="mt-4 rounded-xl bg-black/30 p-3 border border-white/5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#10A080] shrink-0" />
                  <div>
                    <p className="text-sm font-black tracking-wide text-white">
                      {currentJob.location}
                    </p>
                    <p className="text-[11px] text-white/60">
                      Block {currentJob.unit.charAt(0)} &bull; Floor {currentJob.unit.charAt(1)}{" "}
                      &bull; Unit {currentJob.unit} &bull; Room {currentJob.room}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-xs text-white/70">{currentJob.description}</p>

              {/* Primary CTA */}
              <div className="mt-5">
                <Link
                  to="/staff/job/$jobId"
                  params={{ jobId: currentJob.id }}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#10A080] px-4 py-3 text-sm font-bold text-[#061325] shadow-lg hover:bg-[#10A080]/90 active:scale-[0.98] transition-all"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>CONTINUE JOB</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0A1F3D]/60 p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/40">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-semibold text-white">No active job in progress</p>
              <p className="mt-0.5 text-[11px] text-white/50">
                Choose an assigned task below to start your next job.
              </p>
            </div>
          )}
        </section>

        {/* UP NEXT SECTION */}
        <section className="mt-7" aria-labelledby="up-next-heading">
          <div className="flex items-center justify-between pb-2">
            <h3
              id="up-next-heading"
              className="text-xs font-mono font-bold uppercase tracking-wider text-white/60"
            >
              Up Next ({upNextJobs.length})
            </h3>
            <Link
              to="/staff/work"
              className="text-[11px] font-medium text-[#10A080] hover:underline"
            >
              View all
            </Link>
          </div>

          {upNextJobs.length > 0 ? (
            <div className="space-y-3">
              {upNextJobs.slice(0, 3).map((job) => (
                <Link
                  key={job.id}
                  to="/staff/job/$jobId"
                  params={{ jobId: job.id }}
                  className="block rounded-xl border border-white/10 bg-[#0A1F3D] p-4 shadow-sm hover:border-white/20 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-white/40">{job.id}</span>
                      <h4 className="text-sm font-bold text-white">{job.issueType}</h4>
                      <p className="text-[11px] text-white/60">
                        {job.category} &bull; {job.area}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                        job.operationalPriority === "emergency"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : job.operationalPriority === "high"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                      }`}
                    >
                      {job.operationalPriority}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                    <span className="font-mono font-bold text-[#10A080]">{job.location}</span>
                    <span className="flex items-center gap-1 text-[11px] text-white/50">
                      <Clock className="h-3 w-3" />
                      <span>Due in {job.sla.targetHours}h</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[#0A1F3D]/30 p-4 text-center text-xs text-white/40">
              No queued tasks waiting. You're up to date!
            </div>
          )}
        </section>

        {/* MY WORK TODAY SECTION */}
        <section className="mt-7" aria-labelledby="work-today-heading">
          <h3
            id="work-today-heading"
            className="pb-2 text-xs font-mono font-bold uppercase tracking-wider text-white/60"
          >
            My Work Today
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-[#0A1F3D] p-3 text-center">
              <span className="block text-2xl font-black text-white">{assignedCount}</span>
              <span className="mt-0.5 block text-[10px] font-mono uppercase text-white/50">
                Assigned
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0A1F3D] p-3 text-center">
              <span className="block text-2xl font-black text-[#10A080]">{inProgressCount}</span>
              <span className="mt-0.5 block text-[10px] font-mono uppercase text-white/50">
                In Progress
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0A1F3D] p-3 text-center">
              <span className="block text-2xl font-black text-emerald-400">
                {completedTodayCount}
              </span>
              <span className="mt-0.5 block text-[10px] font-mono uppercase text-white/50">
                Completed
              </span>
            </div>
          </div>
        </section>
      </main>

      <StaffBottomDock />
    </div>
  );
}
