# Teach Today — Handoff File

> Update this after each Codex session so the next conversation can pick up immediately.
> Keep it short: what changed, what's next, any important context.

---

## Last Updated
2026-08-18

## Shared Memory Rules
- This is the canonical current-state file for every Codex/ChatGPT account and computer working on the repository.
- `AGENTS.md` requires future coding chats to read this file first and update it after material work.
- Durable choices live in `docs/DECISIONS.md`; completed work is summarized in `docs/CHANGELOG.md`.
- Do not create competing handoff/status files. Do not include student-identifying information here.

## Active Direction
- **V1 Teach Today is the active product.** Preserve its current visual design and working teacher/student flows.
- **Slides and presentation mode are the current priority.** Work through the path: Teacher Home -> select group -> build/open lesson -> presentation mode -> slides.
- **The `/v2/` lesson-engine experiment is paused.** Keep it intact for reference, but do not extend it or route users into it while V1 slide work is active.
- **The `lesson-planner-v2-*` files are a presenter prototype, not the paused `/v2/` app.** Harvest useful slide behavior from them into V1 deliberately; do not replace V1 wholesale.
- Do not move or rename V1 runtime files without first auditing GitHub Pages paths, Firebase references, service-worker cache entries, and existing links.

## Recovery Point
- Active branch: `main`
- Recovery commit: `bf63641` (`Preserve recovered V1 slide presenter work`)
- Privacy baseline through: `05f5ea1` (`Protect student portal data and repository privacy`)
- The five recovery/privacy commits were pushed to GitHub `main` on 2026-08-18.

## Privacy Checkpoints
- `7142fe2` — privacy migration design and safety boundary.
- `4beaecd` — permanent private student IDs, school-year metadata, and removal of real public roster defaults.
- Complete on 2026-08-18: strict Firestore rules were published in Firebase Console.
- Verified before deployment: the current private backup existed at the authenticated `/users/{uid}/teachTodaySync/main` path and was newer than the retained legacy backup.
- Verified after deployment: a private Firebase sync completed successfully at 10:54 PM with no console errors.
- The legacy shared backup remains stored for recovery but application access to `/teachTodaySync/**` is denied. No data was deleted.
- No `students`, `studentCodes`, or `studentLinks` collections existed, so no portal-record ownership migration was necessary. Firebase Storage is not enabled on the Spark project.

## Private Input Workflow
- Private rosters, reports, screenshots, PDFs, and spreadsheets may be attached to a chat or placed in `private-input/` for a specific task.
- `private-input/` contents are ignored by Git except for its README.
- Extract only the necessary fields, preview matches/counts, write only to the authorized private destination, and never commit source student records.

## Current Baseline (as of 2026-06-08 Codex session)
- **Student display** — privacy, poster, HFW, passage, and game modes; teacher can open/project from toolbar and presentation dock
- **PDF reference page** — Wilson Readers and Dictation books with dashboard links to current reader/charting and dictation pages
- **Lesson launch** — "Lesson ready" overlay, smoother home-to-teaching-mode handoff
- **Card navigation** — counts for Section 2 word cards and Section 7 HFW
- **Planner preview** — Start Teaching button, sticky scrollable preview, Section 8 real-word sync
- **Syllable Scoop** (redesigned from Syllable Slice) — scoop/cut modes, drawn scoop validation, richer feedback, updated scoring

## Key Files
- `teach-today.js` — main app logic
- `student-display.js` + `student-display.css` — student-facing display
- `Games/` — games including Syllable Scoop
- `service-worker.js` — cache (update when adding new assets)

## Open Questions / Things to Confirm
- The `Teach-Today/` subfolder (~99 files) looks like a packaged copy of the app — intentional?

## In Progress / Next Up
- Publish the historical WRS importer and longitudinal profile updates, then use the private generated payload to import and verify the 2025-2026 baseline. The payload and source transcription remain outside Git.
- Audit the V1 presentation flow and inventory slides for opening and Sections 1-10.
- Improve V1 presentation incrementally while preserving the current teacher, student, and Firebase flows.

---

## How to Use This File
After a Codex session, update this file with:
- What Codex just built or changed
- What's still in progress or next
- Any gotchas or decisions made

Then when starting a new Cowork session, just say "check the handoff" and we'll be synced.
