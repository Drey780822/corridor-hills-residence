const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const logoPath = path.join(rootDir, "public", "images", "Corridor_Hill_logo.png");
const imgAPath = path.join(rootDir, "images", "A.jpg");
const imgAaaPath = path.join(rootDir, "images", "aaa.jpg");
const imgPic8Path = path.join(rootDir, "images", "pic8.jpg");

const toBase64 = (filePath, mime) => {
  const data = fs.readFileSync(filePath);
  return `data:${mime};base64,${data.toString("base64")}`;
};

const logoBase64 = toBase64(logoPath, "image/png");
const imgABase64 = toBase64(imgAPath, "image/jpeg");
const imgAaaBase64 = toBase64(imgAaaPath, "image/jpeg");
const imgPic8Base64 = toBase64(imgPic8Path, "image/jpeg");

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Corridor Hills Residence — Stakeholder Deployment & Operations Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800;900&display=swap');

  @page {
    size: A4 portrait;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.45;
    font-size: 9.5pt;
  }

  .page {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
    background: #ffffff;
    display: flex;
    flex-direction: column;
  }

  /* Header & Footer on Inner Pages */
  .page-header {
    height: 16mm;
    padding: 0 16mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
    z-index: 10;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-logo {
    height: 26px;
    width: auto;
  }

  .header-title {
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0050A0;
  }

  .header-right {
    font-size: 7pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .page-footer {
    height: 14mm;
    padding: 0 16mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #e2e8f0;
    font-size: 7pt;
    color: #64748b;
    background: #ffffff;
    margin-top: auto;
    z-index: 10;
  }

  .page-content {
    flex: 1;
    padding: 12mm 16mm 10mm 16mm;
    position: relative;
    z-index: 2;
  }

  /* Cover Page */
  .cover-page {
    background: #061325;
    color: #ffffff;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .cover-hero {
    position: relative;
    height: 120mm;
    overflow: hidden;
    border-bottom: 3px solid #10A080;
  }

  .cover-hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 30%;
    filter: brightness(0.7) contrast(1.1);
  }

  .cover-hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(6, 19, 37, 0.45) 0%, rgba(6, 19, 37, 0.75) 60%, #061325 100%);
  }

  .cover-hero-content {
    position: absolute;
    inset: 0;
    padding: 16mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    z-index: 2;
  }

  .cover-brand-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cover-logo-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(10, 31, 61, 0.85);
    padding: 8px 16px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
  }

  .cover-logo-box img {
    height: 38px;
    width: auto;
  }

  .cover-logo-text {
    display: flex;
    flex-direction: column;
  }

  .cover-logo-text strong {
    font-size: 11pt;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 0.04em;
  }

  .cover-logo-text small {
    font-size: 7.5pt;
    font-weight: 700;
    color: #10A080;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .cover-status-badge {
    background: rgba(16, 160, 128, 0.18);
    border: 1px solid rgba(16, 160, 128, 0.45);
    color: #10A080;
    font-size: 7.5pt;
    font-weight: 800;
    padding: 6px 14px;
    border-radius: 30px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .cover-hero-title-wrap {
    margin-top: auto;
  }

  .cover-hero-eyebrow {
    color: #10A080;
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-bottom: 6px;
  }

  .cover-hero-title {
    font-size: 26pt;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -0.02em;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .cover-hero-subtitle {
    font-size: 11pt;
    color: #94a3b8;
    max-width: 170mm;
    line-height: 1.4;
  }

  .cover-body {
    padding: 12mm 16mm;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .quick-access-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 12mm;
  }

  .quick-card {
    background: rgba(11, 30, 56, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 12px 14px;
  }

  .quick-card-badge {
    display: inline-block;
    font-size: 6.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #10A080;
    background: rgba(16, 160, 128, 0.12);
    padding: 2px 8px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .quick-card h3 {
    font-size: 10.5pt;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 4px;
  }

  .quick-card p {
    font-size: 7.5pt;
    color: #94a3b8;
    margin-bottom: 8px;
    line-height: 1.35;
  }

  .quick-card a {
    font-size: 7.5pt;
    font-weight: 700;
    color: #38bdf8;
    text-decoration: none;
    display: block;
    word-break: break-all;
    font-family: monospace;
  }

  .executive-brief-box {
    background: rgba(255, 255, 255, 0.04);
    border-left: 3px solid #0050A0;
    padding: 12px 16px;
    border-radius: 0 10px 10px 0;
  }

  .executive-brief-box h4 {
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #ffffff;
    margin-bottom: 4px;
  }

  .executive-brief-box p {
    font-size: 8pt;
    color: #cbd5e1;
    line-height: 1.45;
  }

  .cover-meta-table {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 10px;
    font-size: 7pt;
  }

  .cover-meta-col span {
    display: block;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .cover-meta-col strong {
    color: #f1f5f9;
    font-weight: 800;
  }

  /* Section Styling */
  .section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #e6f6f2;
    color: #10A080;
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 3px 10px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .section-title {
    font-size: 16pt;
    font-weight: 900;
    color: #061325;
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }

  .section-lead {
    font-size: 8.5pt;
    color: #475569;
    margin-bottom: 12px;
    line-height: 1.4;
  }

  /* Scenery Accent Banner on inner pages */
  .scenery-banner {
    position: relative;
    height: 48mm;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 12px;
    border: 1px solid #cbd5e1;
  }

  .scenery-banner img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    filter: brightness(0.65) contrast(1.1);
  }

  .scenery-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(6, 19, 37, 0.9) 0%, rgba(6, 19, 37, 0.5) 60%, rgba(6, 19, 37, 0.3) 100%);
  }

  .scenery-content {
    position: absolute;
    inset: 0;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: #ffffff;
    z-index: 2;
  }

  .scenery-tag {
    font-size: 7pt;
    font-weight: 800;
    color: #10A080;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 3px;
  }

  .scenery-heading {
    font-size: 13pt;
    font-weight: 900;
    margin-bottom: 4px;
    line-height: 1.2;
  }

  .scenery-desc {
    font-size: 7.5pt;
    color: #cbd5e1;
    max-width: 130mm;
    line-height: 1.35;
  }

  /* Architecture & Diagram Styling */
  .diagram-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 14px;
  }

  .diagram-title {
    font-size: 8pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0050A0;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Grid Layouts */
  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  .three-col-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 12px;
  }

  /* Card and Data Boxes */
  .info-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .info-card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 8pt;
    font-weight: 800;
    color: #061325;
    margin-bottom: 5px;
  }

  .info-card-body {
    font-size: 7.5pt;
    color: #475569;
    line-height: 1.35;
  }

  /* Credential Tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
    margin-top: 6px;
    margin-bottom: 10px;
  }

  .data-table th {
    background: #f1f5f9;
    color: #334155;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    text-align: left;
    font-size: 6.8pt;
  }

  .data-table td {
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    color: #1e293b;
    vertical-align: top;
  }

  .data-table tr:nth-child(even) td {
    background: #f8fafc;
  }

  .badge-tag {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 6.5pt;
    font-weight: 700;
  }

  .badge-teal { background: #d1fae5; color: #065f46; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-purple { background: #f3e8ff; color: #6b21a8; }

  .code-pill {
    font-family: monospace;
    background: #0f172a;
    color: #38bdf8;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 700;
    font-size: 7.5pt;
  }

  /* Step by Step Sequence */
  .step-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 6px;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
  }

  .step-number {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #0050A0;
    color: #ffffff;
    font-weight: 800;
    font-size: 7.5pt;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .step-text h5 {
    font-size: 8pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 2px;
  }

  .step-text p {
    font-size: 7.2pt;
    color: #475569;
    line-height: 1.35;
  }

  .callout-box {
    background: #f0fdfa;
    border: 1px solid #99f6e4;
    border-radius: 8px;
    padding: 8px 12px;
    margin-top: 8px;
    font-size: 7.5pt;
    color: #115e59;
  }

  .callout-box strong {
    color: #0f766e;
  }
</style>
</head>
<body>

  <!-- ================= PAGE 1: COVER & EXECUTIVE OVERVIEW ================= -->
  <div class="page cover-page">
    <div class="cover-hero">
      <img src="${imgABase64}" class="cover-hero-img" alt="Corridor Hills Residence Architectural Evening View">
      <div class="cover-hero-overlay"></div>
      <div class="cover-hero-content">
        <div class="cover-brand-row">
          <div class="cover-logo-box">
            <img src="${logoBase64}" alt="Corridor Hills Logo">
            <div class="cover-logo-text">
              <strong>Corridor Hills Residence</strong>
              <small>Tshwane University of Technology</small>
            </div>
          </div>
          <div class="cover-status-badge">
            Official Stakeholder Release • 2026/2027
          </div>
        </div>

        <div class="cover-hero-title-wrap">
          <div class="cover-hero-eyebrow">Digital Operations & Maintenance Platform</div>
          <h1 class="cover-hero-title">Stakeholder Deployment & Operations Guide</h1>
          <p class="cover-hero-subtitle">
            An institutional operations platform unifying student residents, on-site maintenance technicians, and university administration into a closed-loop digital ecosystem.
          </p>
        </div>
      </div>
    </div>

    <div class="cover-body">
      <div class="quick-access-grid">
        <div class="quick-card">
          <span class="quick-card-badge">Student Portal</span>
          <h3>Resident Experience</h3>
          <p>Password-free room verification, instant fault reporting, photo evidence & real-time ticket tracking.</p>
          <a href="https://corridor-hills-residence.vercel.app/report">corridor-hills-residence.vercel.app/report</a>
        </div>

        <div class="quick-card">
          <span class="quick-card-badge" style="color: #38bdf8; background: rgba(56, 189, 248, 0.15);">Maintenance Staff</span>
          <h3>Technician Terminal</h3>
          <p>Mobile-first field dispatch, live work timers, skill backlog queues, parts pause & proof-of-work uploads.</p>
          <a href="https://corridor-hills-residence.vercel.app/staff/login">corridor-hills-residence.vercel.app/staff/login</a>
        </div>

        <div class="quick-card">
          <span class="quick-card-badge" style="color: #fbbf24; background: rgba(251, 191, 36, 0.15);">Administration</span>
          <h3>Operations Control</h3>
          <p>Operations KPIs, live SLA radar, digital twin unit mapping, staff roster, CSV imports & audit logging.</p>
          <a href="https://corridor-hills-residence.vercel.app/admin/login">corridor-hills-residence.vercel.app/admin/login</a>
        </div>
      </div>

      <div class="executive-brief-box">
        <h4>Executive Briefing for TUT Operations & Facilities Leadership</h4>
        <p>
          This document provides the operational blueprint, system architecture, role-based access protocols, and pre-configured demo datasets required to evaluate the live Corridor Hills Residence platform. The system is deployed and accessible on any desktop or mobile browser without requiring app store installations.
        </p>
      </div>

      <div class="cover-meta-table">
        <div class="cover-meta-col">
          <span>Live Deployment</span>
          <strong>corridor-hills-residence.vercel.app</strong>
        </div>
        <div class="cover-meta-col">
          <span>Institutional Client</span>
          <strong>TUT eMalahleni Campus</strong>
        </div>
        <div class="cover-meta-col">
          <span>Target Facility</span>
          <strong>Corridor Hills Residence (A–F)</strong>
        </div>
        <div class="cover-meta-col">
          <span>Platform Standard</span>
          <strong>Offline PWA / Zero Downtime</strong>
        </div>
      </div>
    </div>
  </div>

  <!-- ================= PAGE 2: ARCHITECTURE & HOW THE SYSTEM WORKS ================= -->
  <div class="page">
    <div class="page-header">
      <div class="header-left">
        <img src="${logoBase64}" class="header-logo" alt="Logo">
        <span class="header-title">Corridor Hills Residence • System Architecture</span>
      </div>
      <div class="header-right">Section 1: How the System Works</div>
    </div>

    <div class="page-content">
      <div class="section-badge">Operational Blueprint</div>
      <h2 class="section-title">How the System Works: End-to-End Workflow</h2>
      <p class="section-lead">
        The Corridor Hills platform eliminates disconnected spreadsheets and manual logbooks by orchestrating issues across three specialized interfaces tied to a deterministic auto-dispatch engine.
      </p>

      <!-- SVG Architecture Diagram -->
      <div class="diagram-container">
        <div class="diagram-title">
          <span>Three-Tier Segregated Information Architecture</span>
          <span style="font-size: 6.5pt; color: #64748b;">Deterministic Routing Engine</span>
        </div>
        <svg viewBox="0 0 700 220" width="100%" height="150" xmlns="http://www.w3.org/2000/svg" style="font-family: Manrope, sans-serif;">
          <!-- Tier 1: Student -->
          <rect x="10" y="15" width="200" height="85" rx="8" fill="#0A1F3D" stroke="#0050A0" stroke-width="1.5"/>
          <text x="25" y="38" fill="#10A080" font-size="9" font-weight="800" text-transform="uppercase">1. Student Resident (PWA)</text>
          <text x="25" y="55" fill="#ffffff" font-size="11" font-weight="800">Report & Track</text>
          <text x="25" y="72" fill="#94a3b8" font-size="8">• Location Verification (Unit F301C)</text>
          <text x="25" y="86" fill="#94a3b8" font-size="8">• Issue Category, Photos & Offline Draft</text>

          <!-- Central Engine -->
          <rect x="250" y="55" width="200" height="105" rx="8" fill="#061325" stroke="#10A080" stroke-width="2"/>
          <text x="265" y="78" fill="#10A080" font-size="9" font-weight="900" text-transform="uppercase">Automated Dispatch Engine</text>
          <text x="265" y="98" fill="#ffffff" font-size="8.5" font-weight="700">1. Validates Resident Location</text>
          <text x="265" y="114" fill="#ffffff" font-size="8.5" font-weight="700">2. Resolves Required Skill Tag</text>
          <text x="265" y="130" fill="#ffffff" font-size="8.5" font-weight="700">3. Matches Available Artisan</text>
          <text x="265" y="146" fill="#ffffff" font-size="8.5" font-weight="700">4. Starts SLA Timers & Audit Log</text>

          <!-- Tier 2: Staff -->
          <rect x="490" y="15" width="200" height="85" rx="8" fill="#0A1F3D" stroke="#0050A0" stroke-width="1.5"/>
          <text x="505" y="38" fill="#38bdf8" font-size="9" font-weight="800" text-transform="uppercase">2. Maintenance Staff Portal</text>
          <text x="505" y="55" fill="#ffffff" font-size="11" font-weight="800">Work & Resolve</text>
          <text x="505" y="72" fill="#94a3b8" font-size="8">• Push Dispatch Notification</text>
          <text x="505" y="86" fill="#94a3b8" font-size="8">• Live On-Site Timer & Proof Upload</text>

          <!-- Tier 3: Admin -->
          <rect x="250" y="175" width="200" height="38" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.2"/>
          <text x="265" y="191" fill="#0050A0" font-size="8" font-weight="900" text-transform="uppercase">3. Admin Control Centre</text>
          <text x="265" y="204" fill="#334155" font-size="7.5" font-weight="700">SLA Radar • Fleet Location • Unit Twins</text>

          <!-- Arrows -->
          <!-- Student to Engine -->
          <path d="M 210 57 L 250 85" fill="none" stroke="#10A080" stroke-width="2" marker-end="url(#arrow)"/>
          <!-- Engine to Staff -->
          <path d="M 450 85 L 490 57" fill="none" stroke="#10A080" stroke-width="2"/>
          <!-- Staff to Engine (Resolution) -->
          <path d="M 490 85 L 450 115" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,3"/>
          <!-- Engine to Student (Confirmation) -->
          <path d="M 250 115 L 210 85" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,3"/>
          <!-- Engine to Admin -->
          <path d="M 350 160 L 350 175" fill="none" stroke="#0050A0" stroke-width="1.5"/>
        </svg>
      </div>

      <div class="two-col-grid">
        <div class="info-card">
          <div class="info-card-header">
            <span style="color:#10A080; font-weight:900;">01.</span>
            <span>Room-Verified Fault Reporting</span>
          </div>
          <div class="info-card-body">
            Students cannot submit vague tickets. The system verifies their allocated block (A–F), floor (1–4), and unit (e.g. F301) against official records. Issues are categorized into precise problems (power socket, leaking mixer, window latch, lock failure).
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span style="color:#0050A0; font-weight:900;">02.</span>
            <span>Deterministic Auto-Assignment</span>
          </div>
          <div class="info-card-body">
            The platform checks on-duty technician skills. An electrical fault automatically assigns to the certified electrical specialist (e.g., Sipho Mhlongo). If the technician is attending another urgent repair, the ticket enters their queued priority list.
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span style="color:#0050A0; font-weight:900;">03.</span>
            <span>On-Site Execution & Time Tracking</span>
          </div>
          <div class="info-card-body">
            Artisans accept work orders on their mobile terminal. Starting the job starts a live timer. If parts are required, the job pauses with mandatory reasoning (e.g. "Waiting for 15mm copper coupling"). Resolving requires work summary and proof photos.
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-header">
            <span style="color:#10A080; font-weight:900;">04.</span>
            <span>Resident Sign-Off & Admin Governance</span>
          </div>
          <div class="info-card-body">
            Tickets cannot be quietly closed by staff without accountability. Once marked resolved, the resident is prompted to verify: "Yes, it's fixed" or "No, still broken". Administrators monitor live SLA compliance and can override or reassign at any time.
          </div>
        </div>
      </div>

      <div class="callout-box">
        <strong>Governance Principle:</strong> Every operational action (submission, dispatch, pause, resumption, resolution, reopen, and reassignment) writes an immutable record to the audit log with actor ID, timestamp, and justification.
      </div>
    </div>

    <div class="page-footer">
      <span>Corridor Hills Residence Digital Platform</span>
      <span>Confidential • Internal TUT Operations</span>
      <span>Page 2 of 5</span>
    </div>
  </div>

  <!-- ================= PAGE 3: STUDENT RESIDENT EXPERIENCE ================= -->
  <div class="page">
    <div class="page-header">
      <div class="header-left">
        <img src="${logoBase64}" class="header-logo" alt="Logo">
        <span class="header-title">Corridor Hills Residence • Resident Portal</span>
      </div>
      <div class="header-right">Section 2: Student Experience</div>
    </div>

    <div class="page-content">
      <!-- Scenery Accent Header Banner -->
      <div class="scenery-banner">
        <img src="${imgAaaBase64}" alt="Corridor Hills Rainbow After Rain">
        <div class="scenery-overlay"></div>
        <div class="scenery-content">
          <div class="scenery-tag">Student Experience • Campus Horizon</div>
          <h3 class="scenery-heading">Report → Track → Resolve</h3>
          <p class="scenery-desc">
            A frictionless, password-free student interface optimized for mobile devices, enabling students to report issues in under 60 seconds with offline safety.
          </p>
        </div>
      </div>

      <div class="two-col-grid">
        <div>
          <h4 style="font-size: 8.5pt; font-weight: 800; color: #061325; text-transform: uppercase; margin-bottom: 6px;">
            How Students Access & Report
          </h4>
          <div class="step-list">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-text">
                <h5>Navigate to Resident Portal</h5>
                <p>Visit <code>/report</code> or <code>/login</code> on any smartphone or laptop. No password or app store download required.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-text">
                <h5>Confirm Room Allocation</h5>
                <p>Select Unit (e.g. F301), Bedroom (A, B, or C), and enter official 9-digit TUT student number.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-text">
                <h5>Step Through Fault Wizard</h5>
                <p>Select Area (Room/Kitchen/Bath) &rarr; Category (Electrical/Plumbing/Locks) &rarr; Specific Issue &rarr; Take/Attach Photo &rarr; Submit.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">4</div>
              <div class="step-text">
                <h5>Track Live Progress</h5>
                <p>View technician assignment, arrival status, live status timeline, and confirm resolution upon repair.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 style="font-size: 8.5pt; font-weight: 800; color: #061325; text-transform: uppercase; margin-bottom: 6px;">
            Demo Resident Testing Data
          </h4>
          <p style="font-size: 7.5pt; color: #64748b; margin-bottom: 6px;">
            Stakeholders can test resident reporting with the following pre-registered residence allocations:
          </p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Recommended Demo Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Residence Unit</strong></td>
                <td><span class="code-pill">F301</span> (Block F, Floor 3, Unit 01)</td>
              </tr>
              <tr>
                <td><strong>Allocated Bedroom</strong></td>
                <td><span class="code-pill">Room C</span> (Full Location: F301C)</td>
              </tr>
              <tr>
                <td><strong>TUT Student #</strong></td>
                <td><span class="code-pill">220123456</span></td>
              </tr>
              <tr>
                <td><strong>Alternative Test 1</strong></td>
                <td>Unit <span class="code-pill">A101</span> &bull; Room <span class="code-pill">A</span> &bull; Student <span class="code-pill">221849201</span></td>
              </tr>
              <tr>
                <td><strong>Alternative Test 2</strong></td>
                <td>Unit <span class="code-pill">E204</span> &bull; Room <span class="code-pill">B</span> &bull; Student <span class="code-pill">219483029</span></td>
              </tr>
              <tr>
                <td><strong>1-Tap Shortcut</strong></td>
                <td>Click <strong>"Use sample resident (F301C)"</strong> on the login screen to populate all fields with one click.</td>
              </tr>
            </tbody>
          </table>

          <div class="info-card" style="margin-top: 8px; border-left: 3px solid #10A080;">
            <div class="info-card-header">
              <span>Campus Scenery Customization</span>
            </div>
            <div class="info-card-body">
              Residents can tap the camera icon in the bottom corner or header to switch their backdrop between <strong>Evening Glow</strong> (sunset), <strong>After the Rain</strong> (rainbow), and <strong>After Hours</strong> (night lighting). The platform remembers their choice locally.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Corridor Hills Residence Digital Platform</span>
      <span>Confidential • Internal TUT Operations</span>
      <span>Page 3 of 5</span>
    </div>
  </div>

  <!-- ================= PAGE 4: MAINTENANCE STAFF PORTAL ================= -->
  <div class="page">
    <div class="page-header">
      <div class="header-left">
        <img src="${logoBase64}" class="header-logo" alt="Logo">
        <span class="header-title">Corridor Hills Residence • Staff Operations</span>
      </div>
      <div class="header-right">Section 3: Maintenance Staff Portal</div>
    </div>

    <div class="page-content">
      <!-- Scenery Accent Header Banner -->
      <div class="scenery-banner">
        <img src="${imgPic8Base64}" alt="Corridor Hills Night Architecture">
        <div class="scenery-overlay"></div>
        <div class="scenery-content">
          <div class="scenery-tag">Staff Portal • 24/7 Operations</div>
          <h3 class="scenery-heading">Receive → Prioritise → Work → Resolve</h3>
          <p class="scenery-desc">
            A high-contrast, mobile-first interface engineered for on-duty technicians operating under direct sunlight or with gloves, featuring touch targets &ge; 48px and offline job caching.
          </p>
        </div>
      </div>

      <!-- State Machine Diagram -->
      <div class="diagram-container">
        <div class="diagram-title">
          <span>Technician Work Order State Machine</span>
          <span style="font-size: 6.5pt; color: #64748b;">Enforced Verification Path</span>
        </div>
        <svg viewBox="0 0 680 50" width="100%" height="45" xmlns="http://www.w3.org/2000/svg" style="font-family: Manrope, sans-serif;">
          <!-- Node 1: Assigned -->
          <rect x="5" y="10" width="95" height="30" rx="6" fill="#0A1F3D" stroke="#0050A0" stroke-width="1.5"/>
          <text x="52" y="29" fill="#ffffff" font-size="8" font-weight="800" text-anchor="middle">ASSIGNED</text>
          
          <path d="M 100 25 L 125 25" stroke="#10A080" stroke-width="1.5"/>

          <!-- Node 2: Accepted -->
          <rect x="125" y="10" width="95" height="30" rx="6" fill="#0A1F3D" stroke="#10A080" stroke-width="1.5"/>
          <text x="172" y="29" fill="#10A080" font-size="8" font-weight="800" text-anchor="middle">ACCEPTED</text>

          <path d="M 220 25 L 245 25" stroke="#10A080" stroke-width="1.5"/>

          <!-- Node 3: In Progress -->
          <rect x="245" y="10" width="115" height="30" rx="6" fill="#10A080" stroke="#061325" stroke-width="1.5"/>
          <text x="302" y="29" fill="#061325" font-size="8" font-weight="900" text-anchor="middle">IN PROGRESS (TIMER)</text>

          <path d="M 360 25 L 385 25" stroke="#f59e0b" stroke-width="1.5"/>

          <!-- Node 4: Paused / Parts -->
          <rect x="385" y="10" width="125" height="30" rx="6" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.5"/>
          <text x="447" y="29" fill="#92400e" font-size="7.5" font-weight="800" text-anchor="middle">AWAITING PARTS (PAUSE)</text>

          <path d="M 510 25 L 535 25" stroke="#10A080" stroke-width="1.5"/>

          <!-- Node 5: Resolved -->
          <rect x="535" y="10" width="140" height="30" rx="6" fill="#061325" stroke="#10A080" stroke-width="2"/>
          <text x="605" y="29" fill="#ffffff" font-size="8" font-weight="800" text-anchor="middle">RESOLVED (WITH PROOF)</text>
        </svg>
      </div>

      <div class="two-col-grid">
        <div>
          <h4 style="font-size: 8.5pt; font-weight: 800; color: #061325; text-transform: uppercase; margin-bottom: 6px;">
            Demo Staff Roster (1-Tap Login)
          </h4>
          <p style="font-size: 7.5pt; color: #64748b; margin-bottom: 6px;">
            Visit <code>/staff/login</code> to select any active technician:
          </p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Artisan Name</th>
                <th>Specialty</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="code-pill">CH-ST-001</span></td>
                <td><strong>Sipho Mhlongo</strong></td>
                <td>Electrical Specialist</td>
                <td><span class="badge-tag badge-teal">AVAILABLE</span></td>
              </tr>
              <tr>
                <td><span class="code-pill">CH-ST-002</span></td>
                <td><strong>David Khumalo</strong></td>
                <td>Plumbing Specialist</td>
                <td><span class="badge-tag badge-amber">BUSY</span></td>
              </tr>
              <tr>
                <td><span class="code-pill">CH-ST-003</span></td>
                <td><strong>Thabo Ndlovu</strong></td>
                <td>Carpentry & Access</td>
                <td><span class="badge-tag badge-teal">AVAILABLE</span></td>
              </tr>
              <tr>
                <td><span class="code-pill">CH-ST-004</span></td>
                <td><strong>Nomsa Zulu</strong></td>
                <td>Senior Facilities (HVAC)</td>
                <td><span class="badge-tag badge-blue">ON BREAK</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 style="font-size: 8.5pt; font-weight: 800; color: #061325; text-transform: uppercase; margin-bottom: 6px;">
            Key Features to Test on Staff Portal
          </h4>
          <div class="step-list">
            <div class="step-item">
              <div class="step-number" style="background:#10A080;">A</div>
              <div class="step-text">
                <h5>Current Job Card & Live Timer</h5>
                <p>Accept an assigned work order and press "Start Work". A persistent on-site timer records active labor duration.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number" style="background:#f59e0b;">B</div>
              <div class="step-text">
                <h5>Pause Work (Parts / Access Required)</h5>
                <p>Select "Pause Work" and choose a reason: Parts Needed, Access Denied, or Specialist Required. Halts SLA timer with an audit note.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number" style="background:#0050A0;">C</div>
              <div class="step-text">
                <h5>Unassigned Backlog Queue (<code>/staff/queue</code>)</h5>
                <p>Technicians can browse unassigned tickets filtered by their certified trade skills and claim jobs directly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Corridor Hills Residence Digital Platform</span>
      <span>Confidential • Internal TUT Operations</span>
      <span>Page 4 of 5</span>
    </div>
  </div>

  <!-- ================= PAGE 5: ADMIN PORTAL & 5-MIN TEST GUIDE ================= -->
  <div class="page">
    <div class="page-header">
      <div class="header-left">
        <img src="${logoBase64}" class="header-logo" alt="Logo">
        <span class="header-title">Corridor Hills Residence • Administration & Test Guide</span>
      </div>
      <div class="header-right">Section 4 & 5: Admin & Testing</div>
    </div>

    <div class="page-content">
      <div class="section-badge" style="background:#dbeafe; color:#0050A0;">Operations Control Centre</div>
      <h2 class="section-title">Administration Portal & 5-Minute Testing Guide</h2>
      <p class="section-lead">
        Supervisors and facilities leadership access live facility intelligence, reassign technicians with mandatory justifications, and track SLA health across all 6 blocks.
      </p>

      <div class="two-col-grid" style="margin-bottom: 8px;">
        <div>
          <h4 style="font-size: 8.5pt; font-weight: 800; color: #061325; text-transform: uppercase; margin-bottom: 4px;">
            Admin Accounts (<code>/admin/login</code>)
          </h4>
          <table class="data-table">
            <thead>
              <tr>
                <th>Admin ID</th>
                <th>Name & Role</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="code-pill">CH-ADM-001</span></td>
                <td><strong>Lerato Molefe</strong><br><small style="color:#64748b;">Operations Lead</small></td>
                <td><span class="badge-tag badge-purple">SUPER-ADMIN</span> Full Reassign, Staff, Units, Audit</td>
              </tr>
              <tr>
                <td><span class="code-pill">CH-ADM-002</span></td>
                <td><strong>Katlego Dlamini</strong><br><small style="color:#64748b;">Facilities Supervisor</small></td>
                <td><span class="badge-tag badge-blue">DISPATCH</span> Dispatch, Reassign, SLA Watch, Reports</td>
              </tr>
            </tbody>
          </table>

          <h4 style="font-size: 8.5pt; font-weight: 800; color: #061325; text-transform: uppercase; margin-top: 8px; margin-bottom: 4px;">
            Key Admin Modules
          </h4>
          <div style="font-size: 7.2pt; color: #334155; line-height: 1.4;">
            &bull; <strong>SLA Watch Radar:</strong> Real-time countdowns tracking Emergency (&le;2h), Urgent (&le;12h), and Routine (&le;48h) tickets.<br>
            &bull; <strong>Digital Twin Units (<code>/admin/units</code>):</strong> Inspect Block A–F health and repeat fault history.<br>
            &bull; <strong>Immutable Audit Log (<code>/admin/audit</code>):</strong> Complete forensic trail of every single user event.<br>
            &bull; <strong>Resident Directory (<code>/admin/residents</code>):</strong> Search and export/import CSV roster.
          </div>
        </div>

        <div>
          <h4 style="font-size: 8.5pt; font-weight: 800; color: #061325; text-transform: uppercase; margin-bottom: 4px;">
            Recommended 5-Minute Test Sequence
          </h4>
          <div class="step-list">
            <div class="step-item">
              <div class="step-number" style="background:#10A080;">1</div>
              <div class="step-text">
                <h5>Report Issue as Student (1 Min)</h5>
                <p>Go to <code>/report</code>, click <em>"Use sample resident (F301C)"</em>, select <strong>Electrical &rarr; Power Socket Fault</strong>, and submit. Note the ticket reference.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number" style="background:#0050A0;">2</div>
              <div class="step-text">
                <h5>Execute as Technician (2 Mins)</h5>
                <p>Go to <code>/staff/login</code>, tap <strong>Sipho Mhlongo (CH-ST-001)</strong>. See the new job, click <em>"Accept Work Order"</em> &rarr; <em>"Start Work"</em> &rarr; <em>"Complete Work"</em> with summary.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number" style="background:#10A080;">3</div>
              <div class="step-text">
                <h5>Confirm Resolution as Student (1 Min)</h5>
                <p>Return to <code>/requests</code>. Click the ticket &rarr; tap <strong>"Yes, it's fixed"</strong> to close it, or <strong>"No, still broken"</strong> to test reopening escalation.</p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number" style="background:#6366f1;">4</div>
              <div class="step-text">
                <h5>Audit Trail in Admin Centre (1 Min)</h5>
                <p>Go to <code>/admin/login</code>, tap <strong>Lerato Molefe (CH-ADM-001)</strong>. View <code>/admin/audit</code> to see the full timestamped log of the job.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Institutional Sign-off Box -->
      <div style="margin-top: 10px; padding: 10px 14px; border-radius: 8px; background: #061325; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 8.5pt; font-weight: 800; color: #10A080; text-transform: uppercase;">
            Tshwane University of Technology &bull; Corridor Hills Residence
          </div>
          <div style="font-size: 7.2pt; color: #cbd5e1; margin-top: 2px;">
            Platform is live and operational at: <strong>https://corridor-hills-residence.vercel.app</strong>
          </div>
        </div>
        <div style="text-align: right; font-size: 7pt; color: #94a3b8;">
          Deployment Status: <strong style="color: #4ade80;">Active Production</strong><br>
          Generated: September 2026
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>Corridor Hills Residence Digital Platform</span>
      <span>Confidential • Internal TUT Operations</span>
      <span>Page 5 of 5</span>
    </div>
  </div>

</body>
</html>`;

const docsDir = path.join(rootDir, "docs");
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const htmlFilePath = path.join(docsDir, "corridor-hills-stakeholder-guide.html");
const pdfFilePath = path.join(rootDir, "Corridor_Hills_Residence_Stakeholder_Operations_Guide.pdf");
const pdfDocsPath = path.join(docsDir, "Corridor_Hills_Residence_Stakeholder_Operations_Guide.pdf");

fs.writeFileSync(htmlFilePath, htmlContent, "utf8");
console.log("Generated HTML guide at:", htmlFilePath);

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

try {
  console.log("Generating PDF via headless Chrome...");
  execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfFilePath}`,
    htmlFilePath,
  ]);

  if (fs.existsSync(pdfFilePath)) {
    // Also copy to docs/ for permanent archiving
    fs.copyFileSync(pdfFilePath, pdfDocsPath);
    const stats = fs.statSync(pdfFilePath);
    console.log(`SUCCESS! PDF created at: ${pdfFilePath} (${stats.size} bytes)`);
    console.log(`Archived copy at: ${pdfDocsPath}`);
  } else {
    console.error("PDF file was not created.");
  }
} catch (err) {
  console.error("Error during Chrome PDF compilation:", err);
}
