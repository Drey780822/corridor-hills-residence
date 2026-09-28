import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Pause,
  Play,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

import { StaffBottomDock, StaffHeader } from "../../components/staff/staff-nav";
import {
  acceptJob,
  addTechnicianNote,
  addWorkEvidence,
  getExtendedRequests,
  pauseWork,
  rejectJob,
  resolveJob,
  resumeWork,
  startWork,
} from "../../lib/operations-service";
import { queueStaffAction } from "../../lib/staff-offline-queue";
import { useStaffSession } from "../../lib/staff-session";
import type { ExtendedMaintenanceRequest, WorkEvidence } from "../../types/operations";

export const Route = createFileRoute("/staff/job/$jobId")({
  component: StaffJobDetailPage,
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

  return <span className="font-mono">{elapsed}</span>;
}

function StaffJobDetailPage() {
  const { jobId } = Route.useParams();
  const { staff, isAuthenticated } = useStaffSession();
  const navigate = useNavigate();

  const [job, setJob] = useState<ExtendedMaintenanceRequest | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState<
    "awaiting_parts" | "awaiting_access" | "needs_specialist" | "cannot_reproduce" | "other"
  >("awaiting_parts");
  const [pauseNote, setPauseNote] = useState("");
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [evidenceType, setEvidenceType] = useState<"before" | "during" | "after">("during");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshJob = useCallback(() => {
    const all = getExtendedRequests();
    const found = all.find((r) => r.id === jobId);
    setJob(found || null);
  }, [jobId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/staff/login" });
      return;
    }
    refreshJob();
  }, [isAuthenticated, refreshJob, navigate]);

  if (!staff || !job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#061325] text-white">
        <div className="text-center p-6">
          <p className="text-sm font-semibold">Job reference not found</p>
          <Link
            to="/staff/work"
            className="mt-3 inline-block rounded-lg bg-[#0050A0] px-4 py-2 text-xs font-bold"
          >
            Back to My Work
          </Link>
        </div>
      </div>
    );
  }

  // --- ACTIONS ---
  const handleAccept = () => {
    if (!navigator.onLine) {
      queueStaffAction({
        idempotencyKey: `accept-${job.id}-${Date.now()}`,
        staffId: staff.id,
        requestId: job.id,
        action: "accept",
        payload: {},
      });
    }
    acceptJob(job.id, staff.id);
    refreshJob();
  };

  const handleStart = () => {
    if (!navigator.onLine) {
      queueStaffAction({
        idempotencyKey: `start-${job.id}-${Date.now()}`,
        staffId: staff.id,
        requestId: job.id,
        action: "start",
        payload: {},
      });
    }
    startWork(job.id, staff.id);
    refreshJob();
  };

  const handlePause = () => {
    if (!pauseNote.trim()) {
      setErrorMessage("Please provide details for pausing this job.");
      return;
    }
    if (!navigator.onLine) {
      queueStaffAction({
        idempotencyKey: `pause-${job.id}-${Date.now()}`,
        staffId: staff.id,
        requestId: job.id,
        action: "pause",
        payload: { reason: pauseReason, note: pauseNote },
      });
    }
    pauseWork(job.id, staff.id, pauseReason, pauseNote);
    setPauseModalOpen(false);
    setPauseNote("");
    refreshJob();
  };

  const handleResume = () => {
    resumeWork(job.id, staff.id);
    refreshJob();
  };

  const handleResolve = () => {
    if (!resolutionSummary.trim()) {
      setErrorMessage("A brief resolution description is required.");
      return;
    }
    if (!navigator.onLine) {
      queueStaffAction({
        idempotencyKey: `resolve-${job.id}-${Date.now()}`,
        staffId: staff.id,
        requestId: job.id,
        action: "resolve",
        payload: { summary: resolutionSummary },
      });
    }
    resolveJob(job.id, staff.id, resolutionSummary);
    setResolveModalOpen(false);
    refreshJob();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setErrorMessage("A valid reason is required to decline this work order.");
      return;
    }
    rejectJob(job.id, staff.id, rejectionReason);
    setRejectModalOpen(false);
    navigate({ to: "/staff" });
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    if (!navigator.onLine) {
      queueStaffAction({
        idempotencyKey: `note-${job.id}-${Date.now()}`,
        staffId: staff.id,
        requestId: job.id,
        action: "note",
        payload: { noteText: newNoteText },
      });
    }
    addTechnicianNote(job.id, staff.id, newNoteText);
    setNoteModalOpen(false);
    setNewNoteText("");
    refreshJob();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEvidence(true);
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const dataUrl = uploadEvt.target?.result as string;
      addWorkEvidence(job.id, staff.id, evidenceType, file.name, dataUrl || "/images/A.jpg");
      setUploadingEvidence(false);
      refreshJob();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#061325] pb-28 text-white">
      <StaffHeader />

      <main className="mx-auto max-w-lg px-4 pt-3">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3">
          <Link
            to="/staff/work"
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Work Queue</span>
          </Link>
          <span className="font-mono text-xs font-bold text-white/40">{job.id}</span>
        </div>

        {/* LOCATION HERO BANNER (Technician Primary Requirement) */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0050A0]/40 via-[#0A1F3D] to-[#0A1F3D] p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0050A0] text-[#10A080] shadow-md border border-white/20">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#10A080]">
                  Room Destination
                </span>
                <h2 className="text-2xl font-black tracking-tight text-white">{job.location}</h2>
                <p className="text-xs text-white/80 font-medium">
                  Block {job.unit.charAt(0)} &bull; Floor {job.unit.charAt(1)} &bull; Unit{" "}
                  {job.unit} &bull; Room {job.room}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-mono font-bold uppercase text-white border border-white/15">
                {job.operationalPriority}
              </span>
              <span className="mt-1 block text-[10px] font-mono text-white/50">{job.area}</span>
            </div>
          </div>

          {/* Active Timer Pill if in progress */}
          {job.status === "in_progress" && job.timestamps.started_at && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Work in Progress</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5" />
                <LiveTimer startedAt={job.timestamps.started_at} />
              </div>
            </div>
          )}
        </div>

        {/* ISSUE SUMMARY */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-[#0A1F3D] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#10A080]">
              {job.category}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/60 capitalize">
              Status: {job.status.replace("_", " ")}
            </span>
          </div>

          <h3 className="mt-1 text-lg font-bold text-white tracking-tight">{job.issueType}</h3>
          <p className="mt-2 text-xs leading-relaxed text-white/80 bg-black/20 p-3 rounded-xl border border-white/5">
            "{job.description}"
          </p>

          {/* Student Uploaded Evidence */}
          {job.attachments && job.attachments.length > 0 && (
            <div className="mt-4 border-t border-white/5 pt-3">
              <p className="text-[11px] font-mono uppercase text-white/50 mb-2">
                Student Photo Evidence
              </p>
              <div className="grid grid-cols-2 gap-2">
                {job.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-black/40"
                  >
                    <img
                      src={att.url || "/images/A.jpg"}
                      alt="Student evidence"
                      className="h-28 w-full object-cover"
                    />
                    <p className="p-1.5 text-[10px] text-white/50 truncate">{att.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* PRIMARY ACTION STATE MACHINE */}
        <section className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-b from-[#0A1F3D] to-[#061325] p-5 shadow-lg">
          <p className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-3">
            Operational Action
          </p>

          {job.status === "assigned" && (
            <div className="space-y-3">
              <button
                onClick={handleAccept}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#10A080] px-4 py-3 text-sm font-bold text-[#061325] shadow-lg hover:bg-[#10A080]/90 active:scale-[0.98] transition-all"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>ACCEPT WORK ORDER</span>
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 border border-white/10 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>Cannot Take Job (Decline)</span>
              </button>
            </div>
          )}

          {job.status === "accepted" && (
            <div className="space-y-3">
              <button
                onClick={handleStart}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0050A0] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#0050A0]/90 active:scale-[0.98] transition-all"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>START WORK (ARRIVED ON-SITE)</span>
              </button>
            </div>
          )}

          {job.status === "in_progress" && (
            <div className="space-y-2.5">
              <button
                onClick={() => setResolveModalOpen(true)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#10A080] px-4 py-3 text-sm font-bold text-[#061325] shadow-lg hover:bg-[#10A080]/90 active:scale-[0.98] transition-all"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>MARK RESOLVED</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setPauseModalOpen(true)}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-amber-300 border border-white/10 hover:bg-amber-500/10 transition-colors"
                >
                  <Pause className="h-4 w-4" />
                  <span>Pause Work</span>
                </button>
                <button
                  onClick={() => setNoteModalOpen(true)}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>
          )}

          {job.status === "awaiting_parts" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-500/15 p-3 text-xs text-amber-200 border border-amber-500/30">
                <p className="font-bold">Job Paused: {job.pauseReason?.replace("_", " ")}</p>
                <p className="mt-0.5 text-white/70">{job.pauseNote}</p>
              </div>
              <button
                onClick={handleResume}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#10A080] px-4 py-3 text-sm font-bold text-[#061325] shadow-lg hover:bg-[#10A080]/90 transition-all"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>RESUME WORK</span>
              </button>
            </div>
          )}

          {(job.status === "resolved" || job.status === "verified") && (
            <div className="rounded-xl bg-emerald-500/20 p-4 text-center border border-emerald-500/40">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
              <p className="mt-1 text-sm font-bold text-white">Maintenance Resolved</p>
              <p className="text-xs text-white/70 mt-1">
                Summary: "{job.resolutionSummary || "Completed repair"}"
              </p>
            </div>
          )}
        </section>

        {/* WORK EVIDENCE & PHOTOS */}
        <section className="mt-5 rounded-2xl border border-white/10 bg-[#0A1F3D] p-5">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white/60">
              Technician Evidence ({job.workEvidence?.length || 0})
            </h3>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-lg bg-[#0050A0]/40 px-3 py-1 text-xs font-bold text-[#10A080] hover:bg-[#0050A0]/60 border border-white/10 transition-colors">
              <Camera className="h-4 w-4" />
              <span>Capture Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Evidence selector */}
          <div className="flex gap-2 text-xs mb-3">
            {(["before", "during", "after"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setEvidenceType(t)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono uppercase transition-colors ${
                  evidenceType === t
                    ? "bg-[#10A080] text-[#061325] font-bold"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {job.workEvidence && job.workEvidence.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {job.workEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40"
                >
                  <img src={ev.url} alt={ev.name} className="h-28 w-full object-cover" />
                  <div className="p-2">
                    <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] font-mono uppercase text-white/80">
                      {ev.type}
                    </span>
                    <p className="mt-1 text-[10px] text-white/50 truncate">{ev.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-xs text-white/40">
              No technician evidence photos uploaded yet.
            </div>
          )}
        </section>

        {/* TIMELINE */}
        <section className="mt-5 rounded-2xl border border-white/10 bg-[#0A1F3D] p-5">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white/60 pb-3">
            Status Event History
          </h3>
          <div className="space-y-4 border-l border-white/10 pl-4 ml-2">
            {job.history.map((h) => (
              <div key={h.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#10A080] ring-4 ring-[#0A1F3D]" />
                <p className="text-xs font-bold text-white">{h.title}</p>
                <p className="text-[11px] text-white/70">{h.description}</p>
                <p className="text-[10px] font-mono text-white/40 mt-0.5">
                  {new Date(h.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  &bull; {h.actor}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0A1F3D] p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Decline Work Order</h4>
            <p className="mt-1 text-xs text-white/60">
              Provide an authentic operational reason for declining. This is recorded in the
              dispatch audit.
            </p>

            <div className="mt-3 space-y-1.5 text-xs">
              {[
                "Incorrect skill required",
                "Emergency job elsewhere",
                "Outside working shift",
                "Equipment unavailable",
                "Other",
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectionReason(reason)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    rejectionReason === reason
                      ? "bg-[#10A080] text-[#061325] font-bold"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Additional details..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
              rows={2}
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 shadow-md"
              >
                Submit Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {pauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0A1F3D] p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Pause Maintenance</h4>
            <p className="mt-1 text-xs text-white/60">Select reason for pausing:</p>

            <div className="mt-3 space-y-1.5 text-xs">
              {(
                [
                  { key: "awaiting_parts", label: "Awaiting Parts / Stock" },
                  { key: "awaiting_access", label: "Awaiting Resident Room Access" },
                  { key: "needs_specialist", label: "Requires Specialist Contractor" },
                  { key: "cannot_reproduce", label: "Cannot Reproduce Fault" },
                  { key: "other", label: "Other" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setPauseReason(opt.key)}
                  className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    pauseReason === opt.key
                      ? "bg-[#10A080] text-[#061325] font-bold"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Describe parts needed or access situation..."
              value={pauseNote}
              onChange={(e) => setPauseNote(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
              rows={3}
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPauseModalOpen(false)}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePause}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-[#061325] shadow-md"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE MODAL */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0A1F3D] p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Mark Job as Resolved</h4>
            <p className="mt-1 text-xs text-white/60">
              Describe what action was taken to fix the issue. The resident will be asked to
              confirm.
            </p>

            <textarea
              placeholder="e.g. Replaced faulty spiral plate and tested circuit..."
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
              rows={3}
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 rounded-xl bg-[#10A080] py-2.5 text-xs font-bold text-[#061325] shadow-md"
              >
                Confirm Resolved
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NOTE MODAL */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#0A1F3D] p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white">Add Technician Note</h4>
            <textarea
              placeholder="Log diagnostic observations or steps taken..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 p-2.5 text-xs text-white placeholder-white/40 focus:outline-none"
              rows={3}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="flex-1 rounded-xl bg-white/10 py-2 text-xs font-semibold text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="flex-1 rounded-xl bg-[#0050A0] py-2 text-xs font-bold text-white"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      <StaffBottomDock />
    </div>
  );
}
