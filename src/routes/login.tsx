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

import { PlatformBackground } from "@/components/platform-background";
import { StudentPlatformHeader } from "@/components/student-platform-header";

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
    <PlatformBackground defaultKey="A">
      <div className="dark student-portal-shell site-shell min-h-screen pb-28 text-slate-100 relative overflow-hidden">
        <SiteHeader />

        <main className="section-wrap pt-28 sm:pt-32 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <StudentPlatformHeader
            currentTab="login"
            pageTitle={isVerified ? "Resident Profile" : "Student Verification"}
            pageSubtitle={
              isVerified
                ? "Your resident identity is verified and active. You can report maintenance issues and track updates without re-entering credentials."
                : "Password-free authentication using your allocated residence unit, room, and official TUT student number."
            }
            badgeText="TUT • Resident ID"
          />

          {/* Verified Profile Card vs Verification Flow */}
          {isVerified && session ? (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-2xl border border-teal-500/30 bg-[#0B1E38]/90 backdrop-blur-md p-6 shadow-2xl sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-teal-500/40 bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-300">
                          Verified Resident
                        </span>
                        <span className="text-xs text-slate-400">• Active</span>
                      </div>
                      <h2 className="mt-1 text-3xl font-black tracking-tight text-white">
                        {session.location}
                      </h2>
                      <p className="text-sm font-medium text-slate-300">
                        Corridor Hills Residence • {getBlockDescription(session.block)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-bold text-slate-300 transition-colors hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 active:scale-95"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Switch Resident</span>
                  </button>
                </div>

                {/* Information Grid */}
                <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-[#061426]/70 p-4 sm:grid-cols-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Block
                    </span>
                    <p className="text-base font-bold text-white">Block {session.block}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Floor
                    </span>
                    <p className="text-base font-bold text-white">Floor {session.floor}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Room
                    </span>
                    <p className="text-base font-bold text-white">Room {session.room}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      TUT Student #
                    </span>
                    <p className="font-mono text-base font-bold text-white">
                      ••••{session.studentNumber.slice(-4)}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/report"
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#10A080] px-6 font-bold text-[#061325] shadow-lg shadow-teal-950/40 transition-all active:scale-95 hover:bg-[#12b38f]"
                  >
                    <Wrench className="h-4 w-4" />
                    <span>Report an Issue</span>
                  </Link>
                  <Link
                    to="/requests"
                    className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 font-bold text-white transition-all active:scale-95 hover:bg-white/10"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>View My Requests</span>
                  </Link>
                </div>
              </div>

              {/* Explanatory security callout */}
              <div className="rounded-2xl border border-white/10 bg-[#0B1E38]/60 backdrop-blur-sm p-5 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck className="h-4 w-4 text-teal-400" />
                  <span>Residence Operational Model</span>
                </div>
                <p className="mt-1">
                  At Corridor Hills, each unit (e.g. F301) houses 6 students across Rooms A, B, and
                  C. You are individually identifiable by your TUT student number, giving you direct
                  access to maintenance services without shared passwords.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-[#0B1E38]/70 backdrop-blur-sm p-5 text-sm text-slate-300">
                <div className="flex items-center gap-2 font-bold text-white">
                  <UserCheck className="h-4 w-4 text-teal-400" />
                  <span>How Verification Works</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  Enter your Corridor Hills unit (e.g. <strong className="text-white">F301</strong>
                  ), choose your allocated bedroom (
                  <strong className="text-white">A, B, or C</strong>), and input your{" "}
                  <strong className="text-white">TUT student number</strong>. The system will match
                  your details against official university residence records.
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
    </PlatformBackground>
  );
}
