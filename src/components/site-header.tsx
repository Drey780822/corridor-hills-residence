import { Link } from "@tanstack/react-router";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useResidentSession } from "../lib/session";

const links = [
  { label: "Home", to: "/" },
  { label: "Report an issue", to: "/report" },
  { label: "My requests", to: "/requests" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isVerified, session } = useResidentSession();

  return (
    <header className="site-header">
      <Link to="/" className="brand-lockup" aria-label="Corridor Hills home">
        <img src="/images/logo.png" alt="Corridor Hills Residence Logo" className="brand-symbol" />
        <span>
          <strong>Corridor Hills</strong>
          <small>Residence • TUT</small>
        </span>
      </Link>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map((link) => (
          <Link key={link.label} to={link.to}>
            {link.label}
          </Link>
        ))}

        {isVerified && session ? (
          <Link
            to="/login"
            className="nav-login flex items-center gap-1.5 font-mono text-xs font-bold text-teal-300 border-teal-400/40 bg-teal-500/10 hover:bg-teal-500/20"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>{session.location}</span>
          </Link>
        ) : (
          <Link to="/login" className="nav-login">
            Student verify
          </Link>
        )}
      </nav>

      <button
        className="menu-button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X /> : <Menu />}
      </button>

      {open && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link key={link.label} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between border-t border-white/20 pt-3"
          >
            <span>{isVerified ? `Verified: ${session?.location}` : "Student verify"}</span>
            {isVerified && <ShieldCheck className="h-4 w-4 text-teal-300" />}
          </Link>
        </nav>
      )}
    </header>
  );
}
