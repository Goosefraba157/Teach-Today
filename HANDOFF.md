# Teach Today — Handoff File

> Update this after each Codex session so the next conversation can pick up immediately.
> Keep it short: what changed, what's next, any important context.

---

## Last Updated
2026-08-23

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
- **Student display** — manual privacy/poster/HFW/chart/passage/game modes plus Follow Lesson and student-safe Section 6 sound reference, Section 7 magnetic journal, and Section 8 dictation paper
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
- Firebase sync version 4 writes each large private backup to immutable revision-scoped chunks plus a manifest, then atomically points `/users/{uid}/teachTodaySync/main` at the completed revision. Revision-ID transaction preconditions block stale overwrite; legacy fixed and version-3 chunks remain readable. No Firebase rule change is required because revisions and per-device recovery pointers remain under the same owner-scoped path.
- Home now repeats the existing upper-right Firebase account control: signed-out browsers show “Sync,” while signed-in browsers show “Sign out” and the account name. Local changes continue to queue Firebase automatically.
- Signed-in browsers listen to the private Firebase revision pointer. Clean devices load newer cloud state; devices with instructional edits reconcile against their last confirmed baseline. Independent stable-ID records and lesson edits merge automatically, while same-field collisions retain the cloud value and archive the competing device branch for recovery. This is safe record-aware synchronization, not character-by-character collaborative editing.
- Fixed the realtime startup loop that could make two signed-in devices repeatedly publish identical revisions and reload each other. Authentication now writes only when local state is actually newer than the last successful Firebase sync; loading a cloud revision returns immediately and does not enqueue another copy.
- Home planning is now consolidated around a compact Recommended Plan and the full Customize workspace. The duplicated upper format picker, long read-only Assistant section list, Build Lesson, and unretrievable Save as Template action were removed from the primary UI. Readiness, recommendation rationale, timeline, and collapsible student evidence remain; Customize is the authoritative editor and contains the only format picker.
- “Redo Charting Page” replaces exact lesson duplication. It preserves the prior lesson and student evidence, keeps the same substep/reader/Section 4 charting page, proposes the next instructional date, chooses fresh Section 2 and 2B current words from that page when available, and chooses new review words from earlier substeps. It opens Customize for teacher review before Start Teaching creates the new numbered lesson.
- Removed a duplicate Section 8 Sounds picker from Customize.
- V1 Present mode now keeps its compact Ink palette visible beside the lesson across every section. It opens automatically in the arrow/interact state, so lesson controls and scrolling work normally until Pen or Hi is selected. The palette provides eight colors, size, undo, and clear; its session-only marks clear when Present mode ends. The redundant visible Notes drawing button and Ink open/close button were retired.
- A `Laser` control now sits directly below Notes in the presentation dock. The bright red point follows pointer movement, leaves a short fading tail, and allows normal clicks on lesson buttons because its canvas is visual-only. When Laser is active, a small mode control defaults to `Scoop`, capturing all touch-style styluses without scrolling; switching it to `Scroll` restores finger/passive-stylus page scrolling without turning Laser off. This explicit fallback is required because iPad browsers report many generic capacitive styluses as ordinary touch. Laser never enters lesson records or permanent annotation state. Notes, laser, and active global ink are mutually exclusive.
- Section 9's existing passage-specific Pen/Highlighter canvas and controls remain unchanged and independent from the new presentation-wide ink layer.
- On wide or zoomed-out screens, the always-visible Ink palette and right presentation dock are anchored just outside the centered 1480px lesson workspace rather than drifting to the browser edges. Narrow screens retain safe viewport-edge fallbacks.
- Stage now has an additive `Follow Lesson` mode that tracks the visible Present section without rerendering the teacher page. Section 4 projects only the clean charting wordlist, Section 6 a sound reference, Section 7 a blank magnetic journal, Section 8 clean dictation paper, and Section 9 the passage; sections without an approved student renderer fail closed to the neutral privacy screen. Manual Stage choices remain overrides.
- Hosted side-by-side classroom testing confirmed Follow Lesson reliably tracks the teacher section. Sections 2 and 2B now project the currently built word cards, Section 3 projects the active card from the chosen deck, and Section 5 projects the active sentence instead of falling back to privacy. Card and sentence changes update Stage without refreshing or moving the teacher page.
- Section 7 still follows to the clean magnetic journal by default. A manual `Cards` Stage choice displays the selected Section 7 spelling word with its card split; selecting another spelling word updates that display immediately.
- The Stage payload is minimized for projection: it uses a generic Teach Today label and does not include the active student, scoring controls, errors, records, or teacher notes. A dormant `window.webkit.messageHandlers.teachTodayStage` hook is ready for a future native iPad shell; ordinary browsers ignore it.
- Local browser verification with a synthetic test lesson confirmed Follow transitions for Sections 4, 6, 7, and 8, privacy fallback, manual override, Day 1/Day 2 navigation, and unchanged Present ink/dock layout with no console errors. No Firebase or student-record format changed.
- Full Xcode 26.6 and the iOS 26.5 platform are installed on the current Mac. The target iPad (A16, iPadOS 26.6) has Developer Mode enabled and trusts the local Personal Team profile.
- Added the isolated `ios/TeachTodayStageProof/` UIKit project. It has separate main and `windowExternalDisplayNonInteractive` scenes, contains no Teach Today/Firebase/student data, compiles for physical iPad, and is installed on the target iPad.
- Hardware-path proof succeeded over AirPlay Screen Mirroring to the Mac: the iPad retained teal `A / Teacher Screen` while the receiver showed blue `B / Student Stage`. For this tested route, start mirroring and then close/reopen Stage Proof so iPadOS connects the external scene. AirPlay is the preferred classroom path for Newline/Promethean boards; USB-C/HDMI remains the fallback.
- The native proof has been evolved into the first Teach Today iPad shell. Its main scene loads the hosted V1 teacher app in a persistent `WKWebView`; its external scene loads the hosted `StudentDisplay.html` in a nonpersistent, noninteractive `WKWebView`. The existing browser Present/Stage route remains unchanged.
- Native Stage messages are accepted only from the trusted GitHub Pages app origin and pass through a second Swift whitelist. The native shell forces a generic group label, rejects unapproved fields and external asset URLs, holds only the latest sanitized payload in memory, and replays it after an external display reconnects.
- The external scene never falls back to the teacher screen automatically. Loading, network, and web-process failures show a neutral Classroom Stage screen and retry without exposing the teacher surface. Firebase remains entirely owned by hosted V1; the native shell adds no Firebase configuration, records, or migration.
- Verified the new shell with signing disabled for generic physical iOS and the matching A16 simulator. The simulator rendered hosted Teach Today at full iPad size, and a standalone sanitizer check confirmed that sample student names, notes, scores, and untrusted absolute image URLs do not cross the native Stage boundary.
- The native webview shell is installed on the target iPad. The user confirmed it loads the hosted app on its own, preserves the existing Present experience, and drives the separate external student display correctly over Screen Mirroring.
- The native shell now adds an explicit `Mirror Teacher` choice for sections where students need to see the teacher's exact V1 webview. It streams transient `WKWebView` snapshots to the already-connected external scene, keeps no frame history, requires a warning confirmation because names/records may be visible, and returns immediately to sanitized Stage when any Stage choice is selected.
- Mirror is native-only and never automatic. Stage remains the privacy-safe default, ordinary browser behavior is unchanged, and the native shell returns to Stage whenever the teacher scene resigns active or the web process restarts. Connect Screen Mirroring first, then deliberately select Mirror Teacher.
- The hosted Mirror control also requires the native projection message handler, so it stays hidden in ordinary browsers and older installed shell builds until the matching native binary is installed.
- Native `window.confirm()` dialogs are handled by the trusted-origin teacher webview. This is required for the Mirror Teacher privacy warning and the V1 app's other guarded actions; untrusted/subframe confirmations fail closed.
- The confirmation-handler build was compiled, signed through Xcode, installed, and launched on the connected iPad on 2026-08-22. Hardware verification then confirmed that Mirror Teacher shows the exact teacher webview and that selecting Follow Lesson returns immediately to the sanitized student display.
- The Mirror implementation compiles successfully for generic physical iOS with signing disabled and passes JavaScript syntax, plist, diff, and local browser checks. Both command-line signing and Xcode Run reach Apple `codesign` but wait for local Keychain authorization. The Mac account owner must approve the signing-key access when running this native revision; do not commit the local Personal Team setting.
- Firebase revision 4 treats Firebase as the signed-in online authority while retaining local browser state as an offline cache and recovery layer. Device-only selected group/year, open tabs, scroll positions, and active student do not dirty the shared database.
- Section 4 student pills no longer expose recent performance colors. They now show a neutral unfinished circle or a green `Saved` marker based only on whether that student has a charting record for the current official lesson.
- Section 4 Start, Pause, and Stop controls now use distinct teal, amber, and red states. Stop still saves automatically; changing students now finalizes audio and charting through the same save path; scrolling out of Section 4 or using presentation navigation auto-stops and saves meaningful unsaved charting. Page hiding/unloading retains a synchronous chart-data safety save.
- Local synthetic browser verification confirmed scrolling from Section 4 to Section 5 auto-saves the active student's current-lesson record, updates only that pill to `Saved`, preserves the existing chart summary, and produces no console errors. No record schema, Firebase rule, or Stage payload changed.
- A cross-device demo lesson exposed two protected local copies: one device held Lesson 1 with the current-lesson chart record, while the iPad held a separately edited Lesson 3. The green header timestamp is the lesson-plan copy's `savedAt`, not the chart-record time; current-lesson student markers differ when the active plan IDs differ.
- The replacement sync design preserves a differing device copy in local IndexedDB Recovery and an immutable private Firebase recovery revision before installing or merging cloud state. Clients with a common confirmed baseline automatically three-way merge stable-ID groups, lessons, students, and records; true same-field collisions use the current cloud value while retaining the device branch for recovery.
- The Records & Data panel exposes Download latest recovery after a recovery snapshot exists. Local folder backups remain dated full copies but no longer auto-restore during save/connect, preventing an old folder copy from silently overruling Firebase.
- Firebase revision 4 was published from commit `644b6f5` and GitHub Pages deployment 84 completed successfully on 2026-08-23. The public page serves `sync-safety.js?v=20260823-authoritative-sync-1`, and the public service worker serves cache `teach-today-offline-v2026-08-23-authoritative-sync-1` with the recovery helper included.
- The user's local Personal Team signing change remains intentionally uncommitted in `ios/TeachTodayStageProof/TeachTodayStageProof.xcodeproj/project.pbxproj`; do not stage it.
- Exact next step: open the signed-in hosted app on the Mac first and let it report Firebase up to date. Then open/relaunch the iPad shell; its differing local copy should be preserved automatically and the Firebase copy should load. Verify both devices show the same demo lesson number, version count, header save time, and current-lesson chart marker. Download the iPad recovery from Records & Data as a spot check before resuming edits on both devices.
- Audit the V1 presentation flow and inventory slides for opening and Sections 1-10.
- Improve V1 presentation incrementally while preserving the current teacher, student, and Firebase flows.

---

## How to Use This File
After a Codex session, update this file with:
- What Codex just built or changed
- What's still in progress or next
- Any gotchas or decisions made

Then when starting a new Cowork session, just say "check the handoff" and we'll be synced.
