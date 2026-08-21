# Teach Today — Handoff File

> Update this after each Codex session so the next conversation can pick up immediately.
> Keep it short: what changed, what's next, any important context.

---

## Last Updated
2026-08-21

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
- Complete on 2026-08-19: published the historical WRS importer and imported the private 2025-2026 baseline into the authenticated hosted app. A backup was created first; 259 new charting records were added, one existing duplicate was skipped, Firebase sync completed, and the app now holds 321 charting records. The private payload and source transcription remained outside Git.
- Verified imported longitudinal profiles, graphs, group comparisons, and record tables on multiple current-year students. Historical evidence is visible across school years, while lessons, attendance, dictation, and recordings remain unchanged and are not fabricated.
- The ChatGPT in-app browser produced one false `navigator.onLine` offline warning even while Firebase was successfully syncing. Treat the Records panel's Firebase status as authoritative for now; improve connection detection separately so it attempts a real cloud check before showing an offline warning.
- Lesson format is now selected immediately after the group cards and remembered per group. Groups without a saved preference default to 45+45; Generate Best Lesson preserves the selected format, and the lower Customize selector stays synchronized.
- The V1 teaching workspace now expands responsively up to 1320px instead of remaining locked to 820px, using wide screens more effectively while preserving Section 9's larger reading layout and a compact mobile gutter.
- Section 2 affix cards now use a brighter yellow for clearer contrast from consonant cards. In 45+45 lessons, Section 2B has an independent interactive Day 2 card deck with chip selection, previous/next navigation, counts, and a working distinct “New set” action; Section 2 Day 1 behavior remains unchanged.
- Section 2 and 2B prefix/suffix cards retain their existing appearance but now share a consistent responsive rectangular width (136-176px), sized to fit longer affixes such as `-able` and `-ness` while remaining distinct from sound cards.
- The dated, numbered lesson-continuity workflow is committed and pushed on `main` at `2a16ab9`. Each group remembers its open lesson, active Day 1/Day 2, separate session dates, finished/skipped sections, scroll position, and saved-version notes. Home offers Continue, later-date Day 2, complete after Day 1, or preserve as incomplete and plan new. Start Teaching is now the primary action and opens Present mode; Plan New and Finish are explicitly named.
- Browser verification on a local-only server confirmed: Day 1 started as Lesson 1 with an explicit long date; finished Section 2 persisted; switching to another group and back restored the same lesson; Day 2 continued on a later chosen date under the same lesson number; Day 1's date remained visible; Day 2-only sections displayed; saved versions accumulated without replacing the prior record.
- V1 Present mode now has previous/next section arrows in the existing dock. Navigation and pace tracking use the visible teaching sequence, including Day 2 Sections 1B and 2B instead of skipping them. Local browser verification confirmed Day 1 moves from Section 1 to 2, Day 2 exposes 1B/2B/6-10, and Day 2 moves from 1B to 2B with no console warnings or errors.
- Open lessons now expose an editable active-day date on Home. Untouched test lessons also offer a guarded “Restart as Lesson 1” action: earlier generated plans are preserved as test records and excluded from automatic resume/last-lesson continuity, while the current plan becomes Lesson 1. Local browser verification confirmed the date updates the lesson heading immediately; the reset confirmation path still needs a hosted click-through after deployment.
- Exact next step: wait for GitHub Pages/service-worker refresh, then use the hosted untouched test lesson to choose the correct Day 1 date and restart that group at Lesson 1. Smoke-test Start Teaching → Day 1/Day 2 → previous/next section afterward, then continue the opening and Sections 1-10 presentation inventory.
- Audit the V1 presentation flow and inventory slides for opening and Sections 1-10.
- Improve V1 presentation incrementally while preserving the current teacher, student, and Firebase flows.

---

## How to Use This File
After a Codex session, update this file with:
- What Codex just built or changed
- What's still in progress or next
- Any gotchas or decisions made

Then when starting a new Cowork session, just say "check the handoff" and we'll be synced.
