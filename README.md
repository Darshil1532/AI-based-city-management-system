<div align="center">

# 🏙️ SmartCity GOV OS
### Intelligent Civic Operations & Autonomous Municipal Triage Platform

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-based-city-management-system-dar.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini AI](https://img.shields.io/badge/AI%20Engine-Gemini%202.5%20%2F%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-43%20Passed-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](#-test-suite--quality-assurance)

<br/>

**A next-generation civic operating system bridging urban residents and city administration.**  
Featuring conversational voice triage, automated GIS spatial incident clustering, real-time telemetry analytics, and human-in-the-loop AI decision support.

[Explore Live Platform](https://ai-based-city-management-system-dar.vercel.app) • [View Architecture](#-system-architecture) • [Quickstart Guide](#-quick-start) • [Feature Matrix](#-core-capabilities)

---

</div>

<br/>

## 📸 Visual Showcase & Platform Tour

### 1. 🎛️ Incident Triage & Municipal Dispatch Operations Center
The unified administrative command deck provides city supervisors with real-time insight into incoming citizen complaints, urgency signals, and cross-departmental dispatch status.

<div align="center">
  <img src="./docs/screenshots/overview_triage_dashboard.png" alt="Overview & Triage Dashboard" width="95%" style="border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.12);" />
  <p><em>Real-time case triage metrics, status filters, high-urgency notifications, and departmental incident queues.</em></p>
</div>

<br/>

### 2. 🗺️ City Incident & Hotspot GIS Telemetry Map
High-resolution dual-engine mapping (Leaflet OSM + Google Maps) dynamically evaluates complaint coordinates and computes spatial density hotspots before infrastructure collapses occur.

<div align="center">
  <img src="./docs/screenshots/gis_incident_hotspot_map.png" alt="City Incident & Hotspot GIS Map" width="95%" style="border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.12);" />
  <p><em>Geospatial layer controls, cluster radii visualization, landmark snapping, and multi-district telemetry.</em></p>
</div>

<br/>

### 3. 📊 Real-Time Civic Analytics & KPI Intelligence
Interactive data visualizations tracking category volume distribution, complaint lifecycle resolution velocities, priority density, and district concentration.

<div align="center">
  <img src="./docs/screenshots/analytics_kpis_dashboard.png" alt="Analytics & KPIs Dashboard" width="95%" style="border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.12);" />
  <p><em>Comprehensive municipal KPIs with sector breakdown charts, donut status indicators, and horizontal density bars.</em></p>
</div>

<br/>

### 4. 🎙️ AI Voice & Multimodal Conversational Triage ("Ask City AI")
Citizens can report complex issues in plain conversational language or voice. The embedded civic intelligence agent extracts incident categories, assesses urgency, geolocates coordinates, and constructs structured municipal tickets.

<div align="center">
  <img src="./docs/screenshots/conversational_ai_triage.png" alt="Voice Triage & Automated Complaint Filing" width="95%" style="border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.12);" />
  <p><em>Speech-to-text voice input, natural language triage, instant ticket drafting, and live progress notifications.</em></p>
</div>

<br/>

### 5. 📋 Automated Engineering Synthesis & Instant Filing
Before ticket registration, the AI presents a comprehensive technical synthesis including jurisdiction matching, duplicate checking, and location confirmation for citizen ratification.

<div align="center">
  <img src="./docs/screenshots/ai_voice_complaint_filing.png" alt="AI Generated Complaint Review" width="95%" style="border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.12);" />
  <p><em>Citizen pre-submission review panel with automated category assignment, severity grading, and reverse-geocoded tags.</em></p>
</div>

<br/>

### 6. 🛡️ Human-in-the-Loop (HITL) Administrative Review & Ratification
AI recommendations serve strictly as advisory decision-support. Municipal officials retain sovereign authority to ratify suggestions, override priority, or assign custom dispatch crews with recorded audit logs.

<div align="center">
  <img src="./docs/screenshots/admin_human_in_the_loop_review.png" alt="Admin Human-in-the-Loop Review" width="95%" style="border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.12);" />
  <p><em>Lifecycle stepper with one-click AI Ratification, Manual Override controls, and field crew assignment.</em></p>
</div>

---

<br/>

## 🌟 Core Capabilities

| Capability | Technical Implementation | Practical Benefit |
| :--- | :--- | :--- |
| **🎙️ Conversational Voice Triage** | Web Speech API + Gemini AI + Regex fallback | Eliminates bureaucratic forms; enables accessible reporting via voice or freeform text. |
| **📍 DBSCAN Spatial Hotspots** | Haversine distance matrix with affinity clustering | Discovers hidden infrastructure failure patterns (e.g., repeating pipe bursts or potholes) in real time. |
| **🤖 Transparent AI Dossiers** | Structured JSON schema validation with Zod | Provides explainable reasoning, confidence scores, and safety zone alerts for every ticket. |
| **🔒 Public Privacy Safeguard** | Server-side cryptographic redaction | Public feeds redact citizen phone numbers, names, and precise residential GPS coordinates. |
| **🏢 Human-in-the-Loop (HITL)** | Four-stage lifecycle state machine | Prevents automated administrative hallucination; mandates human supervisor ratification. |
| **⚡ Multi-Tier Persistence** | Express Server + Firestore Admin SDK + Local Cache | Guarantees instant offline-first responsiveness with cloud data permanence. |

---

<br/>

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph CitizenClient["Resident Citizen Portal"]
        A1["Citizen Dashboard"] --> A2["Report Issue Form"]
        A1 --> A3["Ask City AI (Voice/Chat)"]
        A1 --> A4["Track Incident Status"]
    end

    subgraph AdminClient["City Operations Center"]
        B1["Overview & Triage Deck"] --> B2["Complaint Detail & HITL Review"]
        B1 --> B3["GIS Incident & Hotspot Map"]
        B1 --> B4["Analytics & KPI Visualizations"]
    end

    subgraph AIService["AI Decision Support Engine"]
        C1["Google Gemini AI API"]
        C2["Local Deterministic AI Engine"]
        C3["Spatial Proximity & Cluster Analyzer"]
    end

    subgraph BackendAPI["Authoritative Civic Backend (Express + Node.js)"]
        D1["Auth & Cryptographic RBAC"]
        D2["Complaint State Machine"]
        D3["Hotspot Recalculation Service"]
        D4["Privacy & PII Redaction Filter"]
    end

    subgraph Persistence["Authoritative Persistence"]
        E1[("Firebase Cloud Firestore")]
        E2[("Memory & Temp Cache Failover")]
    end

    CitizenClient -->|Intake Payload| BackendAPI
    AdminClient -->|Review Decisions / Dispatches| BackendAPI
    BackendAPI <-->|Triage & Hypotheses| AIService
    BackendAPI <-->|Encrypted Read/Write| Persistence
```

---

<br/>

## 🛡️ Security & Privacy Engineering

- **Role-Based Access Control (RBAC):** Administrative endpoints (`/api/admin/*`) strictly verify cryptographic tokens. Any attempt by citizen roles to access operational triage queues is rejected with `403 FORBIDDEN`.
- **Public Privacy & PII Redaction:** The public-facing `/api/complaints` feed automatically strips citizen phone numbers, names, and truncates geographic coordinates to protect residential privacy.
- **Strict State Machine Lifecycle:** Incidents transition sequentially through `submitted` ➔ `assigned` ➔ `in_progress` ➔ `resolved`. Direct illegal transitions are blocked unless accompanied by an explicit supervisor override rationale.
- **Prompt Injection Defense:** Citizen input is strictly encapsulated within untrusted demarcation wrappers before being passed to Google Gemini models.

---

<br/>

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` recommended
- **npm** or **bun**

### 1. Clone the Repository
```bash
git clone https://github.com/Darshil1532/AI-based-city-management-system.git
cd AI-based-city-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Google Gemini AI API (If omitted, local high-fidelity AI engine activates)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Google Maps Platform API Key (Falls back to Leaflet OSM)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Firebase Service Account for Cloud Persistence
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=your-service-account-email
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to interact with both the Citizen and Admin portals.

---

<br/>

## 🧪 Test Suite & Quality Assurance

The codebase includes an automated verification suite covering RBAC boundaries, PII redactions, lifecycle state transitions, rate limiters, and prompt injection defense:

```bash
npm test
```

```text
✔ Smart City Architecture & Security Verification Suite (43 tests)
  ✔ Authentication & RBAC Boundary (8 tests)
  ✔ Privacy & Ownership Boundary (4 tests)
  ✔ Complaint Lifecycle State Machine (5 tests)
  ✔ AI Pipeline & Prompt Injection Defense (4 tests)
  ✔ Firestore Security Rules Invariants (2 tests)
  ✔ Rate Limiter & Bounded Protection (1 test)
  ✔ Production Fail-Fast & Persistence Handlers (2 tests)
  ✔ Complete API Integration Flows (3 tests)
```

---

<br/>

## 📦 Build & Deployment

To generate optimized production bundles for frontend and serverless environments:

```bash
npm run build
```

This compiles:
1. **Frontend Assets:** Vite-optimized HTML, CSS, and JS chunks in `dist/`.
2. **Authoritative Node Server:** Bundled in `dist/server.cjs`.
3. **Vercel Serverless Function:** Built cleanly in `api/index.js` for edge-compatible cloud deployment.

---

<br/>

## 🏛️ Municipal Departments Supported

- 🚧 **Public Works Department (PWD)** — Potholes, road cave-ins, footpaths, asphalt erosion.
- 🧹 **Sanitation Department** — Waste container overflows, open dumping, market biohazard clearing.
- 💧 **Water Supply & Sewerage Board** — Pipe breaches, contaminated supplies, drainage blocks.
- 💡 **Electrical & Street Lighting** — Dark corridors, flickering fixtures, transformer faults.
- 🚦 **Traffic & Transit Authority** — Signal outages, congestion bottlenecks, illegal parking.

---

<div align="center">

Made Darshil Jha for Smarter, Safer, and Citizen-Centric Municipalities.

</div>
