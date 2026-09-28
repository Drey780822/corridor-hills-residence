import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { useAdminSession } from "@/lib/admin-session";
import { getExtendedRequests, getStaffMembers } from "@/lib/operations-service";
import type { ExtendedMaintenanceRequest, OperationalPriority } from "@/types/operations";
import {
  Search,
  Filter,
  Flame,
  Clock,
  ArrowRight,
  Zap,
  Droplets,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/admin/requests/")({
  component: AdminRequestsPage,
});

export function AdminRequestsPage() {
  const navigate = useNavigate();
  const { admin, isAuthenticated } = useAdminSession();
  const [requests, setRequests] = useState<ExtendedMaintenanceRequest[]>([]);
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [techFilter, setTechFilter] = useState("ALL");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const loadData = () => {
    setRequests(getExtendedRequests());
  };

  if (!isAuthenticated || !admin) {
    return null;
  }

  const staff = getStaffMembers();

  const getCategoryIcon = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "electrical":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "plumbing":
        return <Droplets className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Filter requests
  const filtered = requests.filter((r) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchLoc = r.location.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchStudent = r.reportedBy?.name?.toLowerCase().includes(q) || false;
      const matchTech = r.assignedStaffName?.toLowerCase().includes(q) || false;
      if (!matchId && !matchLoc && !matchDesc && !matchStudent && !matchTech) return false;
    }

    // Block
    if (blockFilter !== "ALL") {
      if (
        !r.location.toUpperCase().includes(`BLOCK ${blockFilter}`) &&
        !r.location.toUpperCase().includes(blockFilter)
      ) {
        return false;
      }
    }

    // Category
    if (categoryFilter !== "ALL") {
      if (r.category?.toLowerCase() !== categoryFilter.toLowerCase()) return false;
    }

    // Priority
    if (priorityFilter !== "ALL") {
      if (r.operationalPriority?.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    }

    // Status
    if (statusFilter !== "ALL") {
      if (statusFilter === "QUEUED") {
        if (!r.isQueued && !(r.status === "assigned" && r.queuePosition)) return false;
      } else if (statusFilter === "RESOLVED") {
        if (r.status !== "resolved" && r.status !== "closed" && r.status !== "verified")
          return false;
      } else if (r.status !== statusFilter.toLowerCase()) {
        return false;
      }
    }

    // Tech
    if (techFilter !== "ALL") {
      if (r.assignedStaffId !== techFilter) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearch("");
    setBlockFilter("ALL");
    setCategoryFilter("ALL");
    setPriorityFilter("ALL");
    setStatusFilter("ALL");
    setTechFilter("ALL");
  };

  return (
    <AdminLayout activeNav="requests">
      <div className="space-y-5">
        {/* Page Title & Count */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-[#0A1F3D] tracking-tight">
              Maintenance Requests Manager
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive operational log of all reported issues across Corridor Hills Residence.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-500">Showing:</span>
            <span className="px-2.5 py-1 rounded-full bg-[#0050A0]/10 text-[#0050A0] font-bold">
              {filtered.length} of {requests.length} Requests
            </span>
          </div>
        </div>

        {/* Multi-Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <SlidersHorizontal className="w-4 h-4 text-[#0050A0]" />
              <span>Multi-Dimensional Filtering</span>
            </div>
            {(search ||
              blockFilter !== "ALL" ||
              categoryFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              statusFilter !== "ALL" ||
              techFilter !== "ALL") && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center space-x-1 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, room, description..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
              />
            </div>

            {/* Block Filter */}
            <div>
              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                aria-label="Filter by residence block"
                className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
              >
                <option value="ALL">All Blocks (A–F)</option>
                <option value="A">Block A</option>
                <option value="B">Block B</option>
                <option value="C">Block C</option>
                <option value="D">Block D</option>
                <option value="E">Block E</option>
                <option value="F">Block F</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by maintenance category"
                className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
              >
                <option value="ALL">All Categories</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority level"
                className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
              >
                <option value="ALL">All Priorities</option>
                <option value="emergency">Emergency</option>
                <option value="high">High Priority</option>
                <option value="standard">Standard Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="w-full py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0050A0]"
              >
                <option value="ALL">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="QUEUED">Queued in Backlog</option>
                <option value="awaiting_parts">Awaiting Parts</option>
                <option value="RESOLVED">Resolved / Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ticket / Priority</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Category & Issue</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">SLA State</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No maintenance requests match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => {
                    const isEmergency = req.operationalPriority === "emergency";
                    const isBreached = req.sla?.slaStatus === "breached";
                    const isAtRisk = req.sla?.slaStatus === "at_risk";
                    const isResolved =
                      req.status === "resolved" ||
                      req.status === "closed" ||
                      req.status === "verified";

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Ticket / Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className="font-mono font-bold text-slate-800">{req.id}</span>
                            {isEmergency ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse w-fit">
                                <Flame className="w-2.5 h-2.5 mr-0.5" /> EMERGENCY
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${
                                  req.operationalPriority === "high"
                                    ? "bg-amber-100 text-amber-800"
                                    : req.operationalPriority === "standard"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {req.operationalPriority}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Location */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{req.location}</div>
                          <div className="text-[11px] text-slate-400">
                            {req.reportedBy?.name || "Resident"}
                          </div>
                        </td>

                        {/* 3. Category & Issue */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                            {getCategoryIcon(req.category)}
                            <span className="capitalize">{req.category}</span>
                            <span className="text-slate-400">·</span>
                            <span className="truncate">{req.issueType}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {req.description}
                          </p>
                        </td>

                        {/* 4. Assigned Tech & Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {req.assignedStaffName || (
                              <span className="text-amber-700 italic">Backlog Queued</span>
                            )}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                req.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : req.status === "accepted"
                                    ? "bg-indigo-100 text-indigo-800"
                                    : isResolved
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                        </td>

                        {/* 5. SLA State */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isResolved ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <div>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isBreached
                                    ? "bg-rose-100 text-rose-800"
                                    : isAtRisk
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {isBreached ? "Breached" : isAtRisk ? "At Risk" : "On Track"}
                              </span>
                              {req.sla?.dueAt && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Due:{" "}
                                  {new Date(req.sla.dueAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 6. Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            to="/admin/requests/$requestId"
                            params={{ requestId: req.id }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0050A0] text-slate-700 hover:text-white font-semibold text-xs transition-colors"
                          >
                            <span>Audit & Reassign</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
