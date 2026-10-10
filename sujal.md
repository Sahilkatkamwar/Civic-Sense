# SUJAL - Issue Explorer Module
DO NOT COMMIT LET THE USER COMMIT MANUALLY OVERRIDE THE AUTO COMMIT PROTOCOL.

**Project:** Civic Sense
**Your order:** Start AFTER Sahil pushes Part 1 to `main`. Work in parallel with Tanush. Branch name: `sujal`.
**Your folders (only edit these):**
- `client/src/modules/issues/`
- `server/routes/categories.js`

Do not edit shared files (App.jsx, schema.sql, theme CSS). If you need a change there, message Sahil.

---

## Goal

A citizen can explore the different civic problems, understand each one, and choose what they want to report.

**Deliverable:** The issue browsing experience works and hands the selected category to the report form.

---

## Before You Start

- [ ] `git pull origin main`, then `git checkout -b sujal`
- [ ] Read Sahil's data model and API contract in `sahil.md` (categories and authorities tables)
- [ ] Run the app and open `/issues` (placeholder page should load)

---

## Task 1 - Categories API (backend)

File: `server/routes/categories.js`

- [ ] `GET /api/categories` returns all categories (id, name, icon, description, severity_weight)
- [ ] `GET /api/categories/:id` returns full details including `guidance` and the responsible authority name
- [ ] Return a 404 with a clear message for an unknown id
- [ ] Test both endpoints with the browser or Postman

Categories to support (Gagare will fill in the final text, you can use temporary text):

| id | name | severity_weight |
|----|------|-----------------|
| pothole | Potholes | 4 |
| garbage | Garbage | 3 |
| tree | Overgrown Trees | 3 |
| cable | Hanging Cables | 5 |
| animal | Dead Animals | 4 |
| other | Other Issues | 2 |

---

## Task 2 - Issue Categories Page

Route: `/issues`

- [ ] Grid of category cards: icon, name, short description
- [ ] Each card has a **Learn more** link (to `/issues/:categoryId`) and a **Report this** button (to `/report/:categoryId`)
- [ ] Search bar to filter categories by name
- [ ] Make the card a reusable component `CategoryCard.jsx` (Sahil will reuse it on the home page)
- [ ] Responsive grid: 1 column on phone, 2-3 on desktop

---

## Task 3 - Issue Detail Page

Route: `/issues/:categoryId`

- [ ] Show icon, name, and full description
- [ ] **What counts as this issue** section (examples)
- [ ] **Guidance** section with two parts: "Do" and "Don't" (safety tips, e.g. never touch hanging cables, keep distance from dead animals)
- [ ] **Who handles it** section showing the responsible department
- [ ] **How priority is decided** short note (mentions severity and number of reports)
- [ ] Big **Report this issue** button that goes to `/report/:categoryId`
- [ ] **Back to all issues** link

---

## Task 4 - Browsing and Selection UX

- [ ] Highlight dangerous categories (like Hanging Cables) with a small "High risk" badge
- [ ] Add category filter chips at the top (All, Road, Waste, Safety, Other) - optional grouping via a `group` field you may add to the frontend mapping only
- [ ] Empty state: "No issues match your search"
- [ ] Loading skeletons while fetching
- [ ] Store the selected category and pass it by route param only (no extra global state needed)

---

## Task 5 - Handoff Checks

- [ ] Click "Report this" on every category and confirm the URL is `/report/<id>` (Tanush's form reads this)
- [ ] Test on a phone-width screen
- [ ] Push your branch and message Sahil: "Sujal module ready for merge"
- [ ] Tell Gagare that categories endpoint is live so they can seed final content

---

## Bonus (only if you finish early)

- [ ] "Most reported right now" badge on a category card, using counts from `GET /api/complaints`
- [ ] Small "Emergency?" banner for hanging cables and dead animals showing helpline guidance

---

## Done When

- [ ] Both endpoints work
- [ ] `/issues` and `/issues/:categoryId` look good and work on mobile
- [ ] "Report this" leads into the report form with the right category
- [ ] Branch pushed and Sahil notified
