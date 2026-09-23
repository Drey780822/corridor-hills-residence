import { CheckCircle2, ChevronRight, Clock, User } from "lucide-react";
import type { MaintenanceRequest } from "../types/residence";
import { formatTimeAgo, getStatusBadge } from "../lib/status-utils";

interface RequestCardProps {
  request: MaintenanceRequest;
  onClick: () => void;
}

export function RequestCard({ request, onClick }: RequestCardProps) {
  const badge = getStatusBadge(request.status);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-teal-500/40 hover:shadow-md active:scale-[0.99]"
    >
      {/* Top row: Reference + Location + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">{request.id}</span>
          <span className="text-muted-foreground">•</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
            {request.location}
          </span>
        </div>

        <div
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${badge.colorClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
          <span>{badge.label}</span>
        </div>
      </div>

      {/* Main info: Issue title & category */}
      <div className="mt-3">
        <h3 className="text-base font-bold tracking-tight text-foreground group-hover:text-teal-600 transition-colors">
          {request.issueType}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {request.description}
        </p>
      </div>

      {/* Resolution callout banner if resolved */}
      {request.status === "resolved" && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Marked resolved by technician</span>
          </div>
          <span className="text-[11px] underline">Confirm fix &rarr;</span>
        </div>
      )}

      {/* Bottom row: Time, Tech Assignment & Arrow */}
      <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTimeAgo(request.timestamps.reported_at)}</span>
          </span>

          {request.assignedTechnician && (
            <span className="hidden items-center gap-1 sm:flex font-medium text-foreground">
              <User className="h-3 w-3 text-muted-foreground" />
              <span>{request.assignedTechnician.name}</span>
            </span>
          )}

          {request.attachments.length > 0 && (
            <span className="hidden sm:inline-block">{request.attachments.length} photo(s)</span>
          )}
        </div>

        <div className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
          <span>View Details</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
