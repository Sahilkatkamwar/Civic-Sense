# SAHIL (Team Lead) - Foundation, Home Page & Integration

**Project:** Civic Sense - report municipal issues, route them to authorities, track progress.
**Your order:** YOU GO FIRST. Sujal, Tanush and Gagare start only after you finish **Part 1** and push it.
**Role:** Owner of structure, shared data model, API contract, home page, integration, deployment and final demo.

---

## Team & Work Order

| Order | Member | File | Scope |
|-------|--------|------|-------|
| 1 | Sahil | sahil.md | Foundation, home, integration (this file) |
| 2 | Sujal | sujal.md | Issue explorer module (browse and select an issue) |
| 3 | Tanush | tanush.md | Complaint submission, duplicate detection, priority, tracking |
| 4 | Gagare | gagare.md | Content, seed data, testing, demo script (lightest load) |

Sujal and Tanush can work in parallel once Part 1 is pushed. Gagare can start after Sujal's categories exist.

---

## Tech Stack (keep it simple)

- **Frontend:** React + Vite + React Router + plain CSS (or Tailwind)
- **Backend:** Node.js + Express
- **Database:** SQLite (`better-sqlite3`) - zero setup, a single file
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **Git:** one repo, one branch per person (`sahil`, `sujal`, `tanush`, `gagare`), merge to `main` through Sahil

---

## PART 1 - Do this first (before anyone else starts)

### 1. Create the project structure

```
civic-sense/
├── client/
│   └── src/
│       ├── App.jsx                 # Sahil - routes
│       ├── pages/Home.jsx          # Sahil
│       ├── components/             # Sahil - Navbar, Footer, shared UI
│       ├── modules/
│       │   ├── issues/             # Sujal
│       │   └── report/             # Tanush
│       └── content/                # Gagare - text content, guidance
├── server/
│   ├── index.js                    # Sahil
│   ├── db/
│   │   ├── schema.sql              # Sahil
│   │   └── seed.js                 # Gagare fills data, Sahil creates the file
│   ├── routes/
│   │   ├── categories.js           # Sujal
│   │   └── complaints.js           # Tanush
│   └── services/                   # Tanush - duplicate, priority, routing
├── uploads/                        # saved complaint photos
└── README.md                       # Gagare
```

### 2. Shared data model (do NOT change after handoff without telling the team)

**categories**
| field | type | note |
|-------|------|------|
| id | TEXT PK | `pothole`, `garbage`, `tree`, `cable`, `animal`, `other` |
| name | TEXT | display name |
| icon | TEXT | emoji or icon name |
| description | TEXT | short summary |
| guidance | TEXT | what to do and what to avoid |
| severity_weight | INTEGER | 1-5, used for priority |
| authority_id | TEXT FK | default department |

**authorities**
| field | type |
|-------|------|
| id | TEXT PK (e.g. `roads`, `sanitation`, `garden`, `electrical`, `animal_control`, `general`) |
| name | TEXT |
| department | TEXT |

**complaints**
| field | type | note |
|-------|------|------|
| id | TEXT PK | format `CS-2026-00001` |
| category_id | TEXT FK | |
| description | TEXT | |
| photo_path | TEXT | |
| photo_hash | TEXT | perceptual hash (dHash) |
| latitude / longitude | REAL | |
| address_text | TEXT | optional |
| status | TEXT | `submitted` / `under_review` / `in_progress` / `resolved` / `rejected` |
| report_count | INTEGER | starts at 1, grows with duplicates |
| duplicate_of | TEXT | complaint id if merged, else NULL |
| authenticity | TEXT | `verified` / `suspicious` / `duplicate` |
| priority_score | INTEGER | |
| priority_level | TEXT | `low` / `medium` / `high` / `critical` |
| authority_id | TEXT FK | |
| created_at / updated_at | DATETIME | |

**status_history**
| field | type |
|-------|------|
| id | INTEGER PK |
| complaint_id | TEXT FK |
| status | TEXT |
| note | TEXT |
| created_at | DATETIME |

### 3. API contract (so everyone builds against the same thing)

