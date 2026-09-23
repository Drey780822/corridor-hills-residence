import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { MobileDock } from "@/components/mobile-dock";
import { ResidentVerificationCard } from "@/components/resident-verification-card";
import { MaintenanceReportWizard } from "@/components/maintenance-report-wizard";
import { GradientWaves } from "@/components/gradient-waves";
import { useResidentSession } from "@/lib/session";
import { ArrowLeft, ShieldCheck, Wrench } from "lucide-react";

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
    <div className="site-shell min-h-screen pb-28">
      <SiteHeader />

      <main>
        {/* Elevated Report Page Hero Banner with GradientWaves in System Colors */}
        <section className="report-hero" aria-labelledby="report-page-title">
          <div className="report-hero-waves" aria-hidden="true">
            <GradientWaves
              horizonColor="#0a1f3d"
              waveColor="#0050a0"
              crestColor="#10a080"
              speed={0.4}
              amplitude={2.2}
              waveScale={0.6}
              waveRatio={0.9}
              swell={30}
              turbulence={18}
              tilt={1.11}
              zoom={1.0}
              height={5.5}
              fogDepth={15}
              detail="medium"
              brightness={1.0}
              opacity={0.85}
              mouseInteraction={true}
              parallaxStrength={0.4}
              grain={true}
              grainIntensity={0.04}
            />
          </div>
          <div className="report-hero-shade" />

          <div className="report-hero-inner">
            {/* Top Navigation Row */}
            <div className="report-hero-nav">
              <Link to="/" className="report-back-link">
                <ArrowLeft className="h-4 w-4" />
                <span>Residence Home</span>
              </Link>

              {isVerified && session && (
                <div className="report-status-badge">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified: {session.location}</span>
                </div>
              )}
            </div>

            {/* Page Title & Editorial Lead */}
            <div className="report-hero-text">
              <div className="report-eyebrow-row">
                <p className="eyebrow light">Corridor Hills Residence Support</p>
                <span className="report-badge-pill">TUT • Support</span>
              </div>
              <h1 id="report-page-title" className="report-title">
                Report a maintenance issue
              </h1>
              <p className="report-lead">
                Tell us what needs attention in your room, bathroom, kitchen or common area. Our
                maintenance team prioritises repairs and updates you on progress.
              </p>
            </div>

            {/* Operational Highlights */}
            <div className="report-highlights">
              <div className="report-highlight-item">
                <span className="report-highlight-dot" />
                <span>Direct Technician Dispatch</span>
              </div>
              <div className="report-highlight-divider">•</div>
              <div className="report-highlight-item">
                <span className="report-highlight-dot" />
                <span>100% Tracked Updates</span>
              </div>
              <div className="report-highlight-divider">•</div>
              <div className="report-highlight-item">
                <span className="report-highlight-dot" />
                <span>Offline Draft Protection</span>
              </div>
            </div>
          </div>
        </section>

        {/* Form Body: Verification vs Multi-Step Reporting Wizard */}
        <div className="report-body section-wrap max-w-4xl mx-auto px-4 sm:px-6">
          {!isVerified || !session ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 font-bold text-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Quick Resident Verification
                    </h2>
                    <p className="text-xs font-normal text-muted-foreground">
                      TUT Student Residence Access
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  You don&apos;t need to remember passwords. Simply confirm your unit, room, and
                  official TUT student number to begin reporting.
                </p>
              </div>

              <ResidentVerificationCard inline />
            </div>
          ) : (
            <div className="space-y-6">
              <MaintenanceReportWizard session={session} />
            </div>
          )}
        </div>
      </main>

      <MobileDock />
    </div>
  );
}
