# Civic Sense - 3-Minute Demo Script

**Total Duration:** 3 minutes (180 seconds)  
**Roles:**
- **Speaker / Presenter:** Talks to judges and explains the problem & value proposition
- **Navigator / Operator:** Shares screen, clicks smoothly, and demonstrates the workflow

---

## Quick Reference Flow Map
```
[Home Page] ➔ [Issue Explorer] ➔ [Hanging Cables Guidance] ➔ [Report Form] 
     ➔ [Submit Complaint] ➔ [Duplicate Submission & Merge] 
     ➔ [Authority Dashboard] ➔ [Update Status to In-Progress] ➔ [Citizen Track Verification]
```

---

## Minute 0:00 – 0:35 | The Hook & Home Page Overview

### Screen Action (Navigator):
1. Start on `http://localhost:5173/` (Home Page).
2. Slowly scroll down past the **Hero section**, pause on the **Live Statistics counter**, hover over **Category Cards**, and briefly show the **How It Works (Spot ➔ Snap ➔ Submit ➔ Track)** steps and **FAQs**.

### Spoken Script (Speaker):
> *"Judges, every day citizens encounter dangerous civic hazards—potholes, open garbage, or live dangling power cables. But current municipal systems fail because of two things: citizens get zero tracking visibility, and municipal helplines get overwhelmed by hundreds of duplicate complaints for the exact same spot.*
> 
> *Meet **Civic Sense**—an intelligent municipal reporting platform built with perceptual photo hashing, automatic duplicate merging, and real-time public accountability."*

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

## Minute 1:05 – 1:45 | Smart Report Submission & Instant Duplicate Merging

### Screen Action (Navigator):
1. On `/report/cable`:
   - Click **"Use My Current Location"** (or keep simulated GPS coordinates).
   - Enter description: `"Snapped high-voltage wire touching the ground near sidewalk"`.
   - Upload sample photo `sample-cable.jpg`.
2. Click **"Submit Complaint"**.
3. **Show Success Screen:** Highlight generated Complaint ID (e.g. `CS-2026-00001` or newly generated ID). Copy the ID.
4. Now immediately click **"Report Another Issue"** (or use Report form again):
   - Choose same category (`cable`).
   - Use the exact same photo and coordinates.
   - Click **"Submit Complaint"**.
5. **Show Duplicate Alert Screen:** Highlight the message:
   `"This issue is already reported under ID CS-2026-00001. We have added your report to raise its priority."`

### Spoken Script (Speaker):
> *"Watch what happens behind the scenes. When a citizen submits a photo, our backend computes a perceptual difference hash (dHash) and GPS coordinates.*
> 
> *When a second citizen spots the same wire 10 minutes later and submits their photo, Civic Sense doesn't generate a second ticket! Our perceptual matching engine detects the duplicate within 50 meters, automatically links it, and boosts the issue's priority score. The municipal department gets one unified ticket with escalating urgency."*

---

## Minute 1:45 – 2:25 | Municipal Authority Dashboard & Triage

### Screen Action (Navigator):
1. Click **"Authority"** in navbar (`/authority`).
2. Show the triage list sorted by **Priority Score** (notice the cable issue at the top with a **CRITICAL** badge and multiple citizen reports).
3. Open the complaint details, click the status dropdown, change status from `submitted` to **`in_progress`**, enter note: `"Line repair truck dispatched with emergency crew"`, and click **"Update Status"**.
4. Point to the green confirmation message.

### Spoken Script (Speaker):
> *"Now we switch to the Municipal Authority view. No clutter, no redundant rows. Officers see high-severity hazards float to the top based on crowd verification and severity weighting.*
> 
> *With a single click, the field supervisor assigns the team, adds an internal update note, and transitions the status to 'In Progress'. The audit trail is instantly recorded."*

---

## Minute 2:25 – 3:00 | Public Real-Time Tracking & Wrap-Up

### Screen Action (Navigator):
1. Click **"Track"** in navbar (`/track`).
2. Type in the Complaint ID from earlier and hit **"Track Status"**.
3. Point out:
   - The status stepper now shows **In Progress** in real-time.
   - The interactive Leaflet map displays the exact GPS pin.
   - The audit timeline reflects the note added by the authority.
4. Scroll back to top.

### Spoken Script (Speaker):
> *"Back on the citizen side—no login required. The citizen simply types their tracking ID. They see their pin on the interactive map, photo proof, and real-time timeline confirmation that their report made an impact.*
> 
> *Civic Sense bridges the gap between citizens and municipal teams—reducing noise, saving lives, and delivering real civic accountability. Thank you!"*

---

## 💡 Quick Tips for the Presenters
- **Keep tabs pre-loaded:** If demoing live, keep one tab on `/` and another on `/authority` in case of slow clicks.
- **Have sample ID ready:** If anything lags, keep `CS-2026-00001` copied in your clipboard to paste into Track immediately.
- **Confidence:** Speak clearly, match your narration to the operator's clicks, and finish right at the 3-minute mark!
