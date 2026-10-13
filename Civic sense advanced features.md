# Civic Sense - Advanced Features Implementation Brief

**For:** AI coding agent (Antigravity). Read this whole file before writing any code.
**Project:** Civic Sense, an existing working app where citizens report municipal issues, the system detects duplicates, calculates priority, routes to an authority, and tracks status.
**Task:** Add THREE features to the existing app without changing the current interface:

1. **Civic Risk Radar** - explainable emerging-risk detection from clustered complaints, shown on a map for officials.
2. **Civic Alerts** - official announcements targeted by ward, schedulable, with a citizen notification center.
3. **Civic Assistant** - a floating chatbot (bottom-right) powered by the Grok API (xAI).

---

## 0. NON-NEGOTIABLE RULES

1. **Do not change the existing look and feel.** Do not restyle, move, rename or refactor existing pages, components, colors, fonts, spacing or CSS. Existing screens must look pixel-identical after your work, except for the small additions listed in section 1.
2. **Additive only.** Create new files and folders. Edit existing files ONLY where section 1 explicitly allows it, and only by adding lines.
3. **Keep the existing stack.** The app uses React + Vite + React Router + plain CSS on the frontend and Node + Express + SQLite (`better-sqlite3`) on the backend. Do NOT introduce MongoDB, Tailwind, TypeScript, a new UI library, or a different router. (The original idea mentioned MongoDB and Tailwind; they are deliberately NOT used because the app already runs on SQLite and plain CSS, and swapping would force interface and data changes.)
4. **Never expose secrets to the browser.** The Grok API key and JWT secret live only in `server/.env`. All Grok calls go through the Express backend.
5. **Honest wording.** Risk Radar produces an *estimate* from a transparent formula using reported data. Never call it prediction, AI-proven, or guaranteed. Show a disclaimer on the page.
6. **Don't break existing behavior.** Complaint submission, duplicate detection, priority scoring, tracking and the authority dashboard must keep working exactly as before.
7. **Scope discipline.** Build only what this file describes. No extra features.
8. Work on a new git branch `feature/radar-alerts-chat` and commit after each phase.

---

## 1. Existing Files You May Edit (additions only)

| File | Allowed change |
|------|----------------|
| `client/src/App.jsx` | Add new `<Route>` entries listed below, and mount `<ChatWidget />` once at the root (outside any page) |
| Existing Navbar component in `client/src/components/` | Add ONE nav link "Alerts" and ONE bell icon with unread badge, using the existing link styles |
| Existing Authority Dashboard page | Add ONE button/link "Open Risk Radar" and ONE link "Manage Alerts" at the top, using existing button styles |
| `server/index.js` | Mount the new routers, run the new migration on startup, start the alert scheduler |
| `server/package.json`, `client/package.json` | Add new dependencies only |
| `.env.example` | Add new variables |

Anything not in this table must not be modified. If you believe another edit is required, stop and explain why instead of doing it.

---

## 2. New Environment Variables

Add to `server/.env.example` (and tell the user to fill real values in `server/.env`, which must be git-ignored):

~~~
GROK_API_KEY=your_xai_api_key_here
GROK_API_URL=https://api.x.ai/v1/chat/completions
GROK_MODEL=grok-4
JWT_SECRET=change_this_to_a_long_random_string
OFFICIAL_EMAIL=officer@civicsense.local
OFFICIAL_PASSWORD=change_me_before_demo
RISK_RADIUS_METERS=150
RISK_MIN_SIGNALS=3
~~~

Note for the agent: xAI's API is OpenAI-compatible (chat completions format). Before coding the chat service, check the current xAI documentation at https://docs.x.ai for the exact endpoint and current model names, and keep both configurable through the env variables above. Do not hardcode them.

---

## 3. New Dependencies

Server: `jsonwebtoken`, `bcryptjs`, `express-rate-limit`, `node-cron` (or use `setInterval`; either is fine), `dotenv` if not already present.
Client: none required (Leaflet and React Router are already installed). Reuse existing `react-leaflet`.

---

## 4. Database Changes (additive migration)

Create `server/db/migrations/002_radar_alerts.sql` and run it on server start using `CREATE TABLE IF NOT EXISTS`. Do NOT alter existing tables.

