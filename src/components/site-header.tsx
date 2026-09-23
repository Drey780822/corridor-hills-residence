import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoAsset from "@/assets/Corridor_Hill_logo.png.asset.json";

const links = [
  { label: "Home", to: "/" },
  { label: "Report an issue", to: "/report" },
  { label: "My requests", to: "/requests" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Link to="/" className="brand-lockup" aria-label="Corridor Hills home">
        <img src={logoAsset.url} alt="" className="brand-symbol" />
        <span><strong>Corridor Hills</strong><small>Residence</small></span>
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map((link) => <Link key={link.label} to={link.to}>{link.label}</Link>)}
        <Link to="/login" className="nav-login">Student login</Link>
      </nav>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {links.map((link) => <Link key={link.label} to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>)}
          <Link to="/login" onClick={() => setOpen(false)}>Student login</Link>
        </nav>
      )}
    </header>
  );
}