| Method | Endpoint | Owner | Purpose |
|--------|----------|-------|---------|
| GET | `/api/categories` | Sujal | List all categories |
| GET | `/api/categories/:id` | Sujal | Category details and guidance |
| POST | `/api/complaints` | Tanush | Submit complaint (multipart: photo + fields) |
| GET | `/api/complaints/:id` | Tanush | Track one complaint |
| GET | `/api/complaints` | Tanush | List complaints (filters: status, category, sort=priority) |
| PATCH | `/api/complaints/:id/status` | Tanush | Authority updates status |
| GET | `/api/authority/complaints` | Tanush | Authority queue sorted by priority |

### 4. Build the shell

- [ ] Init `client` (Vite + React) and `server` (Express) and make both run
- [ ] Create `schema.sql` and an empty `seed.js` that runs on server start
- [ ] Set up React Router with these routes:
  - `/` Home (Sahil)
  - `/issues` and `/issues/:categoryId` (Sujal)
  - `/report` and `/report/:categoryId` (Tanush)
  - `/track` and `/track/:complaintId` (Tanush)
  - `/authority` Authority dashboard (Tanush)
- [ ] Add shared Navbar: Home, Issues, Report, Track, Authority
- [ ] Define a basic theme (colors, fonts, button styles) in one CSS file so all modules look like one product
- [ ] Add placeholder pages so every route loads without crashing
- [ ] Write `.env.example` and push to `main`

### 5. Handoff
- [ ] Post in the team chat: "Part 1 done, pull `main`, read your .md file"
- [ ] Share the shared theme file and tell everyone to use it

**Part 1 deliverable:** the app runs, all routes load, DB tables exist, and API contract is frozen.

---

## PART 2 - Home Page (while the others work)

- [ ] Hero section: app name, one-line pitch, two big buttons: **Report an Issue** and **Track Complaint**
- [ ] Live stats strip pulled from the API: total reports, resolved, in progress
- [ ] "Issue types" preview: show the category cards (reuse Sujal's card component)
- [ ] "How it works" in 4 steps: Spot, Snap, Submit, Track
- [ ] "Top priority issues" list: top 3 complaints by priority score (from `GET /api/complaints?sort=priority`)
- [ ] Mini map showing recent complaints as pins (Leaflet)
- [ ] Footer with team name and hackathon info

**Deliverable:** a home page that feels like the front door of a real product.

---

## PART 3 - Integration (after Sujal and Tanush finish)

- [ ] Merge `sujal` and `tanush` branches into `main`; resolve conflicts
- [ ] Connect flow end to end: Home -> Issues -> pick category -> Report form (category pre-selected) -> Confirmation -> Track
- [ ] Check the category choice carries from Sujal's module into Tanush's form (route param `:categoryId`)
- [ ] Make navbar, buttons, spacing and error messages consistent
- [ ] Add loading states and friendly error pages (404, network error)
- [ ] Make it mobile-friendly (citizens report from phones)
- [ ] Persistence check: restart server and confirm data stays
- [ ] Review Gagare's seed data and content for correctness

---

## PART 4 - Deployment & Demo

- [ ] Deploy frontend (Vercel/Netlify) and backend (Render/Railway); set env vars
- [ ] Test the live URL on a phone
- [ ] Seed the live DB with 15-20 realistic demo complaints in different statuses
- [ ] Run Gagare's demo script twice
- [ ] Prepare a 3-minute pitch: problem -> solution -> live demo -> unique features (duplicate detection, priority, tracking) -> future scope
- [ ] Record a backup demo video in case the internet fails

---

## Bonus Features (only if time remains)

- [ ] Dark mode
- [ ] Hindi/Marathi language toggle (content strings live in `client/src/content/`)
- [ ] Share complaint status link on WhatsApp
- [ ] Upvote ("I face this too") button that increases `report_count` without a new photo

---

## Definition of Done for Phase 1

- [ ] One working app combining all modules
- [ ] A citizen can pick an issue, submit a complaint with photo and location, get a complaint ID, and follow status
- [ ] Duplicate complaints merge and raise priority
- [ ] Authority view shows complaints sorted by priority and can update status
- [ ] Deployed link plus demo ready
