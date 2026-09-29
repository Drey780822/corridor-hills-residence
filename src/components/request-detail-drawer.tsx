import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileImage,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { MaintenanceRequest, ResidentSession, StatusTimelineEvent } from "../types/residence";
import { confirmResolution, reopenRequest } from "../lib/maintenance-service";
import { getStatusBadge } from "../lib/status-utils";
import { toast } from "sonner";

interface RequestDetailDrawerProps {
  request: MaintenanceRequest | null;
  session: ResidentSession;
  onClose: () => void;
  onRequestUpdated: (updated: MaintenanceRequest) => void;
}

function formatEventTime(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatEventDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function RequestDetailDrawer({
  request,
  session,
  onClose,
  onRequestUpdated,
}: RequestDetailDrawerProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [showReopenInput, setShowReopenInput] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  if (!request) return null;

  const badge = getStatusBadge(request.status);

  const handleConfirmFixed = async () => {
    setIsConfirming(true);
    try {
      const updated = await confirmResolution(request.id, session);
      onRequestUpdated(updated);
      toast.success("Thank you! You've confirmed that this issue is resolved.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm resolution. Try again.";
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      toast.error("Please explain what still needs attention.");
      return;
    }

    setIsReopening(true);
    try {
      const updated = await reopenRequest(request.id, reopenReason, session);
      onRequestUpdated(updated);
      setShowReopenInput(false);
      setReopenReason("");
      toast.info("Request reopened. Our maintenance team will follow up.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reopen request. Try again.";
      toast.error(message);
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className="dark relative z-10 flex max-h-[92svh] w-full max-w-xl flex-col rounded-t-3xl border border-white/15 bg-[#0B1E38] text-slate-100 shadow-2xl sm:rounded-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
      >
        {/* Drag Handle on Mobile */}
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-[#10A080]">{request.id}</span>
              <span className="text-slate-400">•</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold text-white border border-white/15">
                {request.location}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
              {request.issueType}
            </h2>
            <p className="text-xs font-medium text-slate-300">
              Area: {request.area} • Category: {request.category}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white active:scale-95 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* Automation Awareness / Assigned State Card */}
          <div className="rounded-xl border border-white/10 bg-[#061426]/70 p-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Wrench className="h-4 w-4 text-[#10A080]" />
                <span>Maintenance Status</span>
              </div>
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.colorClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                <span>{badge.label}</span>
              </div>
            </div>

            <div className="mt-3">
              {request.status === "submitted" && (
                <p className="text-slate-300">
                  Finding a maintenance team member... Your report has been logged with the
                  residence desk.
                </p>
              )}

              {request.status === "assigned" && request.assignedTechnician && (
                <p className="text-white font-medium">
                  Assigned to <strong>{request.assignedTechnician.name}</strong> (
                  {request.assignedTechnician.specialty}).
                  {request.assignedTechnician.isQueued && (
                    <span className="text-amber-400 block mt-1">
                      Technician is queued (currently attending an urgent residence issue).
                    </span>
                  )}
                </p>
              )}

              {request.status === "in_progress" && (
                <p className="text-amber-300 font-medium">
                  Your issue is currently being worked on by{" "}
                  <strong>{request.assignedTechnician?.name || "maintenance"}</strong>.
                </p>
              )}

              {request.status === "resolved" && (
                <p className="text-emerald-300 font-medium">
                  Maintenance has marked the issue as resolved. Please test and confirm whether it
                  is fixed.
                </p>
              )}

              {request.status === "verified" && (
                <p className="text-green-300 font-medium">
                  Resolution verified by resident. Request closed.
                </p>
              )}

              {request.status === "reopened" && (
                <p className="text-rose-300 font-medium">
                  Issue reopened by resident: &ldquo;{request.reopenReason}&rdquo;. Routed back to
                  maintenance supervisor.
                </p>
              )}
            </div>

            {/* Time Tracking Section */}
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-[11px] text-slate-400">
              {request.timestamps.reported_at && (
                <div>
                  Reported:{" "}
                  <strong className="text-white">
                    {formatEventTime(request.timestamps.reported_at)}
                  </strong>
                </div>
              )}
              {request.timestamps.started_at && (
                <div>
                  Started:{" "}
                  <strong className="text-white">
                    {formatEventTime(request.timestamps.started_at)}
                  </strong>
                </div>
              )}
              {request.timestamps.resolved_at && (
                <div>
                  Resolved:{" "}
                  <strong className="text-white">
                    {formatEventTime(request.timestamps.resolved_at)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Description & Evidence */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Report Description
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-200 bg-[#061426] rounded-xl p-3.5 border border-white/10 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>

          {/* Photos */}
          {request.attachments.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Photo Evidence ({request.attachments.length})
              </h3>
              <div className="mt-2 flex gap-2 overflow-x-auto py-1">
                {request.attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => setSelectedPhotoUrl(att.url)}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESOLUTION CONFIRM / REOPEN FLOW */}
          {request.status === "resolved" && (
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Resolution Verification
              </div>
              <h3 className="mt-1 text-base font-bold text-foreground">Is this issue fixed?</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Our technician indicated that the maintenance work is complete. Please inspect your
                space and let us know.
              </p>

              {!showReopenInput ? (
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleConfirmFixed}
                    disabled={isConfirming}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                  >
                    {isConfirming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Yes, it&apos;s fixed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReopenInput(true)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 active:scale-95 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>No, still broken</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReopenSubmit} className="mt-4 space-y-3">
                  <label htmlFor="reopen-reason" className="block text-xs font-bold text-white">
                    What still needs attention?
                  </label>
                  <textarea
                    id="reopen-reason"
                    rows={3}
                    placeholder="e.g. The tap still drips when closed, or the light switch is still stiff..."
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-white/20 bg-[#061426] p-3 text-xs text-white placeholder:text-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isReopening || !reopenReason.trim()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700 active:scale-95 disabled:opacity-60"
                    >
                      {isReopening ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      <span>Submit Reopen Request</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReopenInput(false)}
                      className="text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VISUAL STATUS TIMELINE */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Status Timeline
            </h3>

            <div className="relative mt-4 space-y-6 pl-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-white/10">
              {request.history.map((event, idx) => {
                const isLatest = idx === request.history.length - 1;
                return (
                  <div key={event.id} className="relative">
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-6 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-[#0B1E38] ${
                        isLatest
                          ? "border-teal-400 text-teal-300 ring-4 ring-teal-500/20"
                          : "border-white/20 text-slate-400"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isLatest ? "bg-teal-400" : "bg-white/30"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white">{event.title}</h4>
                        <span className="text-[10px] text-slate-400">
                          {formatEventDate(event.timestamp)}, {formatEventTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        {event.description}
                      </p>
                      {event.actor && (
                        <span className="mt-1 inline-block text-[10px] font-medium text-teal-400">
                          By: {event.actor}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Photo Viewer */}
        {selectedPhotoUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedPhotoUrl(null)}
          >
            <div className="relative max-w-lg">
              <img
                src={selectedPhotoUrl}
                alt="Evidence"
                className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setSelectedPhotoUrl(null)}
                className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
