import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Student Login — Corridor Hills" },
    { name: "description", content: "Student access for Corridor Hills residents." },
    { property: "og:title", content: "Student Login — Corridor Hills" },
    { property: "og:description", content: "Student access for Corridor Hills residents." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: LoginPage,
});

function LoginPage() {
  return <main className="holding-page"><p>Corridor Hills Residence</p><h1>Student login</h1><span>Student access is coming next.</span><Link to="/">Return home</Link></main>;
}