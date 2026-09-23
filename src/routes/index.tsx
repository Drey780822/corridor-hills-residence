import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, Eye, FilePlus2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MobileDock } from "@/components/mobile-dock";
import { MediaSlideshow } from "@/components/media-slideshow";
import heroVideo from "@/assets/b.mp4.asset.json";
import sunset from "@/assets/A.jpg.asset.json";
import balcony from "@/assets/aa.jpg.asset.json";
import rainbow from "@/assets/aaa.jpg.asset.json";
import community from "@/assets/w.jpg.asset.json";
import communityNight from "@/assets/r.jpg.asset.json";
import communityCourt from "@/assets/t.jpg.asset.json";
import night from "@/assets/pic8.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Corridor Hills Residence — Residence Life, Connected" },
      { name: "description", content: "Corridor Hills Residence student life and maintenance support." },
      { property: "og:title", content: "Corridor Hills Residence" },
      { property: "og:description", content: "Residence life, connected." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <video autoPlay muted loop playsInline preload="metadata" poster={sunset.url}>
            <source src={heroVideo.url} type="video/mp4" />
          </video>
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow light">Tshwane University of Technology</p>
            <h1 id="hero-title"><span>Corridor</span><span>Hills.</span></h1>
            <p className="hero-line">Residence life, connected.</p>
            <div className="hero-actions">
              <Link to="/report" className="button button-primary">Report a maintenance issue <ArrowRight /></Link>
              <a href="#story" className="text-link">Explore Corridor Hills <ArrowDown /></a>
            </div>
          </div>
          <p className="hero-index">CH / 01</p>
        </section>

        <section id="story" className="story section-wrap">
          <div className="story-heading reveal">
            <p className="eyebrow">Life at Corridor Hills</p>
            <h2>More than<br />a room.</h2>
          </div>
          <figure className="story-main"><img src={sunset.url} alt="Corridor Hills buildings under a pink evening sky" loading="lazy" /><figcaption>The place we call home.</figcaption></figure>
          <div className="story-copy"><p>Your space. Your people. A residence shaped by the moments in between.</p></div>
          <figure className="story-detail"><img src={balcony.url} alt="View across Corridor Hills from a residence balcony" loading="lazy" /></figure>
        </section>

        <section className="community-band">
          <div className="section-wrap community-grid">
            <div className="community-copy"><p className="eyebrow light">Our community</p><h2>Built for<br />belonging.</h2><p>Study. Connect. Show up for one another. This is residence life, lived together.</p></div>
            <MediaSlideshow images={[community, communityNight, communityCourt]} alt="Corridor Hills residents together on a sports court" />
          </div>
        </section>

        <section className="gallery section-wrap" aria-label="Corridor Hills moments">
          <div className="gallery-intro"><p className="eyebrow">Around the residence</p><h2>Everyday views.<br />Distinctly ours.</h2></div>
          <div className="media-rail">
            <figure className="media-tall"><img src={rainbow.url} alt="A rainbow over Corridor Hills after rain" loading="lazy" /><figcaption>After the rain</figcaption></figure>
            <figure className="media-wide"><img src={night.url} alt="Corridor Hills residence at night" loading="lazy" /><figcaption>After hours</figcaption></figure>
            <figure className="media-tall"><img src={balcony.url} alt="Architectural balcony view at Corridor Hills" loading="lazy" /><figcaption>From home</figcaption></figure>
          </div>
        </section>

        <section className="service-section">
          <div className="section-wrap">
            <p className="eyebrow">Residence support</p>
            <div className="service-title"><h2>Something not<br />working?</h2><p>Tell us what’s wrong. Keep track of progress. Know when it’s sorted.</p></div>
            <ol className="steps">
              <li><span>01</span><FilePlus2 /><div><h3>Report</h3><p>Share the issue and where it is.</p></div></li>
              <li><span>02</span><Eye /><div><h3>Track</h3><p>Follow updates from one place.</p></div></li>
              <li><span>03</span><Check /><div><h3>Resolved</h3><p>Confirm when everything is right.</p></div></li>
            </ol>
          </div>
        </section>

        <section className="final-cta">
          <div className="final-cta-image"><img src={sunset.url} alt="Corridor Hills at sunset" loading="lazy" /></div>
          <div className="final-cta-shade" />
          <div className="final-cta-content"><p className="eyebrow light">Here when you need us</p><h2>See something<br />that needs fixing?</h2><p>Tell us. We’ll take it from there.</p><Link to="/report" className="button button-primary">Report an issue <ArrowRight /></Link></div>
        </section>
      </main>
      <footer><div className="brand-footer"><strong>Corridor Hills</strong><span>Residence</span></div><p>Student residence support</p><Link to="/login">Student login</Link></footer>
      <MobileDock />
    </div>
  );
}
