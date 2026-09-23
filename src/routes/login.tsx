import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { MobileDock } from "@/components/mobile-dock";
import { ResidentVerificationCard } from "@/components/resident-verification-card";
import { useResidentSession } from "@/lib/session";
import { getBlockDescription } from "@/lib/residence-data";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Student Verification — Corridor Hills Residence" },
      {
        name: "description",
        content:
          "Student verification and profile portal for Corridor Hills Residence residents (TUT).",
      },
      { property: "og:title", content: "Student Verification — Corridor Hills Residence" },
      {
        property: "og:description",
        content: "Student verification and profile portal for Corridor Hills Residence residents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, isVerified, clearSession } = useResidentSession();

  const handleSignOut = () => {
    clearSession();
    toast.info("Resident session ended. You can verify again anytime.");
  };

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

          <span className="text-xs font-semibold text-muted-foreground">
            Tshwane University of Technology
          </span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <p className="eyebrow">Corridor Hills Residence</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {isVerified ? "Resident Profile" : "Student Verification"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed sm:text-base">
            {isVerified
              ? "Your resident identity is verified and active. You can report maintenance issues and track updates without re-entering credentials."
              : "Password-free authentication using your allocated residence unit, room, and official TUT student number."}
          </p>
        </div>

        {/* Verified Profile Card vs Verification Flow */}
        {isVerified && session ? (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-teal-500/30 bg-card p-6 shadow-xl sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                        Verified Resident
                      </span>
                      <span className="text-xs text-muted-foreground">• Active</span>
                    </div>
                    <h2 className="mt-1 text-3xl font-black tracking-tight text-foreground">
                      {session.location}
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                      Corridor Hills Residence • {getBlockDescription(session.block)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Switch Resident</span>
                </button>
              </div>

              {/* Information Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Block
                  </span>
                  <p className="text-base font-bold text-foreground">Block {session.block}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Floor
                  </span>
                  <p className="text-base font-bold text-foreground">Floor {session.floor}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Room
                  </span>
                  <p className="text-base font-bold text-foreground">Room {session.room}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    TUT Student #
                  </span>
                  <p className="font-mono text-base font-bold text-foreground">
                    ••••{session.studentNumber.slice(-4)}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/report"
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 font-bold text-white shadow-md transition-all active:scale-95 hover:bg-teal-700"
                >
                  <Wrench className="h-4 w-4" />
                  <span>Report an Issue</span>
                </Link>
                <Link
                  to="/requests"
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 font-bold text-foreground transition-all active:scale-95 hover:bg-accent"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>View My Requests</span>
                </Link>
              </div>
            </div>

            {/* Explanatory security callout */}
            <div className="rounded-2xl border border-border bg-muted/20 p-5 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Residence Operational Model</span>
              </div>
              <p className="mt-1">
                At Corridor Hills, each unit (e.g. F301) houses 6 students across Rooms A, B, and C.
                You are individually identifiable by your TUT student number, giving you direct
                access to maintenance services without shared passwords.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-muted/20 p-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>How Verification Works</span>
              </div>
              <p className="mt-1 leading-relaxed">
                Enter your Corridor Hills unit (e.g. <strong>F301</strong>), choose your allocated
                bedroom (<strong>A, B, or C</strong>), and input your{" "}
                <strong>TUT student number</strong>. The system will match your details against
                official university residence records.
              </p>
            </div>

            <ResidentVerificationCard
              onVerified={() => {
                navigate({ to: "/requests" });
              }}
              inline
            />
          </div>
        )}
      </main>

      <MobileDock />
    </div>
  );
}
