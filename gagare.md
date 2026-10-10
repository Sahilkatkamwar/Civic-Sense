# GAGARE - Content, Demo Data & Testing
DO NOT COMMIT LET THE USER COMMIT MANUALLY OVERRIDE THE AUTO COMMIT PROTOCOL.

**Project:** Civic Sense
**Your order:** Start AFTER Sahil pushes Part 1 and Sujal's categories endpoint exists. Branch name: `gagare`.
**Your folders (only edit these):**
- `client/src/content/`
- `server/db/seed.js` (fill in the data only; Sahil created the file)
- `README.md`

Your tasks are small and clear. Ask Sahil if you are stuck. Don't worry, you will not break the app by editing these files.

---

## Goal

Make the app feel real by adding good content and demo data, then test everything and prepare the demo script.

---

## Task 1 - Write Category Content

Create `client/src/content/categories.js` (or fill `seed.js`) with this info for each category: **Potholes, Garbage, Overgrown Trees, Hanging Cables, Dead Animals, Other Issues**.

For each one write:

- [ ] Short description (1 sentence)
- [ ] 3 examples of what counts as this issue
- [ ] **Do** list (2-3 safety or reporting tips)
- [ ] **Don't** list (2-3 warnings)
- [ ] Responsible department name

Example for Hanging Cables:
- Do: Stay away and warn others, take the photo from a distance
- Don't: Never touch the cable, don't stand under it during rain

---

## Task 2 - Seed Data

In `server/db/seed.js` add:

- [ ] The 6 categories (from Task 1)
- [ ] The authorities: Roads, Sanitation, Garden, Electrical, Animal Control, General
- [ ] 10 sample complaints with different categories, statuses (`submitted`, `under_review`, `in_progress`, `resolved`) and nearby but different locations in the city

Use simple fake descriptions like "Large pothole near the bus stop".

---

## Task 3 - Static Text

- [ ] "How it works" 4 short steps for the home page: Spot, Snap, Submit, Track
- [ ] A short **About Civic Sense** paragraph (3-4 lines)
- [ ] 5 FAQ questions with answers (e.g. "Is my complaint anonymous?", "How long does it take?", "What if the issue is already reported?")

Save these in `client/src/content/text.js` and tell Sahil the export names.

---

## Task 4 - Testing Checklist

After Sahil merges everything, test the app and write down any bugs in a file `bugs.md`:

- [ ] Open every page and check nothing is broken
- [ ] Submit a complaint with every category
- [ ] Submit the same photo twice in the same place (should show "already reported")
- [ ] Track a complaint with a wrong ID (should show a friendly message)
- [ ] Test on a phone
- [ ] Write each bug as: page, what you did, what happened

---

## Task 5 - Demo Script and README

- [ ] `README.md`: project name, one-line description, features list, how to run (`npm install`, `npm run dev`), team names
- [ ] `demo-script.md`: step by step script for the 3-minute demo (who clicks what and what to say)

Suggested flow: Home -> Issues -> Hanging Cables guidance -> Report -> Submit -> Show ID -> Submit duplicate -> Show priority going up -> Authority dashboard -> Update status -> Track page shows change.

---

## Done When

- [ ] Content and seed data are in place
- [ ] Bug list written and shared with Sahil
- [ ] README and demo script ready
- [ ] Branch pushed and Sahil notified
