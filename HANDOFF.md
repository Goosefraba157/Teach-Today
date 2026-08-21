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
- Open lessons expose editable Day 1/active-day and planned Day 2 dates on Home. Both save to local state and queue Firebase immediately on selection; Continue also commits the visible value before opening the lesson. Planned Day 2 dates persist across group switches without creating a Day 2 session early.
- Day 2 now defaults from Day 1 to the next Monday-Thursday instructional date (Thursday advances to Monday); the teacher can override it and the override saves immediately. “Complete Lesson As Is” accepts unfinished sections, completes the current automatic lesson number, and prepares the next planner date. “Plan a new lesson” preserves the current lesson as incomplete and uses the same next-instruction-date default; the next number is assigned automatically when saved.
- Consequential continuity actions are visually distinct and confirmation-gated: Complete Lesson As Is is green and confirms the current lesson will be saved complete; Plan a new lesson is amber and confirms the current lesson remains incomplete plus the next number/date being prepared.
- The selected Home group card now has a strong accent-colored outline/tint and an accessible pressed state. The purple continuity heading includes the group name before lesson number, day, and date, including after live date edits.
- Home includes a compact official lesson-history control for the selected current-year group. A teacher can select a prior lesson, edit its lesson number and Day 1/Day 2 dates, and save only after confirmation; duplicate lesson numbers receive an additional warning. Broad school-year reset and “Restart as Lesson 1” controls were removed because they were too risky and unnecessary for routine correction.
- A one-click Demo Group creates the synthetic demo students Maya, Jordan, and Eli with private demo-only IDs, so future workflow testing can stay out of official group records.
- The service worker now loads navigations, HTML, JavaScript, and CSS network-first with cached offline fallback. Large curriculum/image assets remain cache-first. This prevents newly deployed controls from remaining hidden behind a stale app-shell cache.
- `TeachToday.html` now uses deployment-specific query versions for `teach-today.css` and `teach-today.js`, and the service worker bypasses the HTTP cache for network-first app-code requests. Update these query versions with future V1 code/style releases so browsers cannot reuse an older fixed asset URL.
- Firebase sync version 3 writes each large backup to immutable revision-scoped chunks, then atomically points the private `/users/{uid}/teachTodaySync/main` document at the completed revision. A transaction blocks stale tabs from overwriting a newer browser sync. Legacy fixed chunks remain readable; if an interrupted legacy write left mixed invalid JSON, a signed-in tab can repair the pointer from its intact local state only if the cloud metadata has not changed. No Firebase rule change is required because revisions remain below the same owner-scoped path.
- Home now repeats the existing upper-right Firebase account control: signed-out browsers show “Sync,” while signed-in browsers show “Sign out” and the account name. Local changes continue to queue Firebase automatically.
- Signed-in browsers now listen to the private Firebase revision pointer. A device with no unsynced local edits automatically loads a newly completed revision from another device; a device with local edits keeps them intact, blocks automatic replacement, and shows that newer cloud data needs attention. This is safe whole-app synchronization, not simultaneous field-level collaborative editing.
- Fixed the realtime startup loop that could make two signed-in devices repeatedly publish identical revisions and reload each other. Authentication now writes only when local state is actually newer than the last successful Firebase sync; loading a cloud revision returns immediately and does not enqueue another copy.
- Home planning is now consolidated around a compact Recommended Plan and the full Customize workspace. The duplicated upper format picker, long read-only Assistant section list, Build Lesson, and unretrievable Save as Template action were removed from the primary UI. Readiness, recommendation rationale, timeline, and collapsible student evidence remain; Customize is the authoritative editor and contains the only format picker.
- “Redo Charting Page” replaces exact lesson duplication. It preserves the prior lesson and student evidence, keeps the same substep/reader/Section 4 charting page, proposes the next instructional date, chooses fresh Section 2 and 2B current words from that page when available, and chooses new review words from earlier substeps. It opens Customize for teacher review before Start Teaching creates the new numbered lesson.
- Removed a duplicate Section 8 Sounds picker from Customize.
- V1 Present mode now includes an `Ink` control in the existing right-side dock. It opens a compact floating palette available across every lesson section with pen/highlighter modes, eight colors, size control, undo, clear, and an interaction arrow that temporarily returns pointer control to the lesson while keeping marks visible. These presentation-wide marks are session-only and clear when Present mode ends.
- A `Laser` control now sits directly below Notes in the presentation dock. Holding or dragging shows a bright red point with a short fading tail; it never enters lesson records or permanent annotation state. Notes, laser, and active global ink are mutually exclusive so their canvases cannot compete for input.
- Section 9's existing passage-specific Pen/Highlighter canvas and controls remain unchanged and independent from the new presentation-wide ink layer.
- Until the Firebase revision update is visibly loaded on every open Teach Today tab, use one signed-in browser at a time. After deployment, simultaneous tabs no longer mix chunk JSON; a losing tab will show a refresh-required conflict instead of overwriting newer cloud data.
- Exact next step: after GitHub Pages publishes, refresh the hosted app and verify Present mode Ink and Laser with a mouse and touch/stylus across several sections, then confirm Section 9's original annotation tools still work independently. Also finish the hosted Demo Group checks for Recommended Plan, Customize, Redo Charting Page, and two-browser Firebase stability.
- Audit the V1 presentation flow and inventory slides for opening and Sections 1-10.
- Improve V1 presentation incrementally while preserving the current teacher, student, and Firebase flows.

---

## How to Use This File
After a Codex session, update this file with:
- What Codex just built or changed
- What's still in progress or next
- Any gotchas or decisions made

Then when starting a new Cowork session, just say "check the handoff" and we'll be synced.
