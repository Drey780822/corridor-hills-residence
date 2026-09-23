import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [
    { title: "My Requests — Corridor Hills" },
    { name: "description", content: "Track your Corridor Hills maintenance requests." },
    { property: "og:title", content: "My Requests — Corridor Hills" },
    { property: "og:description", content: "Track your Corridor Hills maintenance requests." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: RequestsPage,
});

function RequestsPage() {
  return <main className="holding-page"><p>Corridor Hills Residence</p><h1>My requests</h1><span>Request tracking is coming next.</span><Link to="/">Return home</Link></main>;
}