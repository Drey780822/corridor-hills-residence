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
    <div className="site-shell min-h-screen pb-28">
      <SiteHeader />

      <main className="section-wrap pt-28 sm:pt-32 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>

          {isVerified && (
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Report Issue</span>
            </Link>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <p className="eyebrow">Residence Maintenance</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            My Requests
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed sm:text-base">
            Track live progress, technician assignments, and confirm resolutions for maintenance
            reports at Corridor Hills.
          </p>
        </div>

        {/* NOT VERIFIED STATE */}
        {!isVerified || !session ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ClipboardList className="h-4 w-4 text-teal-600 dark:text-teal-400" />
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
              <div className="flex rounded-xl bg-muted/50 p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "all"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>All</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                    {requests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "active"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Active</span>
                  <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 text-[10px]">
                    {activeRequests.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("resolved")}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "resolved"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Resolved</span>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 text-[10px]">
                    {resolvedRequests.length}
                  </span>
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search reference or issue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <p className="mt-3 text-xs font-semibold text-muted-foreground">
                  Loading your maintenance requests...
                </p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {searchQuery ? "No matching requests found" : "No requests in this category"}
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms or filter selection."
                    : "When you or your unit report an issue, it will appear here with live tracking updates."}
                </p>
                <div className="mt-5">
                  <Link
                    to="/report"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 active:scale-95"
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
