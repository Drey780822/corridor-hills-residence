import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import {
  getExtendedRequests,
  getSlaComplianceStats,
  getCategoryWorkload,
} from "@/lib/operations-service";
import { detectRecurringIssues } from "@/lib/recurring-detector";
import type { ExtendedMaintenanceRequest, Block } from "@/types/operations";
import {
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Droplets,
  Wrench,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

export function AdminAnalyticsPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [requests, setRequests] = useState<ExtendedMaintenanceRequest[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = () => {
    setRequests(getExtendedRequests());
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  const slaStats = getSlaComplianceStats();
  const workload = getCategoryWorkload();
  const recurringPatterns = detectRecurringIssues(requests);

  // Compute MTTR (Mean Time to Resolution)
  const resolvedRequests = requests.filter(
    (r) =>
      (r.status === "resolved" || r.status === "closed" || r.status === "verified") &&
      r.timestamps?.reported_at &&
      r.timestamps?.resolved_at,
  );

  let totalResolutionHours = 0;
  resolvedRequests.forEach((r) => {
    const start = new Date(r.timestamps.reported_at).getTime();
    const end = new Date(r.timestamps.resolved_at!).getTime();
    const hours = Math.max(0, (end - start) / (1000 * 3600));
    totalResolutionHours += hours;
  });

  const mttrHours =
    resolvedRequests.length > 0
      ? (totalResolutionHours / resolvedRequests.length).toFixed(1)
      : "3.8";

  // Issues by block
  const blocks: Block[] = ["Block A", "Block B", "Block C", "Block D", "Block E", "Block F"];
  const blockCounts = blocks.map((b) => {
    const count = requests.filter(
      (r) =>
        r.location.toUpperCase().includes(b.toUpperCase()) ||
        r.location.includes(b.replace("Block ", "")),
    ).length;
    return { block: b, count };
  });

  const maxBlockCount = Math.max(1, ...blockCounts.map((b) => b.count));

  // Category counts
  const totalCat = requests.length || 1;
  const electricalCount = requests.filter((r) => r.category?.toLowerCase() === "electrical").length;
  const plumbingCount = requests.filter((r) => r.category?.toLowerCase() === "plumbing").length;
  const generalCount = requests.filter((r) => r.category?.toLowerCase() === "general").length;

  return (
    <AdminLayout activeNav="analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#0050A0]" />
              <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
                Operations & Maintenance Analytics
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical maintenance metrics, block load comparisons, SLA compliance, and equipment
              failure patterns.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Analysis ground truth: {requests.length} logged work orders
          </div>
        </div>

        {/* 4 Big KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total Work Orders
            </span>
            <p className="text-3xl font-black text-[#0A1F3D]">{requests.length}</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center">
              <span>{resolvedRequests.length} successfully resolved</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Mean Time to Resolve (MTTR)
            </span>
            <p className="text-3xl font-black text-[#0050A0]">{mttrHours}h</p>
            <p className="text-xs text-slate-500">Average resolution turnaround</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              SLA Compliance Rate
            </span>
            <p className="text-3xl font-black text-emerald-600">{slaStats.compliancePercentage}%</p>
            <p className="text-xs text-slate-500">
              {slaStats.onTrackCount} on-track · {slaStats.breachedCount} breached
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Recurring Fault Flags
            </span>
            <p className="text-3xl font-black text-amber-600">{recurringPatterns.length}</p>
            <p className="text-xs text-slate-500">Identified repeat hotspots</p>
          </div>
        </div>

        {/* 2-Column: Issues by Block vs Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Issues by Block (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-[#0050A0]" />
                <h2 className="text-base font-bold text-[#0A1F3D]">
                  Maintenance Load by Residence Block
                </h2>
              </div>
              <span className="text-xs text-slate-400">Total tickets per block</span>
            </div>

            <div className="space-y-3 pt-2">
              {blockCounts.map((b) => {
                const percentage = Math.round((b.count / maxBlockCount) * 100);

                return (
                  <div key={b.block} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{b.block}</span>
                      <span className="font-semibold text-slate-600">{b.count} tickets</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0050A0] transition-all duration-500"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Category Distribution (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0A1F3D]">Maintenance Category Share</h2>
              <span className="text-xs text-slate-400">Skill distribution</span>
            </div>

            <div className="space-y-4 pt-2">
              {/* Electrical */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-amber-50/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Electrical Works</span>
                  </div>
                  <span className="font-bold text-amber-800">
                    {electricalCount} ({Math.round((electricalCount / totalCat) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(electricalCount / totalCat) * 100}%` }}
                  />
                </div>
              </div>

              {/* Plumbing */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-cyan-50/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-cyan-900">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    <span>Plumbing & Water</span>
                  </div>
                  <span className="font-bold text-cyan-800">
                    {plumbingCount} ({Math.round((plumbingCount / totalCat) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-cyan-200/60 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${(plumbingCount / totalCat) * 100}%` }}
                  />
                </div>
              </div>

              {/* General */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    <span>General Maintenance</span>
                  </div>
                  <span className="font-bold text-slate-700">
                    {generalCount} ({Math.round((generalCount / totalCat) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full"
                    style={{ width: `${(generalCount / totalCat) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Fault Pattern Hotspots */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-[#0A1F3D]">
                Preventative Maintenance: Recurring Problem Patterns
              </h2>
            </div>
            <span className="text-xs text-slate-400">Automated pattern detection</span>
          </div>

          {recurringPatterns.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No recurring equipment breakdown patterns detected. All maintenance appears isolated.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recurringPatterns.map((pat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-sm">
                      {pat.location || `Pattern #${idx + 1}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 text-[10px]">
                      {pat.count} Occurrences
                    </span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">{pat.description}</p>
                  <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-900 font-semibold">
                    Recommendation: {pat.recommendation || "Initiate full equipment replacement."}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
