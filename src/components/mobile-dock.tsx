import { Link } from "@tanstack/react-router";
import { CircleUserRound, ClipboardList, Home, Wrench } from "lucide-react";

export function MobileDock() {
  return (
    <nav className="mobile-dock" aria-label="Student navigation">
      <Link to="/"><Home /><span>Home</span></Link>
      <Link to="/report" className="dock-primary"><Wrench /><span>Report</span></Link>
      <Link to="/requests"><ClipboardList /><span>Requests</span></Link>
      <Link to="/login"><CircleUserRound /><span>Profile</span></Link>
    </nav>
  );
}