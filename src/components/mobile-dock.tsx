import { Link, useLocation } from "@tanstack/react-router";
import { CircleUserRound, ClipboardList, Home, ShieldCheck, Wrench } from "lucide-react";
import { useResidentSession } from "../lib/session";

export function MobileDock() {
  const location = useLocation();
  const pathname = location.pathname;
  const { isVerified, session } = useResidentSession();

  const isHome = pathname === "/";
  const isReport = pathname === "/report";
  const isRequests = pathname === "/requests";
  const isProfile = pathname === "/login";

  return (
    <nav className="mobile-dock" aria-label="Student navigation">
      <Link
        to="/"
        className={`transition-colors ${isHome ? "text-white font-bold" : "opacity-75 hover:opacity-100"}`}
      >
        <Home className="h-5 w-5" />
        <span>Home</span>
      </Link>

      <Link
        to="/report"
        className={`dock-primary shadow-lg transition-transform active:scale-95 ${
          isReport ? "ring-2 ring-white/50" : ""
        }`}
      >
        <Wrench className="h-5 w-5" />
        <span>Report</span>
      </Link>

      <Link
        to="/requests"
        className={`relative transition-colors ${
          isRequests ? "text-white font-bold" : "opacity-75 hover:opacity-100"
        }`}
      >
        <ClipboardList className="h-5 w-5" />
        <span>Requests</span>
      </Link>

      <Link
        to="/login"
        className={`transition-colors ${
          isProfile ? "text-white font-bold" : "opacity-75 hover:opacity-100"
        }`}
      >
        {isVerified ? (
          <>
            <div className="relative">
              <ShieldCheck className="h-5 w-5 text-teal-300" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <span className="truncate max-w-[48px] font-mono text-[9px]">
              {session?.location || "Profile"}
            </span>
          </>
        ) : (
          <>
            <CircleUserRound className="h-5 w-5" />
            <span>Verify</span>
          </>
        )}
      </Link>
    </nav>
  );
}
