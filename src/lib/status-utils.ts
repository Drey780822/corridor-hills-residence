import type { RequestStatus } from "../types/residence";

export function getStatusBadge(status: RequestStatus) {
  switch (status) {
    case "submitted":
      return {
        label: "Submitted",
        colorClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
        dotClass: "bg-blue-500",
      };
    case "triaged":
      return {
        label: "Triaged",
        colorClass: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
        dotClass: "bg-indigo-500",
      };
    case "assigned":
      return {
        label: "Assigned",
        colorClass: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
        dotClass: "bg-teal-500",
      };
    case "accepted":
      return {
        label: "Accepted",
        colorClass: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
        dotClass: "bg-cyan-500",
      };
    case "in_progress":
      return {
        label: "In Progress",
        colorClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        dotClass: "bg-amber-500 animate-pulse",
      };
    case "awaiting_parts":
      return {
        label: "Awaiting Parts",
        colorClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
        dotClass: "bg-orange-500",
      };
    case "resolved":
      return {
        label: "Resolved",
        colorClass:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        dotClass: "bg-emerald-500",
      };
    case "verified":
      return {
        label: "Verified & Closed",
        colorClass: "bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30",
        dotClass: "bg-green-600",
      };
    case "closed":
      return {
        label: "Closed",
        colorClass: "bg-muted text-muted-foreground border-border",
        dotClass: "bg-muted-foreground",
      };
    case "reopened":
      return {
        label: "Reopened",
        colorClass: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        dotClass: "bg-rose-500 animate-pulse",
      };
    default:
      return {
        label: status,
        colorClass: "bg-muted text-muted-foreground border-border",
        dotClass: "bg-muted-foreground",
      };
  }
}

export function formatTimeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
