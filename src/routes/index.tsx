import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, Eye, FilePlus2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MobileDock } from "@/components/mobile-dock";
import { ScrollExpand } from "@/components/ui/ScrollExpand";
import { AccordionGallery } from "@/components/accordion-gallery";
import { GradientWaves } from "@/components/gradient-waves";
import { ThumbnailCarousel } from "@/components/ui/thumbnail-carousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Corridor Hills Residence — Residence Life, Connected" },
      {
        name: "description",
        content: "Corridor Hills Residence student life and maintenance support.",
      },
      { property: "og:title", content: "Corridor Hills Residence" },
      { property: "og:description", content: "Residence life, connected." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const GALLERY_ITEMS = [
  {
    image: "/images/aaa.jpg",
    label: "after the rain",
    alt: "Rainbow over Corridor Hills residence after rain",
  },
  {
    image: "/images/aa.jpg",
    label: "from the balcony",
    alt: "Architectural balcony view across Corridor Hills",
  },
  {
    image: "/images/w.jpg",
    label: "belonging & play",
    alt: "Corridor Hills residents gathered on the sports court",
  },
  {
    image: "/images/pic8.jpg",
    label: "after hours",
    alt: "Corridor Hills residence architectural lighting at night",
  },
  {
    image: "/images/A.jpg",
    label: "evening glow",
    alt: "Corridor Hills residence buildings under the evening sky",
  },
  {
    image: "/images/pic2.jpg",
    label: "courtyard spaces",
    alt: "Quiet manicured grounds and common spaces",
  },
];

function Index() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        {/* Section 1: Hero */}
        <section className="hero" aria-labelledby="hero-title">
          <video autoPlay muted loop playsInline preload="metadata" poster="/images/A.jpg">
            <source src="/videos/video22.mp4" type="video/mp4" />
          </video>
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="eyebrow light">Tshwane University of Technology</p>
            <h1 id="hero-title">
              <span>Corridor</span>
              <span>Hills.</span>
            </h1>
            <p className="hero-line">Residence life, connected.</p>
            <div className="hero-actions">
              <Link to="/report" className="button button-primary">
                Report a maintenance issue <ArrowRight />
              </Link>
              <a href="#story" className="text-link">
                Explore Corridor Hills <ArrowDown />
              </a>
            </div>
          </div>
          <p className="hero-index">CH / 01</p>
        </section>

        {/* Section 2: Story & Architectural Reveal with ScrollExpand */}
        <section id="story" className="story-section" aria-labelledby="story-title">
          <div className="section-wrap story-intro">
            <p className="eyebrow">Life at Corridor Hills</p>
            <h2 id="story-title">
              More than
              <br />a room.
            </h2>
            <div className="story-intro-grid">
              <p className="story-lede">
                Your space. Your people. A residence shaped by the moments in between.
              </p>
              <p className="story-subtext">
                Designed to provide Tshwane University of Technology students with a quiet, secure,
                and inspiring home base in Emalahleni.
              </p>
            </div>
          </div>

          <div className="story-reveal-wrap">
            <ScrollExpand
              src="/images/h.jpg"
              alt="Corridor Hills Residence"
              title="More than a room."
              scrollHint="Scroll"
              startWidth={42}
              startHeight={58}
              startRadius={24}
              endRadius={0}
              mediaZoom={1.35}
              scrollDistance={1.2}
              holdDistance={0.35}
              smoothing={0.1}
              overlayScrim={0.45}
              useWindowScroll
            >
            </ScrollExpand>
          </div>
        </section>

        {/* Section 3: Community Band */}
        <section className="community-band">
          <div className="section-wrap community-grid">
            <div className="community-copy">
              <p className="eyebrow light">Our community</p>
              <h2>
                Built for
                <br />
                belonging.
              </h2>
              <p>
                Study. Connect. Show up for one another. This is residence life, lived together.
              </p>
            </div>
            <div className="community-media">
              <ThumbnailCarousel />
            </div>
          </div>
        </section>

        {/* Section 4: Accordion Gallery of Curated Spaces */}
        <section className="gallery section-wrap" aria-label="Corridor Hills moments">
          <div className="gallery-intro">
            <div className="gallery-intro-header">
              <div>
                <p className="eyebrow">Around the residence</p>
                <h2>
                  Everyday views.
                  <br />
                  Distinctly ours.
                </h2>
              </div>
              <p className="gallery-lead">
                Moments captured across seasons, courtyards, and shared spaces at Corridor Hills.
              </p>
            </div>
          </div>

          <div className="gallery-container">
            <AccordionGallery
              items={GALLERY_ITEMS}
              defaultIndex={1}
              accentColor="#10a080"
              overlayColor="#0a1f3d"
              radius={8}
              height={460}
              grayscale={true}
              expandRatio={0.46}
              trigger="hover"
            />
          </div>
        </section>

        {/* Section 5: Residence Support Service Steps */}
        <section className="service-section">
          <div className="section-wrap">
            <p className="eyebrow">Residence support</p>
            <div className="service-title">
              <h2>
                Something not
                <br />
                working?
              </h2>
              <p>Tell us what’s wrong. Keep track of progress. Know when it’s sorted.</p>
            </div>
            <ol className="steps">
              <li>
                <span>01</span>
                <FilePlus2 />
                <div>
                  <h3>Report</h3>
                  <p>Share the issue and where it is.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <Eye />
                <div>
                  <h3>Track</h3>
                  <p>Follow updates from one place.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <Check />
                <div>
                  <h3>Resolved</h3>
                  <p>Confirm when everything is right.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Section 6: Final CTA with Background Image */}
        <section className="final-cta">
          <div className="final-cta-image">
            <img
              src="/images/A.jpg"
              alt="Corridor Hills residence buildings at sunset"
              loading="lazy"
            />
          </div>
          <div className="final-cta-waves" aria-hidden="true">
            <GradientWaves
              horizonColor="#0a1f3d"
              waveColor="#0050a0"
              crestColor="#10a080"
              speed={0.6}
              amplitude={14}
              detail="low"
              opacity={0.3}
              mouseInteraction={false}
            />
          </div>
          <div className="final-cta-shade" />
          <div className="final-cta-content">
            <p className="eyebrow light">Here when you need us</p>
            <h2>
              See something
              <br />
              that needs fixing?
            </h2>
            <p>Tell us. We’ll take it from there.</p>
            <Link to="/report" className="button button-primary">
              Report an issue <ArrowRight />
            </Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand-footer">
          <strong>Corridor Hills</strong>
          <span>Residence</span>
        </div>
        <p>Student residence support</p>
        <Link to="/login">Student login</Link>
      </footer>

      <MobileDock />
    </div>
  );
}
