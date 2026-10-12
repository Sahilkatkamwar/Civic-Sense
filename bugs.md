# Civic Sense - QA Test Report & Bug Tracking

**Tester:** Gagare (Content, Demo Data & Testing)  
**Date:** October 2026  
**Environment:** Windows, Node.js v24, SQLite3, Vite + React (Desktop & Responsive Mobile Emulation)  
**Target Branch:** `gagare`  

---

## 1. Testing Summary Checklist

- [x] **Page Navigation:** Verified all pages load without runtime crashes (`/`, `/issues`, `/issues/:id`, `/report`, `/track`, `/authority`).
- [x] **Category Coverage:** Verified submission, detail guidance, and rendering for all 6 categories:
  - Potholes (`pothole`)
  - Garbage Dump (`garbage`)
  - Overgrown Trees (`tree`)
  - Hanging Cables (`cable`)
  - Dead Animals (`animal`)
  - Other Issues (`other`)
- [x] **Smart Duplicate Detection:** Verified that uploading the same photo within 50 meters detects the duplicate, increments the citizen count, elevates priority, and returns the existing complaint ID.
- [x] **Track Complaint (Error Handling):** Verified tracking with an invalid ID (`CS-9999-99999`) gracefully returns HTTP 404 with a user-friendly error message (`Complaint ID "..." was not found in our records. Please verify the format`).
- [x] **Mobile Responsiveness:** Tested viewports down to 360px width. Grid layouts stack cleanly, navigation collapses/scrolls smoothly, and cards wrap properly.

---

## 2. Test Execution Log

| # | Test Scenario | Steps Taken | Expected Result | Actual Result | Status |
|---|---------------|-------------|-----------------|---------------|--------|
| 1 | **Home Page Load** | Navigate to `/` | Display hero, dynamic statistics counter, category cards, How It Works, and FAQs | All sections render with live data from `/api/complaints/stats` and seed data | ✅ PASS |
| 2 | **Issue Explorer** | Navigate to `/issues` | Show all 6 categories with badges (e.g. High Risk, Most Reported) | All 6 categories displayed with icons and department tags | ✅ PASS |
| 3 | **Hanging Cables Guidance** | Click "Learn more" on Hanging Cables (`/issues/cable`) | Show urgent safety alert, DO list, DON'T list, examples, and emergency contact notice | Urgent banner displayed with 10m safety warning and 1912 / 112 hotline guidance | ✅ PASS |
| 4 | **Category Pre-selection** | Click "Report this" from `/issues/cable` | Navigate to `/report/cable` with Hanging Cables pre-selected in dropdown | Category selector defaults to "Hanging Cables" | ✅ PASS |
| 5 | **Submit New Complaint** | Fill form with photo, GPS coordinates, and description; submit | Returns HTTP 201 with newly minted complaint ID (e.g., `CS-2026-00011`) | New complaint saved, initial timeline history entry added | ✅ PASS |
| 6 | **Duplicate Submission** | Submit same image within 50 meters of existing issue | System detects duplicate, prevents duplicate ticket, merges into original | Returns `duplicate: true`, increments `report_count`, elevates priority score | ✅ PASS |
| 7 | **Invalid ID Tracking** | Search for `CS-9999-99999` on `/track` | Display friendly error explaining the ID was not found | Friendly alert: `"Complaint ID 'CS-9999-99999' was not found in our records. Please verify the format (e.g. CS-2026-00001)."` | ✅ PASS |
| 8 | **Valid ID Tracking** | Search for `CS-2026-00001` on `/track` | Display complaint status, live Leaflet map marker, photo evidence, and full audit timeline | Interactive map displays marker; progress stepper and audit history rendered | ✅ PASS |
| 9 | **Authority Dashboard** | Navigate to `/authority` | List complaints sorted by priority, allow filtering by status/department, permit status update | Complaints rendered with priority tags; updating status to `in_progress` saves audit note | ✅ PASS |
| 10 | **Mobile Viewport Test** | Test on 375px mobile viewport width | Buttons, cards, and forms should not cause horizontal overflow | Responsive flex and CSS media queries collapse layout cleanly | ✅ PASS |

---

## 3. Discovered Issues & Observations

### Bug / Observation 1: Camera Access on Insecure Contexts (HTTP)
- **Page:** `/report` (Report Form)
- **What was done:** Attempted to use device camera directly in non-HTTPS browser environments.
- **What happened:** Browser security restrictions disallow `navigator.mediaDevices.getUserMedia` on plain HTTP across local network devices (except `localhost`).
- **Resolution / Behavior:** Fallback file input (`<input type="file" accept="image/*" />`) works reliably on mobile and desktop, allowing users to take photos using their native camera app or pick from gallery.

### Bug / Observation 2: Category Guidance Parsing Fallback
- **Page:** `/issues/:categoryId` (Issue Detail)
- **What was done:** Tested categories where `guidance` string might deviate from strict `DO: ... DONT: ...` regex format.
- **What happened:** Regex gracefully fell back to default guidance strings without throwing unhandled exceptions.
- **Resolution:** Formatted seed categories in `server/db/seed.js` to strictly provide standardized `DO: ... DONT: ...` text so the parser always yields rich custom tips.

### Bug / Observation 3: Map Tile Rendering Under Fast Tab Switching
- **Page:** `/track` (Leaflet Map)
- **What was done:** Rapidly toggled between Search and Result views.
- **What happened:** Leaflet map container occasionally required container invalidation size.
- **Resolution:** Component handles mounting smoothly; map loads coordinates once complaint data is confirmed.
