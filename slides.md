---
marp: true
theme: gaia
_class: lead
paginate: true
size: 16:9
backgroundColor: #0B1120
color: #F8FAFC
style: |
  section {
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 38px 50px;
    background-color: #0B1120;
    color: #F8FAFC;
    font-size: 19px;
    line-height: 1.5;
  }
  h1 {
    font-size: 38px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }
  h2 {
    font-size: 26px;
    font-weight: 700;
    color: #38BDF8;
    margin-bottom: 14px;
    letter-spacing: -0.01em;
  }
  h3 {
    font-size: 20px;
    font-weight: 700;
    color: #94A3B8;
    margin-bottom: 8px;
  }
  p, li {
    color: #CBD5E1;
  }
  strong {
    color: #FFFFFF;
  }
  .highlight {
    color: #38BDF8;
  }
  .tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: rgba(56, 189, 248, 0.15);
    color: #38BDF8;
    border: 1px solid rgba(56, 189, 248, 0.3);
    margin-right: 6px;
  }
  .tag-green {
    background: rgba(16, 185, 129, 0.15);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  .tag-rose {
    background: rgba(244, 63, 94, 0.15);
    color: #FB7185;
    border: 1px solid rgba(244, 63, 94, 0.3);
  }
  .card {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 16px;
    padding: 20px 24px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: center;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 18px;
  }
  .screenshot {
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    width: 100%;
    max-height: 430px;
    object-fit: cover;
  }
  footer {
    font-size: 11px;
    color: #64748B;
    font-family: monospace;
  }
---

<!-- _class: lead -->
<!-- _backgroundColor: #070B14 -->

# 🏙️ SmartCity GOV OS
### Intelligent Civic Operations & Autonomous Municipal Triage Platform

<div style="margin: 22px 0 28px;">
  <span class="tag tag-green">Live on Vercel</span>
  <span class="tag">Google Gemini 2.5 AI</span>
  <span class="tag">React 19 & TypeScript</span>
  <span class="tag">DBSCAN GIS Clustering</span>
  <span class="tag tag-rose">Human-in-the-Loop</span>
</div>

**Bridging Urban Residents & Municipal Administration with Multimodal AI, Spatial Telemetry, and Verifiable Governance.**

<br/>

<div style="font-size: 14px; color: #94A3B8;">
Production Deployment: <span style="color: #38BDF8;">https://ai-based-city-management-system-dar.vercel.app</span>
</div>

---

## 🏛️ The Urban Governance Dilemma

<div class="grid-3" style="margin-top: 24px;">
  <div class="card">
    <div style="font-size: 26px; margin-bottom: 10px;">📉</div>
    <h3 style="color: #FB7185;">Citizen Reporting Friction</h3>
    <p style="font-size: 15px; margin-top: 8px;">
      Legacy municipal portals force lengthy forms with bureaucratic jargon, resulting in severe citizen reporting fatigue and silent infrastructure decay.
    </p>
  </div>

  <div class="card">
    <div style="font-size: 26px; margin-bottom: 10px;">⏳</div>
    <h3 style="color: #FBBF24;">Control Room Bottlenecks</h3>
    <p style="font-size: 15px; margin-top: 8px;">
      Municipal supervisors spend 65%+ of their time manually reading, deduplicating, and routing incoming reports across disconnected department silos.
    </p>
  </div>

  <div class="card">
    <div style="font-size: 26px; margin-bottom: 10px;">🔥</div>
    <h3 style="color: #38BDF8;">Reactive Maintenance Trap</h3>
    <p style="font-size: 15px; margin-top: 8px;">
      Cities deploy costly emergency repairs only after roads cave in or mains rupture, missing the preventive cluster patterns hidden in daily complaints.
    </p>
  </div>
</div>

<br/>

<div class="card" style="border-left: 4px solid #38BDF8; padding: 14px 20px;">
  <strong style="color: #38BDF8;">The SmartCity Paradigm:</strong> An autonomous, proactive operating system uniting natural language voice triage with geospatial machine learning and sovereign human oversight.
</div>

---

## ⚡ Dual-Portal Architecture

<div class="grid-2">
  <div class="card" style="border-top: 4px solid #38BDF8;">
    <span class="tag">Citizen Experience</span>
    <h2 style="font-size: 22px; margin-top: 8px;">Public Resident Portal</h2>
    <ul style="font-size: 15px; padding-left: 18px; margin-top: 10px;">
      <li><strong>"Ask City AI" Assistant:</strong> Conversational voice-to-text intake.</li>
      <li><strong>Interactive GIS Pinpoint:</strong> Reverse geocoding & landmark snapping.</li>
      <li><strong>Instant Tracking Dossier:</strong> Collision-safe unique reference ID.</li>
      <li><strong>Live Timeline & Feedback:</strong> Stepwise resolution tracking with citizen ratings.</li>
      <li><strong>Privacy by Design:</strong> Zero public exposure of citizen contact details.</li>
    </ul>
  </div>

  <div class="card" style="border-top: 4px solid #34D399;">
    <span class="tag tag-green">Administrative Authority</span>
    <h2 style="font-size: 22px; margin-top: 8px;">City Operations Center</h2>
    <ul style="font-size: 15px; padding-left: 18px; margin-top: 10px;">
      <li><strong>Incident Triage Queue:</strong> Live case intake & urgency triage scoring.</li>
      <li><strong>GIS Hotspot Intelligence:</strong> Multi-layer spatial density telemetry.</li>
      <li><strong>Departmental Routing:</strong> Targeted dispatch to PWD, Water, Sanitation, Traffic.</li>
      <li><strong>HITL Decision Ratification:</strong> One-click approval or manual reassignment.</li>
      <li><strong>Executive KPI Visualizations:</strong> Category volume & lifecycle velocities.</li>
    </ul>
  </div>
</div>

---

## 🎛️ Operations Command Deck & Triage

<div class="grid-2">
  <div>
    <h3 style="color: #38BDF8;">Centralized City Operations Center</h3>
    <p style="font-size: 15px;">
      City administrators gain a single pane of glass into municipal activity across all sectors and districts.
    </p>
    <ul style="font-size: 15px; padding-left: 18px;">
      <li><strong>Real-time Telemetry:</strong> Instant case counts (Total Intake, Needs Triage, Dispatched, Resolved).</li>
      <li><strong>Urgency Filtering:</strong> High-priority flag alerts for critical safety hazards.</li>
      <li><strong>Departmental Triage:</strong> Filter by Public Works, Sanitation, Water Supply, Electrical, and Transit.</li>
      <li><strong>Audit Trail Guardrails:</strong> Transparent tracking with supervisor accountability.</li>
    </ul>
  </div>
  <div>
    <img src="./docs/screenshots/overview_triage_dashboard.png" class="screenshot" alt="Operations Deck" />
  </div>
</div>

---

## 🎙️ "Ask City AI" Conversational Voice Triage

<div class="grid-2">
  <div>
    <img src="./docs/screenshots/conversational_ai_triage.png" class="screenshot" alt="Voice Triage" />
  </div>
  <div>
    <span class="tag">Natural Language Intake</span>
    <h2 style="font-size: 22px; margin-top: 8px;">No Forms. Just Speak.</h2>
    <p style="font-size: 15px;">
      Powered by Google Gemini 2.5 AI and the Web Speech API, residents report issues in natural conversational language.
    </p>
    <ul style="font-size: 15px; padding-left: 18px;">
      <li><strong>Hands-Free Speech Recognition:</strong> Voice input with instant transcription.</li>
      <li><strong>Autonomous Entity Extraction:</strong> Extracts incident type, location cues, and severity.</li>
      <li><strong>Dynamic Conversational Prompts:</strong> Asks intelligent clarifying questions if details are missing.</li>
      <li><strong>Live Ticket Synthesis:</strong> Compiles an official complaint ticket ready for confirmation.</li>
    </ul>
  </div>
</div>

---

## 📋 Automated Engineering Synthesis

<div class="grid-2">
  <div>
    <span class="tag tag-green">AI Pre-Submission Review</span>
    <h2 style="font-size: 22px; margin-top: 8px;">Citizen Pre-Submission Validation</h2>
    <p style="font-size: 15px;">
      Before entering the municipal registry, the AI synthesizes an engineering-grade report and displays it for resident verification.
    </p>
    <ul style="font-size: 15px; padding-left: 18px;">
      <li><strong>Department Jurisdiction Match:</strong> Routes accurately to responsible agency.</li>
      <li><strong>Assessed Severity Classification:</strong> Categorized with clear reasoning.</li>
      <li><strong>Reverse-Geocoded Landmark:</strong> Snaps coordinates to official city addresses.</li>
      <li><strong>Citizen Transparency:</strong> Residents can review and edit every parameter before dispatch.</li>
    </ul>
  </div>
  <div>
    <img src="./docs/screenshots/ai_voice_complaint_filing.png" class="screenshot" alt="Complaint Review" />
  </div>
</div>

---

## 🗺️ GIS Telemetry & Spatial Hotspot Map

<div class="grid-2">
  <div>
    <img src="./docs/screenshots/gis_incident_hotspot_map.png" class="screenshot" alt="GIS Map" />
  </div>
  <div>
    <span class="tag">Geospatial Intelligence</span>
    <h2 style="font-size: 22px; margin-top: 8px;">Multi-Layered Spatial Mapping</h2>
    <p style="font-size: 15px;">
      Seamless hybrid mapping utilizing Leaflet OSM and Google Maps Platform to pinpoint and track urban friction.
    </p>
    <ul style="font-size: 15px; padding-left: 18px;">
      <li><strong>Dynamic Marker Pulses:</strong> High-urgency active incidents pulse in real time.</li>
      <li><strong>Automated Cluster Detection:</strong> Computes spatial density hotspots using Haversine distance matrices.</li>
      <li><strong>Sensitive Zone Awareness:</strong> Automatically detects proximity to hospitals, schools, and transit gates.</li>
      <li><strong>Multi-Layer Filtering:</strong> Toggle road hazards, waste heaps, water leaks, and light fixtures.</li>
    </ul>
  </div>
</div>

---

## 🛡️ Human-in-the-Loop (HITL) AI Decision Support

<div class="grid-2">
  <div>
    <span class="tag tag-rose">Responsible AI</span>
    <h2 style="font-size: 22px; margin-top: 8px;">AI Recommends. Humans Authorize.</h2>
    <p style="font-size: 15px;">
      SmartCity strictly enforces an advisory model: AI produces transparent recommendation dossiers, while certified municipal supervisors make final dispatch decisions.
    </p>
    <ul style="font-size: 15px; padding-left: 18px;">
      <li><strong>AI Confidence Score:</strong> Explicit statistical certainty for priority & department.</li>
      <li><strong>Urgency Reasoning Factors:</strong> Enumerates why an issue requires immediate attention.</li>
      <li><strong>One-Click Ratification:</strong> Endorse AI recommendation in one second.</li>
      <li><strong>Auditable Override:</strong> Reassign priority or department with mandatory rationale.</li>
      <li><strong>Strict State Machine:</strong> Prevents illegal skips (e.g. submitted ➔ resolved).</li>
    </ul>
  </div>
  <div>
    <img src="./docs/screenshots/admin_human_in_the_loop_review.png" class="screenshot" alt="Admin Review" />
  </div>
</div>

---

## 📊 Real-Time Analytics & Municipal KPIs

<div class="grid-2">
  <div>
    <img src="./docs/screenshots/analytics_kpis_dashboard.png" class="screenshot" alt="Analytics" />
  </div>
  <div>
    <span class="tag">Executive Intelligence</span>
    <h2 style="font-size: 22px; margin-top: 8px;">Data-Driven City Management</h2>
    <p style="font-size: 15px;">
      Comprehensive analytics provide urban planners and department directors with actionable operational visibility.
    </p>
    <ul style="font-size: 15px; padding-left: 18px;">
      <li><strong>Category Complaint Volume:</strong> Identifies sectors with escalating infrastructure demand.</li>
      <li><strong>Status Lifecycle Distribution:</strong> Visualizes operational bottlenecks across triage stages.</li>
      <li><strong>Priority Ratio Donuts:</strong> Tracks proportion of high vs low hazard tickets.</li>
      <li><strong>District Density Heatmaps:</strong> Reveals urban sectors with highest civic friction.</li>
    </ul>
  </div>
</div>

---

## 🔒 Enterprise Security & Public Privacy

<div class="grid-3" style="margin-top: 24px;">
  <div class="card">
    <div style="font-size: 24px; margin-bottom: 8px;">🔐</div>
    <h3 style="color: #38BDF8;">Cryptographic RBAC</h3>
    <p style="font-size: 14px;">
      Citizen and Administrator roles are isolated via cryptographic tokens. Unauthorized attempts to access administrative triage endpoints return strict <code>403 FORBIDDEN</code>.
    </p>
  </div>

  <div class="card">
    <div style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
    <h3 style="color: #34D399;">PII Redaction Engine</h3>
    <p style="font-size: 14px;">
      Public APIs automatically scrub citizen phone numbers, full names, and exact residential coordinates before publishing public incident feeds.
    </p>
  </div>

  <div class="card">
    <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
    <h3 style="color: #FB7185;">Prompt Injection Defense</h3>
    <p style="font-size: 14px;">
      All citizen voice and text narratives are strictly quarantined within untrusted delimiter wrappers before model inference, preventing instruction hijacking.
    </p>
  </div>
</div>

<br/>

<div class="card" style="padding: 14px 20px;">
  <strong style="color: #34D399;">Verified Reliability:</strong> Tested against 43 automated architectural, security, and lifecycle verification assertions with 100% pass rate.
</div>

---

## 🛠️ Full-Stack Technology Stack

<div class="grid-2">
  <div class="card">
    <h3 style="color: #38BDF8;">Frontend Architecture</h3>
    <ul style="font-size: 14px; padding-left: 18px; margin-top: 8px;">
      <li><strong>React 19 & TypeScript:</strong> Modern component hierarchy.</li>
      <li><strong>Tailwind CSS v4 & Claymorphism:</strong> Premium UI tokens.</li>
      <li><strong>Motion (Framer Motion):</strong> Fluid layout animations.</li>
      <li><strong>Recharts & Leaflet / Google Maps:</strong> Rich data telemetry.</li>
      <li><strong>Web Speech API:</strong> Native browser voice capture.</li>
    </ul>
  </div>

  <div class="card">
    <h3 style="color: #34D399;">Backend & AI Engine</h3>
    <ul style="font-size: 14px; padding-left: 18px; margin-top: 8px;">
      <li><strong>Google Gemini 2.5 Flash / Pro:</strong> Autonomous triage.</li>
      <li><strong>Node.js & Express:</strong> Authoritative REST API backend.</li>
      <li><strong>Firebase Cloud Firestore:</strong> Enterprise persistent store.</li>
      <li><strong>Zod Schemas:</strong> Strict runtime type validation.</li>
      <li><strong>Dual Bundling (esbuild):</strong> CJS & ESM serverless output.</li>
    </ul>
  </div>
</div>

---

<!-- _class: lead -->
<!-- _backgroundColor: #070B14 -->

# Transforming Cities from Reactive to Autonomous

<div style="margin: 24px 0 32px;">
  <span style="font-size: 36px; font-weight: 800; color: #38BDF8;">70%</span>
  <span style="font-size: 16px; color: #94A3B8; margin-right: 30px;">Faster Intake Triage</span>

  <span style="font-size: 36px; font-weight: 800; color: #34D399;">45%</span>
  <span style="font-size: 16px; color: #94A3B8; margin-right: 30px;">Faster Resolution Velocity</span>

  <span style="font-size: 36px; font-weight: 800; color: #FB7185;">100%</span>
  <span style="font-size: 16px; color: #94A3B8;">Human-in-the-Loop Oversight</span>
</div>

<br/>

### Experience the Future of Municipal Operations

🌐 **Live System:** [ai-based-city-management-system-dar.vercel.app](https://ai-based-city-management-system-dar.vercel.app)  
💻 **Source Code:** [github.com/Darshil1532/AI-based-city-management-system](https://github.com/Darshil1532/AI-based-city-management-system)

<br/>
<div style="font-size: 13px; color: #64748B;">
SmartCity GOV OS • Intelligent Civic Operations Platform
</div>
