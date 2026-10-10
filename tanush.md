# TANUSH - Complaint Submission, Smart Checks & Tracking

**Project:** Civic Sense
**Your order:** Start AFTER Sahil pushes Part 1 to `main`. Work in parallel with Sujal. Branch name: `tanush`.
**Your folders (only edit these):**
- `client/src/modules/report/`
- `server/routes/complaints.js`
- `server/services/` (duplicate.js, priority.js, routing.js)

Do not edit shared files (App.jsx, schema.sql, theme CSS). If you need a schema change, ask Sahil.

---

## Goal

A citizen can submit a complaint (photo, location, description, category), receive a complaint ID, and follow its progress. The system detects duplicates, calculates priority, and routes the complaint to the right authority.

**Deliverable:** A citizen can submit a complaint and follow its progress.

> Real municipal integration is not possible in a hackathon, so we build a **simulated workflow**: an Authority Dashboard where a "municipal officer" reviews complaints and updates status.

---

## Before You Start

- [ ] `git pull origin main`, then `git checkout -b tanush`
- [ ] Read the data model and API contract in `sahil.md`
- [ ] Install: `multer` (uploads), `sharp` (image processing for hashing), `leaflet` + `react-leaflet` (client)

---

## Task 1 - Complaint Form (frontend)

Routes: `/report` and `/report/:categoryId`

- [ ] Category dropdown (pre-selected if `:categoryId` is in the URL)
- [ ] **Photo upload** with preview; allow camera capture on mobile (`<input type="file" accept="image/*" capture="environment">`)
- [ ] **Location:**
  - "Use my current location" button (browser geolocation)
  - Map with a draggable pin (Leaflet) so the user can correct it
  - Optional address/landmark text box
- [ ] **Description** textarea (min 10 characters)
- [ ] Validation: photo, location and category are required; show clear error messages
- [ ] Submit button with loading state and no double submit

---

## Task 2 - Submission API (backend)

File: `server/routes/complaints.js`

- [ ] `POST /api/complaints` (multipart): save photo to `uploads/`, validate fields
- [ ] Generate ID in the format `CS-2026-00001` (incrementing)
- [ ] Run the checks in Task 3 and Task 4, then save the complaint
- [ ] Insert the first row in `status_history` (`submitted`)
- [ ] Return JSON: complaint id, status, priority level, authority name, and a `duplicate` flag with the original id when merged

---

## Task 3 - Duplicate and Authenticity Layer (our standout feature)

File: `server/services/duplicate.js`

**Idea:** the same problem should not be counted as many separate complaints, and the same photo should not be reused to fake reports.

1. **Compute a perceptual hash (dHash)** of the uploaded photo: resize to 9x8 grayscale, compare adjacent pixels, produce a 64-bit hash. Store in `photo_hash`.
2. **Find nearby complaints:** same category and within **50 metres** (Haversine distance) and not resolved/rejected.
3. **Compare hashes:** Hamming distance <= 10 means the same photo or the same scene.
4. **Outcomes:**

| Case | Action |
|------|--------|
| Same area + similar photo | Mark as **duplicate**: do NOT create a new active complaint. Increase `report_count` of the original, add `duplicate_of`, tell the user "This issue is already reported (ID ...). We added your report to it." |
| Same area, same category, different photo | Treat as a **new confirmation**: attach to the original and increment `report_count` (more reporters = more credible) |
| Similar photo but far away (>500 m) | Mark `authenticity = suspicious` (possible reused photo); still accept but flag for the authority |
| Otherwise | `authenticity = verified`, new complaint |

- [ ] Write the helper functions: `computeHash(file)`, `hammingDistance(a, b)`, `distanceMeters(lat1, lon1, lat2, lon2)`
- [ ] Write 3-4 quick test cases (even simple Node scripts)

---

## Task 4 - Priority System

File: `server/services/priority.js`

Formula (keep it simple and explainable to judges):

```
score = (report_count * 10)
      + (severity_weight * 5)
      + (days_open * 2)
      + (suspicious ? -10 : 0)
```

| Score | Level |
|-------|-------|
| < 20 | low |
| 20-39 | medium |
| 40-69 | high |
| 70+ | critical |

- [ ] Recalculate `priority_score` and `priority_level` whenever `report_count` changes
- [ ] Recalculate for all open complaints when the authority dashboard loads (so days_open stays current)
- [ ] `GET /api/complaints?sort=priority` returns highest priority first

---

## Task 5 - Routing to Authority (simulated pipeline)

File: `server/services/routing.js`

- [ ] Map category to authority using the `authorities` table (roads, sanitation, garden, electrical, animal control, general)
- [ ] On submission set `authority_id` and log a status history note: "Forwarded to <department>"
- [ ] Status flow: `submitted` -> `under_review` -> `in_progress` -> `resolved` (or `rejected` with a reason)
- [ ] `PATCH /api/complaints/:id/status` accepts new status plus a note, and writes to `status_history`
- [ ] Block invalid jumps (e.g. `submitted` straight to `resolved` is not allowed)

---

## Task 6 - Confirmation and Tracking (frontend)

- [ ] **Confirmation screen** after submit: big complaint ID, copy button, summary, authority name, and priority badge. If merged, show the duplicate message clearly.
- [ ] **Track page** `/track` and `/track/:complaintId`: input for complaint ID, then show details
- [ ] **Status timeline** (vertical steps with timestamps and notes from `status_history`)
- [ ] Show `report_count` ("12 citizens reported this") and the priority badge
- [ ] Friendly "Complaint not found" message

---

## Task 7 - Authority Dashboard (simulated officer view)

Route: `/authority`

- [ ] Table of complaints sorted by priority (critical first) with category, location, report count, status and authenticity flag
- [ ] Filters: status, category, priority
- [ ] Click a complaint to see photo, map pin, history
- [ ] Buttons to change status with a note
- [ ] Visually flag `suspicious` complaints
- [ ] Keep it simple: no login needed in Phase 1 (just mention "role-based login" as future scope)

---

## Handoff Checks

- [ ] Submit 3 complaints at the same place with similar photos and confirm one complaint with `report_count = 3`
- [ ] Confirm priority rises to the correct level
- [ ] Confirm category from `/report/:categoryId` is pre-selected (Sujal's links)
- [ ] Push branch and message Sahil: "Tanush module ready for merge"
- [ ] Give Gagare the list of status labels and priority levels for the demo script

---

## Bonus (only if time remains)

- [ ] "I face this too" button on public complaints (increments `report_count`)
- [ ] EXIF GPS check: compare photo location metadata with the pin and flag large mismatches
- [ ] Heatmap of complaints on the home page map

---

## Done When

- [ ] Citizen can submit with photo, location, description, category
- [ ] Complaint ID and confirmation shown
- [ ] Duplicate detection and priority work as described
- [ ] Authority dashboard updates status and the citizen sees it on the Track page
- [ ] Branch pushed and Sahil notified
