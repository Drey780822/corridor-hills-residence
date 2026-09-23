import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/report")({
  head: () => ({ meta: [
    { title: "Report an Issue — Corridor Hills" },
    { name: "description", content: "Report a residence maintenance issue at Corridor Hills." },
    { property: "og:title", content: "Report an Issue — Corridor Hills" },
    { property: "og:description", content: "Report a residence maintenance issue at Corridor Hills." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ]}),
  component: ReportPage,
});

function ReportPage() {
  return <main className="holding-page"><p>Corridor Hills Residence</p><h1>Report an issue</h1><span>The student reporting experience is coming next.</span><Link to="/">Return home</Link></main>;
}