~~~sql
-- Wards (used for alert targeting)
CREATE TABLE IF NOT EXISTS wards (
  id TEXT PRIMARY KEY,            -- e.g. ward_01
  name TEXT NOT NULL,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL
);

-- Municipal officials (role-based access)
CREATE TABLE IF NOT EXISTS officials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'official',   -- 'official' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,              -- water_cut | power_cut | road_closure | waste_schedule | maintenance | safety
  severity TEXT NOT NULL DEFAULT 'info',   -- info | warning | critical
  title_en TEXT NOT NULL,
  title_hi TEXT,
  title_mr TEXT,
  body_en TEXT NOT NULL,
  body_hi TEXT,
  body_mr TEXT,
  all_wards INTEGER NOT NULL DEFAULT 0,    -- 1 = city-wide
  status TEXT NOT NULL DEFAULT 'scheduled',-- draft | scheduled | active | cancelled | resolved | expired
  starts_at DATETIME NOT NULL,             -- when it becomes visible
  ends_at DATETIME,                        -- when it expires (optional)
  created_by INTEGER REFERENCES officials(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Which wards an alert targets
CREATE TABLE IF NOT EXISTS alert_wards (
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  ward_id TEXT NOT NULL REFERENCES wards(id),
  PRIMARY KEY (alert_id, ward_id)
);

-- Change log shown to citizens ("Extended until ...", "Cancelled")
CREATE TABLE IF NOT EXISTS alert_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Anonymous read tracking (no citizen accounts exist)
CREATE TABLE IF NOT EXISTS alert_reads (
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,                 -- random UUID stored in the browser
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (alert_id, client_id)
);
~~~

Seed (idempotent, in a new file `server/db/seed-features.js`, called after the existing seed):
- 6 wards with realistic names and center coordinates **near the coordinates already used by the existing demo complaints** (read the existing seed to find the city center; do not invent a different city).
- One official from `OFFICIAL_EMAIL` / `OFFICIAL_PASSWORD` (bcrypt hash). Skip if it already exists.

---

## 5. FEATURE 1 - Civic Risk Radar

### 5.1 Purpose
Turn scattered complaints into one actionable insight for officials: where problems are clustering, how risky each cluster is, why, and what to inspect first.

Demo story: five scattered pothole reports -> one emerging risk -> one recommended site visit.

### 5.2 Backend files
- `server/services/riskRadar.js` - clustering and scoring (pure functions, easy to test)
- `server/routes/riskRadar.js` - endpoints

### 5.3 Clustering algorithm
Input: all complaints where `status` is NOT `resolved` or `rejected` and `duplicate_of` IS NULL (use `report_count` as the number of citizen signals).

1. Group by `category_id`.
2. Inside each category, build clusters with single-link expansion (DBSCAN-style): two complaints are neighbors if their Haversine distance is <= `RISK_RADIUS_METERS` (default 150 m). Expand neighbors transitively (BFS) until no more are found.
3. For each cluster compute:
   - `signals` = sum of `report_count` in the cluster
   - `complaintCount` = number of complaints
   - `center` = average latitude/longitude
   - `radius` = max distance from center to any member (minimum 40 m for display)
   - `oldestOpenDays` = age in days of the oldest open complaint
   - `recurrence` = number of complaints of the same category with status `resolved` within `RISK_RADIUS_METERS` of the center and created in the last 90 days
4. Keep only clusters with `signals >= RISK_MIN_SIGNALS` (default 3).
5. Reuse the existing `haversine/distanceMeters` helper from `server/services/` if one exists (check `duplicate.js`); do not duplicate logic unnecessarily. Import it, do not modify it.

### 5.4 Risk score (0-100, fully explainable)

| Factor | Max points | Rule |
|--------|-----------|------|
| Severity | 25 | `severity_weight` of the category (1-5) x 5 |
| Report density | 30 | `min(30, signals x 6)` |
| Recurrence | 20 | `min(20, recurrence x 7)` |
| Time unresolved | 25 | `min(25, oldestOpenDays x 3)` |

Level thresholds: **0-29 low, 30-54 medium, 55-74 high, 75-100 critical.**

Every cluster response MUST include a `factors` array that explains the score in plain language, for example:

~~~json
{
  "factors": [
    { "name": "Severity", "points": 20, "max": 25, "explanation": "Potholes carry a severity weight of 4 out of 5." },
    { "name": "Report density", "points": 30, "max": 30, "explanation": "5 citizen reports within 150 m." },
    { "name": "Recurrence", "points": 7, "max": 20, "explanation": "1 similar issue was resolved here in the last 90 days." },
    { "name": "Time unresolved", "points": 9, "max": 25, "explanation": "Oldest open report is 3 days old." }
  ]
}
~~~

### 5.5 Recommended action
Deterministic templates by category and level, returned as `recommendation` (string) and `inspectFirst` (the complaint id with the highest `report_count`, ties broken by oldest). Examples:
- pothole + high/critical: "Schedule a site inspection within 48 hours and assess whether the stretch needs resurfacing rather than patching."
- cable + any: "Dispatch the electrical team for a safety inspection. Treat as urgent."
- garbage + high: "Review the collection schedule and add a pickup point or extra round for this area."
- tree, animal, other: write sensible equivalents.
Keep templates in `server/services/riskRecommendations.js`.

### 5.6 API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/risk-radar` | Returns `{ generatedAt, radiusMeters, clusters: [...] }` sorted by score desc. Optional query: `category`, `minLevel` |
| GET | `/api/risk-radar/:clusterId` | One cluster with member complaints. `clusterId` is deterministic (e.g. `category-<sorted member ids hash>`) |

Compute on request (no caching needed for the hackathon). Like the existing authority dashboard, these read endpoints are not login-protected; add a comment noting that role-based protection is future scope.

### 5.7 Frontend (new files only)
Folder: `client/src/modules/radar/`
- `RiskRadarPage.jsx` - route `/authority/risk-radar`
- `RiskMap.jsx` - Leaflet map; each cluster is a circle at `center` with the cluster `radius`, colored by level (use distinct colors AND a text badge so it is not color-only); clicking selects it
- `ClusterPanel.jsx` - side panel (bottom sheet on mobile) showing: level badge, score out of 100, the factor breakdown as small bars with explanations, recommendation, "Inspect first" complaint link (to the existing complaint detail/track view), member complaints list with thumbnails
- `radar.css` - styles scoped with the prefix `.cs-radar-`; reuse existing theme CSS variables where they exist, with fallbacks
- Top filters: category, minimum level
- Disclaimer line at the bottom: "Risk levels are estimates calculated from reported data using the formula above. They are not predictions of accidents."
- A "How is this calculated?" collapsible that lists the four factors and thresholds
- Empty state: "No emerging risks right now."
- Loading and error states

### 5.8 Demo seed (important for the pitch)
Create `server/db/seed-radar-demo.js` plus npm script `seed:radar-demo`. It must be idempotent (mark rows via a description prefix like "[demo]" and skip if present). It inserts DIRECTLY into the database (bypassing the duplicate service so the rows stay separate):
- 5 pothole complaints within about 120 m of each other, created over the last 3 days, statuses `submitted` / `under_review`, each with a different `photo_hash` and photo path (reuse an existing placeholder image from `uploads/` or generate tiny placeholder files)
- 1 resolved pothole complaint nearby from about 40 days ago (drives the recurrence factor)
- A second smaller cluster of 3 garbage complaints elsewhere
- A third cluster of 2 hanging-cable complaints (below the minimum signals unless `report_count` is raised; set one to `report_count = 2` so it qualifies)
- A few isolated complaints that should NOT form clusters
Compute `priority_score` / `priority_level` using the existing `priority.js` service.

---

## 6. FEATURE 2 - Civic Alerts

### 6.1 Purpose
Let officials publish targeted official announcements (water cuts, power cuts, road closures, waste schedules, maintenance, safety warnings) and let citizens see them in a notification center.

### 6.2 Backend files
- `server/routes/auth.js` - official login
- `server/middleware/auth.js` - `requireOfficial` (verifies JWT, attaches `req.official`)
- `server/routes/alerts.js` - alert endpoints
- `server/routes/wards.js` - ward list
- `server/services/alertScheduler.js` - status transitions

### 6.3 Authentication (minimal role-based access)
- `POST /api/auth/login` with `{ email, password }` -> `{ token, official: { id, name, role } }`. Compare with bcrypt. JWT expiry 8 hours, signed with `JWT_SECRET`. Return the same generic error for wrong email or wrong password.
- `GET /api/auth/me` -> current official.
- Citizens never log in. Only the alert-management write endpoints require the token.

### 6.4 Alert API

Public (no login):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/wards` | List wards |
| GET | `/api/alerts?ward=<wardId>` | Active alerts for that ward plus city-wide ones, newest first. Include `updates[]`. Without `ward`, return city-wide only |
| GET | `/api/alerts/:id` | One alert with updates |
| POST | `/api/alerts/:id/read` | Body `{ clientId }`. Insert into `alert_reads` (ignore duplicates) |

Officials only (`requireOfficial`):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/alerts/manage/all` | All alerts with status and stats |
| POST | `/api/alerts` | Create. Fields: type, severity, titles and bodies (en required, hi/mr optional), `allWards` or `wardIds[]`, `startsAt`, optional `endsAt`, `publishNow` |
| PUT | `/api/alerts/:id` | Edit fields. Add an `alert_updates` row "Details updated" |
| POST | `/api/alerts/:id/extend` | Body `{ endsAt, note? }`. Add update "Extended until ..." |
| POST | `/api/alerts/:id/cancel` | Body `{ reason }`. Status `cancelled`, add update |
| POST | `/api/alerts/:id/resolve` | Status `resolved`, add update "Resolved" |
| GET | `/api/alerts/:id/stats` | `{ reads, wardsTargeted }` |
| POST | `/api/alerts/translate` | Optional helper: body `{ title, body }` in English, returns Hindi and Marathi drafts using the Grok service (see section 7.3). The official must review before saving. Skip if the Grok key is missing |

Validation: type and severity must be from the allowed lists, English title and body required, `endsAt` after `startsAt`, at least one ward or `allWards`.

### 6.5 Scheduling and lifecycle
- `publishNow = true` sets `starts_at = now` and status `active`; otherwise status `scheduled`.
- `alertScheduler.js` runs every minute: `scheduled` alerts whose `starts_at <= now` become `active`; `active` alerts whose `ends_at <= now` become `expired`. Run once at startup too.
- Citizens only ever see `active` alerts (plus recently `resolved` or `cancelled` ones for 24 hours, shown with a clear badge, so people see the change).

### 6.6 Engagement stats (honest)
Show "Seen by N citizens" based on `alert_reads` (distinct `client_id`). Label it "In-app views". Do not show delivery numbers for SMS, email or push because those channels are not built; mention in the UI help text that they are planned.

### 6.7 Frontend (new files only)
Folder: `client/src/modules/alerts/`

Citizen side:
- `AlertsPage.jsx` - route `/alerts`: ward selector (saved in localStorage key `cs_ward`), language selector English/Hindi/Marathi (saved in `cs_alert_lang`, applies ONLY to alert content, not the rest of the interface), list of alert cards with type icon, severity badge, title, body, dates, "Updated" timeline, and affected wards. Fall back to English when a translation is missing.
- `AlertBell.jsx` - bell icon for the existing Navbar with an unread count (alerts for the saved ward not yet in localStorage `cs_read_alerts`). Clicking opens a small dropdown with the latest 5 and a "View all" link to `/alerts`. Opening an alert calls `POST /api/alerts/:id/read` with the anonymous `clientId` (random UUID created once and stored in localStorage `cs_client_id`).
- `AlertBanner.jsx` - small dismissible banner shown at the top of `/alerts` only for `critical` alerts (do NOT inject banners into other existing pages).

Official side:
- `OfficialLoginPage.jsx` - route `/authority/login`
- `AlertsManagePage.jsx` - route `/authority/alerts` (redirect to login if there is no valid token): table of all alerts with status and in-app views, plus buttons Edit, Extend, Cancel, Resolve
- `AlertForm.jsx` - create and edit form: type, severity, titles and bodies in three languages (tabs), "Auto-translate to Hindi and Marathi" button (calls the translate endpoint, fills drafts, user can edit), ward multi-select plus a "Whole city" checkbox, start now or schedule with a date-time picker, optional end date-time, live preview of how a citizen will see it
- `alerts.css` scoped with the prefix `.cs-alerts-`
- Store the JWT in `sessionStorage` (key `cs_official_token`); send it as `Authorization: Bearer <token>`. Add a logout link.

New routes to add to `App.jsx`: `/alerts`, `/authority/login`, `/authority/alerts`, `/authority/risk-radar`.

Seed 4 sample alerts (idempotent, in `seed-features.js`): an active water cut for two wards, a scheduled road closure for tomorrow, an active city-wide waste schedule change, and a resolved power cut, with Hindi and Marathi text.

---

## 7. FEATURE 3 - Civic Assistant (Grok chatbot)

### 7.1 Purpose
A floating chatbot, bottom-right on every page, that helps citizens understand the app, choose the right issue category, check complaint status, and read active alerts. It must not alter any existing page layout.

### 7.2 Backend files
- `server/routes/chat.js` - `POST /api/chat`
- `server/services/grok.js` - thin client for the xAI chat completions API (reusable by the translate endpoint)

`POST /api/chat` request:
~~~json
{ "messages": [ { "role": "user", "content": "..." } ], "wardId": "ward_02" }
~~~

Behavior:
1. Validate: `messages` is an array, keep only the last 10, each `content` is a string of at most 1000 characters, roles limited to `user` and `assistant`.
2. Apply `express-rate-limit`: 20 requests per minute per IP.
3. Build the system prompt (below). Add live context:
   - If the latest user message contains a complaint ID matching `/CS-\d{4}-\d{5}/i`, look it up in the database and add its status, priority level, authority and latest status note to the prompt as facts. If it does not exist, add "No complaint with this ID exists."
   - If `wardId` is provided, add the titles and dates of the active alerts for that ward and city-wide alerts.
4. Call Grok with `temperature` about 0.3, `max_tokens` about 400, and a 20-second timeout.
5. Return `{ reply }`.
6. Errors: if `GROK_API_KEY` is missing or the call fails, return HTTP 200 with a friendly fallback reply such as "The assistant is unavailable right now. You can still report an issue or track a complaint from the menu." Never leak error details, keys or stack traces. Log the real error server-side only.

System prompt (store in `server/services/chatPrompt.js`):

~~~
You are Civic Assistant, the helper inside Civic Sense, an app where citizens report municipal issues
(potholes, garbage, overgrown trees, hanging cables, dead animals, other), the report is routed to the
responsible municipal department, and the citizen can track its status.

What you can help with:
- Explaining how to report an issue and which category fits a situation.
- Explaining the statuses: submitted, under review, in progress, resolved, rejected.
- Explaining that duplicate reports in the same area are merged and that more reports raise priority.
- Reporting the facts about a complaint or alert ONLY when they are provided to you in the context below.
- Giving basic safety tips (for example: never touch hanging cables, keep away from dead animals).

Rules:
- Never invent complaint statuses, dates, phone numbers, helpline numbers or department names.
  If you do not have the information, say so and tell the user to use the Track page.
- For anything dangerous or urgent, tell the user to keep distance and contact local emergency
  services, then offer to guide them to report it in the app.
- Reply in the same language the user writes in (English, Hindi or Marathi).
- Keep answers short (under 120 words), friendly and practical.
- You cannot submit or edit complaints yourself. Point users to the Report page.
- Politely decline requests unrelated to civic issues or this app.
~~~

### 7.3 Grok client (`grok.js`)
- Export `askGrok({ messages, temperature, maxTokens })` using Node's built-in `fetch` with `Authorization: Bearer ${GROK_API_KEY}`, URL and model from env, and an `AbortController` timeout.
- The translate endpoint (section 6.4) uses a separate instruction: translate the given English title and body into Hindi and Marathi, return strict JSON `{ "hi": {title, body}, "mr": {title, body} }`, and the server must safely parse it and handle malformed output.

### 7.4 Frontend (new files only)
Folder: `client/src/modules/chat/`
- `ChatWidget.jsx` mounted once in `App.jsx`
- `chat.css` - every class prefixed `.cs-chat-`, `position: fixed`, bottom-right (about 20px offset), high z-index so it floats above pages without shifting any layout. Use existing theme CSS variables (colors, fonts) when they exist, with neutral fallbacks. Do not add global CSS rules and do not touch `body`, `html` or existing selectors.

UI details:
- Round launcher button with a chat icon and accessible label "Open Civic Assistant".
- Panel: header (title and close button), scrollable message list, input with Send button (Enter to send, Shift+Enter for new line), typing indicator while waiting.
- Welcome message plus 3 quick-reply chips: "How do I report an issue?", "Check my complaint status", "Any alerts in my area?"
- Sends `wardId` from localStorage `cs_ward` when available.
- Keep conversation in component state (and optionally `sessionStorage`); clear button to reset.
- On mobile the panel becomes a near-full-width bottom sheet; the launcher must not cover form submit buttons (leave bottom padding is NOT allowed on existing pages, so keep the launcher small, about 52px).
- Escape key closes the panel; focus returns to the launcher.
- Render assistant text as plain text (no raw HTML injection). Show "Assistant is unavailable" gracefully on network errors.

---

## 8. Implementation Order (commit after each phase)

**Phase 1 - Foundations**
1. Create branch, add dependencies and env variables.
2. Add migration `002_radar_alerts.sql`, run on startup, add `seed-features.js` (wards and official).
3. Verify the existing app still runs and looks unchanged.

**Phase 2 - Civic Risk Radar**
4. `riskRadar.js` service and recommendations, then the routes.
5. Frontend module, route, and the one link on the Authority Dashboard.
6. `seed-radar-demo.js` and `npm run seed:radar-demo`.
7. Verify the demo cluster appears with a clear explanation.

**Phase 3 - Civic Alerts**
8. Auth route and middleware, alerts routes, scheduler.
9. Citizen pages, bell, and Navbar addition.
10. Official login and management pages and the link on the Authority Dashboard.
11. Seed sample alerts.

**Phase 4 - Civic Assistant**
12. `grok.js`, `chatPrompt.js`, `chat.js` route with rate limit and live context.
13. `ChatWidget` and mount in `App.jsx`.
14. Wire the translate endpoint into `AlertForm`.

**Phase 5 - Final checks**
15. Run the acceptance tests below.
16. Update `README.md` with a short section for the three features and the new env variables.

---

## 9. Acceptance Tests (all must pass)

**No regression**
- [ ] Home, Issues, Report, Track and Authority pages look the same as before (only the allowed additions appear)
- [ ] Submitting a complaint still works, duplicates still merge, priority still updates

**Risk Radar**
- [ ] After `npm run seed:radar-demo`, `/authority/risk-radar` shows a pothole cluster of 5 reports marked high (score in the 55-74 range or as calculated by the formula)
- [ ] Clicking it shows the four factor bars with plain-language explanations, a recommendation and an "inspect first" complaint
- [ ] Isolated complaints do not form clusters
- [ ] Resolving or rejecting complaints removes them from clusters on the next load
- [ ] Disclaimer text is visible

**Civic Alerts**
- [ ] Official can log in; wrong password shows a generic error
- [ ] Create-alert endpoints return 401 without a token
- [ ] Creating an alert for two wards shows it only to citizens who selected those wards (and city-wide alerts to everyone)
- [ ] A scheduled alert appears automatically when its start time passes (test with a start time 1-2 minutes ahead)
- [ ] Extending, cancelling and resolving update the citizen view and add timeline entries
- [ ] Hindi and Marathi content shows when selected and falls back to English when missing
- [ ] Bell unread count decreases after viewing; in-app view count increases for officials

**Civic Assistant**
- [ ] Launcher is visible bottom-right on every page and does not shift any layout
- [ ] Asking "How do I report a pothole?" returns a sensible short answer
- [ ] Sending a real complaint ID returns the real status; a fake ID is not invented
- [ ] With the key removed from `.env`, the widget shows the friendly fallback and the server does not crash
- [ ] The Grok key never appears in browser network responses or the client bundle
- [ ] More than 20 requests a minute are rate limited

---

## 10. Security Checklist

- [ ] `server/.env` is in `.gitignore`; only `.env.example` is committed
- [ ] Passwords are bcrypt-hashed; JWT secret comes from env
- [ ] All SQL uses parameterized queries
- [ ] Chat and alert inputs are length-limited and validated
- [ ] No user-provided text is rendered as raw HTML
- [ ] CORS is not opened wider than it already is

---

## 11. What NOT to Build (keep the scope tight)

- No SMS, email or push notifications (mention as future scope only)
- No citizen accounts or login
- No MongoDB, Tailwind, or any framework change
- No redesign of existing screens
- No AI image analysis or prediction claims
- No streaming chat responses (plain request and response is enough)

---

## 12. Final Report

When finished, reply with: the list of new files, the exact list of existing files you edited (it must match section 1), the commands to run (migration, seed scripts, start), and any assumption you made. Do not claim a test passed unless you actually ran it.