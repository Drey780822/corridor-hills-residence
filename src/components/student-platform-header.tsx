import { Link } from "@tanstack/react-router";
import { useResidentSession } from "@/lib/session";
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  ShieldCheck,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { RESIDENCE_BACKGROUNDS, type BackgroundKey } from "@/components/platform-background";

interface StudentPlatformHeaderProps {
  currentTab: "report" | "requests" | "login";
  pageTitle: string;
  pageSubtitle: string;
  badgeText?: string;
}

export function StudentPlatformHeader({
  currentTab,
  pageTitle,
  pageSubtitle,
  badgeText = "TUT Student Operations",
}: StudentPlatformHeaderProps) {
  const { session, isVerified } = useResidentSession();
  const [mobileSceneryOpen, setMobileSceneryOpen] = useState(false);

  const activeBackdropKey = (
    typeof window !== "undefined"
      ? (localStorage.getItem("ch_platform_backdrop") as BackgroundKey) || "A"
      : "A"
  ) as BackgroundKey;

  const selectBg = (key: BackgroundKey) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ch_platform_backdrop", key);
      window.dispatchEvent(new Event("storage"));
      window.location.reload();
    }
  };

  return (
    <div className="mb-8">
      {/* Top utility row: Return link + Institutional badge + Mobile Scenery button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Residence Home</span>
        </Link>

        <div className="flex items-center gap-2">
          {isVerified && session && (
            <div className="flex items-center gap-1.5 rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-[11px] font-bold text-teal-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Unit {session.location}</span>
            </div>
          )}

          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {badgeText}
          </span>

          {/* Mobile view changer */}
          <button
            type="button"
            onClick={() => setMobileSceneryOpen(!mobileSceneryOpen)}
            className="md:hidden flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 hover:text-white"
            title="Switch background view"
            aria-label="Switch background view"
          >
            <Camera className="h-3.5 w-3.5 text-teal-400" />
          </button>
        </div>
      </div>

      {/* Mobile Scenery Dropdown */}
      {mobileSceneryOpen && (
        <div className="md:hidden mb-6 rounded-2xl border border-white/15 bg-[#0B1E38]/95 p-3 shadow-xl backdrop-blur-xl animate-in fade-in">
          <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-2">
            Switch Campus Scenery
          </div>
          <div className="grid grid-cols-3 gap-2">
            {RESIDENCE_BACKGROUNDS.map((bg) => (
              <button
                key={bg.key}
                type="button"
                onClick={() => {
                  selectBg(bg.key);
                  setMobileSceneryOpen(false);
                }}
                className="flex flex-col items-center gap-1 rounded-xl p-1.5 border border-white/10 hover:border-teal-400/50 bg-white/5"
              >
                <img src={bg.src} alt={bg.title} className="h-12 w-full rounded-lg object-cover" />
                <span className="text-[10px] font-bold text-slate-200 truncate w-full text-center">
                  {bg.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unified Platform Navigation Ribbon */}
      <div className="mb-6 flex overflow-x-auto no-scrollbar rounded-2xl border border-white/12 bg-[#0B1E38]/85 p-1.5 shadow-2xl backdrop-blur-xl">
        <Link
          to="/login"
          className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
            currentTab === "login"
              ? "bg-[#10A080] text-[#061325] shadow-lg font-extrabold"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Resident ID</span>
        </Link>

        <Link
          to="/report"
          className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
            currentTab === "report"
              ? "bg-[#10A080] text-[#061325] shadow-lg font-extrabold"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Report Issue</span>
        </Link>

        <Link
          to="/requests"
          className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition-all ${
            currentTab === "requests"
              ? "bg-[#10A080] text-[#061325] shadow-lg font-extrabold"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Track Requests</span>
        </Link>
      </div>

      {/* Main Page Title Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#10A080]">
          Corridor Hills Residence • TUT eMalahleni
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-2 text-sm text-slate-200 max-w-2xl leading-relaxed sm:text-base">
          {pageSubtitle}
        </p>
      </div>
    </div>
  );
}
