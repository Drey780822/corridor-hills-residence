import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { MobileDock } from "@/components/mobile-dock";
import { ResidentVerificationCard } from "@/components/resident-verification-card";
import { MaintenanceReportWizard } from "@/components/maintenance-report-wizard";
import { PlatformBackground } from "@/components/platform-background";
import { StudentPlatformHeader } from "@/components/student-platform-header";
import { useResidentSession } from "@/lib/session";
import { ShieldCheck, Wrench, Sparkles, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report an Issue — Corridor Hills Residence" },
      {
        name: "description",
        content:
          "Report a maintenance issue at Corridor Hills Residence (TUT). Fast, trackable residence support.",
      },
      { property: "og:title", content: "Report an Issue — Corridor Hills Residence" },
      {
        property: "og:description",
        content: "Report a maintenance issue at Corridor Hills Residence (TUT).",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { session, isVerified } = useResidentSession();

  return (
    <PlatformBackground defaultKey="aaa">
      <div className="dark student-portal-shell site-shell min-h-screen pb-28 text-slate-100 relative overflow-hidden">
        <SiteHeader />

        <main className="section-wrap pt-28 sm:pt-32 max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <StudentPlatformHeader
            currentTab="report"
            pageTitle="Report an Issue"
            pageSubtitle="Tell us what needs attention in your room, bathroom, kitchen or common area. Our maintenance team prioritises repairs and updates you on progress."
            badgeText="TUT • Maintenance Dispatch"
          />

          {/* Operational Guarantees Banner */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1E38]/70 px-4 py-3 text-xs text-slate-300 backdrop-blur-md">
            <div className="flex items-center gap-2 font-bold text-white">
              <Sparkles className="h-4 w-4 text-[#10A080]" />
              <span>Residence Support Standards:</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10A080]" />
                Direct Technician Dispatch
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                100% Tracked Updates
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Offline Draft Protection
              </span>
            </div>
          </div>

          {/* Form Body: Verification vs Multi-Step Reporting Wizard */}
          {!isVerified || !session ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/12 bg-[#0B1E38]/85 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Quick Resident Verification</h2>
                    <p className="text-xs text-slate-300">
                      TUT Student Residence Access • Password-free
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  To report maintenance for your unit, simply select your residence unit, bedroom,
                  and enter your official Tshwane University of Technology student number.
                </p>
              </div>

              <ResidentVerificationCard inline />
            </div>
          ) : (
            <div className="space-y-6">
              <MaintenanceReportWizard session={session} />
            </div>
          )}
        </main>

        <MobileDock />
      </div>
    </PlatformBackground>
  );
}
