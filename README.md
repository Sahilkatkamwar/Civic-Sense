# Civic Sense

> An intelligent municipal issue reporting, automated duplicate-triaging, and real-time civic accountability platform.

Civic Sense empowers citizens to report urban infrastructure issues—from potholes to dangerous hanging power cables—while enabling municipal authorities to eliminate duplicate noise, automatically triage high-risk hazards, and track resolutions with complete transparency.

---

## 🌟 Key Features

1. **Perceptual Duplicate Detection & Triaging:**
   - Compares photo perceptual hashes (`dHash`) and geographic proximity (within 50 meters).
   - Merges recurring reports into the primary ticket, prevents backlog clutter, and increments citizen urgency count.

2. **Dynamic Priority Scoring:**
   - Computes algorithmic urgency weights based on category severity (1-5), recurring citizen report volume, and days open.
   - Automatically promotes critical hazards (like live electrical cables or open manholes) to emergency status.

3. **Intelligent Municipal Department Routing:**
   - Automatically routes complaints to designated municipal departments:
     - **Roads & Infrastructure:** Potholes, road erosion, cracked surfaces
     - **Solid Waste Management:** Overflowing community bins, garbage dumps
     - **Horticulture & Parks:** Overgrown or fallen trees, hazardous branches
     - **Electrical & Lighting:** Dangling wires, sparking power lines, dark streetlights
     - **Animal Welfare & Control:** Dead animals, carcasses requiring sanitary removal
     - **General Municipal Cell:** Broken sidewalks, missing manholes, public hazards

4. **Issue Explorer & Safety Guidance:**
   - Clear category definitions, practical examples, safety **DOs** and **DON'Ts**, and direct emergency helplines.

5. **Transparent Public Tracking Portal:**
   - No login or registration required. Citizens search their tracking ID (e.g., `CS-2026-00001`).
   - Interactive Leaflet map with GPS marker, photo evidence, and full audit timeline.

6. **Municipal Authority Dashboard:**
   - Streamlined triage view sorted by urgency and priority score.
   - One-click status transitions (`under_review`, `in_progress`, `resolved`, `rejected`) with audit notes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended; tested on v24)
- npm (v9 or higher)

### 1. Installation
Clone the repository and install root dependencies, backend dependencies, and frontend dependencies:

```bash
# Clone the repository
git clone https://github.com/Sahilkatkamwar/Civic-Sense.git
cd Civic-Sense

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Running Locally

Run both the backend API server and frontend client concurrently:

```bash
npm run dev
```

- **Client Application:** `http://localhost:5173`
- **Backend API Server:** `http://localhost:5000`
- **Health Check Endpoint:** `http://localhost:5000/api/health`

### 3. Running Independent Services

```bash
# Backend Server only
npm run dev:server

# Frontend Client only
npm run dev:client
```

### 4. Running Automated Tests & Verifications

```bash
# API contract endpoint tests
npm run test:api

# End-to-end citizen workflow test (Submit -> Duplicate Merge -> Priority Rise -> Track)
npm run test:e2e

# Civic Risk Radar Pitch Demo Data Seed
npm run seed:radar-demo
```

---

## 🛰️ Advanced Civic Intelligence Features

1. **Civic Risk Radar (`/authority/risk-radar`):**
   - Emerging risk detection via transitive spatial clustering (DBSCAN single-link within 150m).
   - Fully explainable 0–100 risk score breakdown based on severity weight, citizen report density, 90-day recurrence, and unresolved time.
   - Interactive Leaflet map with non-color-only risk level badges, deterministic inspect-first recommendation, and statutory disclaimer.

2. **Civic Alerts & Advisories (`/alerts` & `/authority/alerts`):**
   - Official municipal announcements targeted by administrative ward or published city-wide.
   - Multilingual citizen display (English, हिन्दी, मराठी) with automated draft translation assistance via Grok.
   - Anonymous unread tracking with navbar notification bell badge and honest in-app view engagement metrics.
   - Official administrative portal (`/authority/login`) for scheduling, duration extensions, cancellations, and resolution notices.

3. **Civic Assistant:**
   - Always-accessible floating assistant (bottom-right) powered by xAI Grok API (`POST /api/chat`).
   - Grounded in live verified database facts for complaint tracking IDs (`CS-YYYY-XXXXX`) and active ward advisories.
   - Rate-limited (20 req/min/IP) with graceful offline fallback when API key is unconfigured.

### New Environment Variables

Add to `server/.env` (refer to `.env.example`):
```env
GROK_API_KEY=your_xai_api_key_here
GROK_API_URL=https://api.x.ai/v1/chat/completions
GROK_MODEL=grok-4
JWT_SECRET=change_this_to_a_long_random_string
OFFICIAL_EMAIL=officer@civicsense.local
OFFICIAL_PASSWORD=change_me_before_demo
RISK_RADIUS_METERS=150
RISK_MIN_SIGNALS=3
```

---

## 👥 The Team

- **Sahil Katkamwar** — Team Lead, Architecture, Database Design & API Routing
- **Sujal** — Issue Explorer Module, Category Catalog & Guidance Components
- **Tanush** — Report Submission Module, Duplicate Handling & Real-time Tracking
- **Gagare** — Content Architecture, Seed Demo Data, QA Testing & Documentation
