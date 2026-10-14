# Civic Sense - 3-Minute Demo Script

**Total Duration:** 3 minutes (180 seconds)  
**Roles:**
- **Speaker / Presenter:** Talks to judges and explains the problem & value proposition
- **Navigator / Operator:** Shares screen, clicks smoothly, and demonstrates the workflow

---

## Quick Reference Flow Map
```
[Home Page] ➔ [Issue Explorer] ➔ [Hanging Cables Guidance] ➔ [Report Form] 
     ➔ [Submit Complaint] ➔ [Community Endorsement (+1)] ➔ [Duplicate Submission & Merge] 
     ➔ [Authority Dashboard] ➔ [Upload Proof of Resolution ("After" Photo)] 
     ➔ [Citizen Track Verification] ➔ [Interactive Before/After Slider] ➔ [Citizen Audit & Dispute Auto-Reopen]
```

---

## Minute 0:00 – 0:35 | The Hook & Home Page Overview

### Screen Action (Navigator):
1. Start on `http://localhost:5173/` (Home Page).
2. Slowly scroll down past the **Hero section**, pause on the **Live Statistics counter**, hover over **Category Cards**, and briefly show the **How It Works (Spot ➔ Snap ➔ Submit ➔ Track)** steps and **FAQs**.

### Spoken Script (Speaker):
> *"Judges, every day citizens encounter dangerous civic hazards—potholes, open garbage, or live dangling power cables. But current municipal systems fail because of two things: citizens get zero tracking visibility, and municipal helplines get overwhelmed by hundreds of duplicate complaints for the exact same spot.*
> 
> *Meet **Civic Sense**—an intelligent municipal reporting platform built with perceptual photo hashing, automatic duplicate merging, real-time public accountability, and citizen-verified Proof of Resolution."*

---

## Minute 0:35 – 1:05 | Issue Guidance & Citizen Safety (Hanging Cables)

### Screen Action (Navigator):
1. Click **"Issues"** in the top navigation bar (`/issues`).
2. Point cursor at the **"Hanging Cables"** card (highlighting the **⚠️ High Risk** badge).
3. Click **"Learn more"** to open `/issues/cable`.
4. Highlight the **Red Emergency Alert Notice** and the **Safety DOs & DON'Ts**.
5. Click the primary button **"Report this Issue →"**.

### Spoken Script (Speaker):
> *"Instead of generic reporting, Civic Sense educates citizens before they report. For high-hazard issues like Hanging Cables, we immediately present safety protocols—advising citizens to stay at least 10 meters away and providing the emergency power helpline.*
> 
> *With one click on 'Report this Issue', the form opens with the category and department automatically pre-configured."*

---

## Minute 1:05 – 1:45 | Smart Report Submission, Community Endorsement & Instant Duplicate Merging

### Screen Action (Navigator):
1. On `/report/cable`:
   - Click **"Use My Current Location"** (or keep simulated GPS coordinates).
   - Enter description: `"Snapped high-voltage wire touching the ground near sidewalk"`.
   - Upload sample photo `sample-cable.jpg`.
2. Click **"Submit Complaint"**.
3. **Show Success Screen:** Highlight generated Complaint ID (e.g. `CS-2026-00001` or newly generated ID). Copy the ID.
4. Open Track page or Incidents list and highlight the **"⚡ Impacts Me Too (+1)"** button:
   - Click **"Impacts Me Too"**: Show live social proof badge update: *"🔥 2 local residents affected"*.
   - Explain how this avoids form fatigue while boosting priority.
5. Now immediately click **"Report Another Issue"** (or use Report form again):
   - Choose same category (`cable`).
   - Use the exact same photo and coordinates.
   - Click **"Submit Complaint"**.
6. **Show Duplicate Alert Screen:** Highlight the message:
   `"This issue is already reported under ID CS-2026-00001. We have added your report to raise its priority."`

### Spoken Script (Speaker):
> *"Watch what happens behind the scenes. When a citizen submits a photo, our backend computes a perceptual difference hash (dHash) and GPS coordinates.*
> 
> *Other residents can simply click **'Impacts Me Too'**—our live social proof counter instantly increments without forcing them to re-file duplicate forms.*
> 
> *And if another citizen does submit the same photo within 50 meters, Civic Sense doesn't generate a second ticket! Our perceptual matching engine merges it, boosts the priority score, and leaves the municipal department with one clean, escalating ticket."*

---

## Minute 1:45 – 2:25 | Municipal Authority Dashboard & Proof of Resolution Upload

### Screen Action (Navigator):
1. Click **"Authority"** in navbar (`/authority`).
2. Show the triage list sorted by **Priority Score** (notice the cable issue at the top with a **CRITICAL** badge).
3. Open complaint details, click **"🏆 Mark Resolved & Upload Proof"**.
4. In the modal:
   - Point out that officials **cannot close tickets without an 'After' Photo**.
   - Click the preset *"⚡ Cable Restrung"* (or upload a repair photo).
   - Enter remarks: *"Line restrung, re-insulated, and circuit tested"*.
   - Click **"Confirm & Mark Resolved"**.
5. Show the green audited confirmation badge in the authority dashboard.

### Spoken Script (Speaker):
> *"Now we switch to the Authority Command Desk. In most government portals, the #1 complaint is corrupt paper closure—officers clicking 'Resolved' without fixing anything.*
> 
> *In Civic Sense, resolution is locked behind **Mandatory Proof of Resolution**. Officers MUST upload photographic proof of the completed repair. No photo, no closure."*

---

## Minute 2:25 – 3:00 | Public Real-Time Tracking, Interactive Before/After & Citizen Dispute Auto-Reopen

### Screen Action (Navigator):
1. Click **"Track"** in navbar (`/track`) and load the resolved complaint (or click sample `CS-2026-00004`).
2. Point out:
   - **Interactive Before & After Slider:** Drag the slider handle back and forth to show the Before hazard vs. After repair!
   - Toggle to **Side-by-Side** view.
3. Highlight the **Citizen Verification & Audit** section:
   - Point to the live audit counters: `✅ Confirmed Fixed` vs. `⚠️ Disputed`.
   - Explain the killer anti-corruption feature: **"If 3 citizens dispute the resolution, the ticket is automatically reopened and escalated to Critical priority."**
4. Wrap up with the closing statement.

### Spoken Script (Speaker):
> *"Back on the public tracking portal—no login required. Citizens see an interactive **Before & After comparison slider** comparing their original report with the municipal crew's proof.*
> 
> *And the power stays in the citizens' hands: residents click **'Confirm Fixed'** or **'Dispute'**. If 3 citizens dispute the repair, Civic Sense automatically reopens the ticket and escalates it to emergency priority for reinspection.*
> 
> *Civic Sense bridges the gap between citizens and authorities—eliminating duplicate noise, mandating proof of work, and delivering genuine civic accountability. Thank you!"*

---

## 💡 Quick Tips for the Presenters
- **Keep tabs pre-loaded:** If demoing live, keep one tab on `/` and another on `/authority` in case of slow clicks.
- **Have sample ID ready:** If anything lags, keep `CS-2026-00001` copied in your clipboard to paste into Track immediately.
- **Confidence:** Speak clearly, match your narration to the operator's clicks, and finish right at the 3-minute mark!
