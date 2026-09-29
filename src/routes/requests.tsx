import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { MobileDock } from "@/components/mobile-dock";
import { RequestCard } from "@/components/request-card";
import { RequestDetailDrawer } from "@/components/request-detail-drawer";
import { ResidentVerificationCard } from "@/components/resident-verification-card";
import { useResidentSession } from "@/lib/session";
import { getRequestsForResident, subscribeToRequestChanges } from "@/lib/maintenance-service";
import type { MaintenanceRequest } from "@/types/residence";
import {
  ArrowLeft,
  ClipboardList,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "My Requests — Corridor Hills Residence" },
      {
        name: "description",
        content: "Track maintenance requests for your Corridor Hills Residence unit.",
      },
      { property: "og:title", content: "My Requests — Corridor Hills Residence" },
      {
        property: "og:description",
        content: "Track maintenance requests for your Corridor Hills Residence unit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { session, isVerified } = useResidentSession();

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!session) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getRequestsForResident(session);
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (isVerified && session) {
      setLoading(true);
      fetchRequests();
    } else {
      setLoading(false);
    }

    const unsubscribe = subscribeToRequestChanges(() => {
      if (session) {
        fetchRequests();
      }
    });

    return () => unsubscribe();
  }, [isVerified, session, fetchRequests]);

  const activeRequests = requests.filter(
    (r) => r.status !== "verified" && r.status !== "closed" && r.status !== "resolved",
  );
  const resolvedRequests = requests.filter(
    (r) => r.status === "resolved" || r.status === "verified" || r.status === "closed",
  );

  const filteredRequests = requests.filter((r) => {
    // Tab filter
    if (activeTab === "active") {
      if (r.status === "verified" || r.status === "closed" || r.status === "resolved") {
        return false;
      }
    } else if (activeTab === "resolved") {
      if (r.status !== "resolved" && r.status !== "verified" && r.status !== "closed") {
        return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchIssue = r.issueType.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchLoc = r.location.toLowerCase().includes(q);
      return matchId || matchIssue || matchCat || matchDesc || matchLoc;
    }

    return true;
  });

  return (
    <div className="dark student-portal-shell site-shell min-h-screen pb-28 bg-[#061325] text-slate-100 relative overflow-hidden">
      {/* Ambient background lighting matching Corridor Hills palette */}
      <div className="portal-bg-decor" aria-hidden="true">
        <div className="portal-bg-decor-top" />
        <div className="portal-bg-decor-orb-1" />
        <div className="portal-bg-decor-orb-2" />
      </div>

      <SiteHeader />

      <main className="section-wrap pt-28 sm:pt-32 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Residence Home</span>
          </Link>

          {isVerified && (
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#10A080] px-4 py-2 text-xs font-bold text-[#061325] shadow-lg shadow-teal-900/30 hover:bg-[#12b38f] active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Report Issue</span>
            </Link>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#10A080]">
              Residence Maintenance • Live Tracking
            </p>
            {isVerified && session && (
              <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-300">
                Unit {session.location}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            My Requests
          </h1>
          <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed sm:text-base">
            Track live progress, technician assignments, and confirm resolutions for maintenance
            reports at Corridor Hills.
          </p>
        </div>

        {/* NOT VERIFIED STATE */}
        {!isVerified || !session ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0B1E38]/70 backdrop-blur-sm p-5 text-sm text-slate-300">
              <div className="flex items-center gap-2 font-bold text-white">
                <ClipboardList className="h-4 w-4 text-teal-400" />
                <span>Verification Required to Access Requests</span>
              </div>
              <p className="mt-1 leading-relaxed">
                To protect resident privacy, maintenance requests are only visible to verified
                residents of the unit. Please verify your unit and student number below.
              </p>
            </div>

            <ResidentVerificationCard inline />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Tabs */}
              <div className="flex rounded-xl bg-[#0B1E38]/90 p-1 border border-white/10 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "all"
                      ? "bg-[#10A080] text-[#061325] shadow-sm font-extrabold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>All</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      activeTab === "all"
                        ? "bg-[#061325]/20 text-[#061325]"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {requests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "active"
                      ? "bg-[#10A080] text-[#061325] shadow-sm font-extrabold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>Active</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      activeTab === "active"
                        ? "bg-[#061325]/20 text-[#061325]"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {activeRequests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("resolved")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "resolved"
                      ? "bg-[#10A080] text-[#061325] shadow-sm font-extrabold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>Resolved</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      activeTab === "resolved"
                        ? "bg-[#061325]/20 text-[#061325]"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {resolvedRequests.length}
                  </span>
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reference or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-[#0B1E38]/90 pl-9 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400/30 backdrop-blur-md"
                />
              </div>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                <p className="mt-3 text-xs font-semibold text-slate-300">
                  Loading your maintenance requests...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0B1E38]/40 p-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <ClipboardList className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  {searchQuery ? "No matching requests found" : "No requests in this category"}
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-300 leading-relaxed">
                  {searchQuery
                    ? "Try adjusting your search terms or filter selection."
                    : "When you or your unit report an issue, it will appear here with live tracking updates."}
                </p>
                <div className="mt-5">
                  <Link
                    to="/report"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#10A080] px-5 text-xs font-bold text-[#061325] shadow-lg shadow-teal-900/30 hover:bg-[#12b38f] active:scale-95 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Report a maintenance issue</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onClick={() => setSelectedRequest(request)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Request Detail Drawer */}
        {selectedRequest && session && (
          <RequestDetailDrawer
            request={selectedRequest}
            session={session}
            onClose={() => setSelectedRequest(null)}
            onRequestUpdated={(updated) => {
              setSelectedRequest(updated);
              setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            }}
          />
        )}
      </main>

      <MobileDock />
    </div>
  );
}
