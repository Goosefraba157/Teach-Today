# Teach Today — Change Log

This is a concise development record. Student names, IDs, results, and other private data do not belong here.

## 2026-08-30

- Expanded Customize Section 2 and Section 2B review-source buttons from the recent eight substeps to the current substep plus every earlier substep; Sections 3 and 7 keep their existing recent-substep scope.
- Added view-only Reader concept filters after a review source is chosen. The default `All {substep}` view preserves the complete existing pool, Reader page concept/subtitle buttons narrow it, and pages without concept labels receive a `Regular {substep}` group.
- Added filters for word elements introduced at the selected review substep. Substep 2.1 now includes `ng & nk words`, `+ suffix`, and separate `/ang/`, `/ing/`, `/ong/`, `/ung/`, `/ank/`, `/ink/`, `/onk/`, and `/unk/` choices.
- Made Section 2 and Section 2B source/filter state independent. Changing a filter never changes selected words or adds filter state to saved lessons, student records, Firebase sync, backups, or storage schemas.
- Added chart-page concept grouping and regression coverage, refreshed offline asset versions, and verified all-prior navigation, unlabeled-page grouping, preserved selections, Section 2/2B independence, unchanged Sections 3/7, and a clean console in a local browser walkthrough.
- Published the review-word concept filters to GitHub `main` at commit `b0c6d70`; the successful Pages deployment and live `20260830-review-concept-filters-1` asset marker were verified.

## 2026-08-29

- Simplified Home to one lesson path per selected group: unfinished lessons now hide the new planner and show their exact identity with one primary Continue Lesson action, while groups without an open lesson show the full Customize planner by default.
- Removed the competing Home Open current lesson, hidden Customize toggle, duplicate preview-only launch, and teaching-toolbar Start Teaching controls; renamed the remaining actions to Start Planned Lesson, Continue Lesson, End & Plan New, and Finish Lesson according to their actual effects.
- Made Customize the authoritative quick-planning surface and moved lesson history beneath it. Starting a lesson now consumes the exact visible preview, while End & Plan New returns to Home planning instead of generating a competing lesson immediately.
- Added hard guards against starting a second lesson while one is unfinished and against overwriting a completed or incomplete same-date plan. Explicit incomplete closure preserves the original lesson, its history, and combined-session links.
- Added single-path Home regression coverage and verified a synthetic 3.5 Reader 3 page 142 preview opened with the identical Section 2 selections and became the sole active Home continuity lesson.
- Added a generated, curriculum-only enhanced planning index for Substeps 1.3-7.5: 347 charting pages, 9,073 indexed words with structure metadata, 320 chart-page sentence recommendations, and 262 chart-page dictation recommendation sets. Existing logic remains the fallback for 1.1-1.2 and Steps 8-12.
- Made the exact Section 4 charting page the planning anchor and automatically recommend a matching available Section 5 sentence page; direct charting-page changes update the recommendation without changing Section 4 scoring, halves, timer, stage, or record behavior.
- Made Customize, preview, and Start Teaching share one canonical planned lesson snapshot, with additive planning source/anchor/selection metadata preserved in the existing whole-lesson JSON save path.
- Improved Sections 2/2B/3 review selection with recent student evidence and indexed prior-page words while keeping current words tied to the exact selected page and preserving their teaching displays.
- Separated Section 6 from Section 8 planning, preserving grouped vowel/consonant/welded/element targets and using recent trouble/review evidence for enhanced substeps.
- Added indexed Section 7 review/current/nonsense/HFW planning and word-first Section 8 planning that derives sounds and word elements from the five selected real words and prioritizes exact-page dictation sentence recommendations.
- Kept the full Section 6 and Section 8 shared reference controls available behind collapsed disclosures so the per-student data boxes remain the primary compact teaching surface.
- Preserved tap-again removal and exclusive Auto/Acc/Strug behavior in Sections 6-8, restored saved button state by stable student ID, and added non-saving metadata suggestions for NS/Blends/Vowel Diff/HFW/Sfx tags.
- Kept existing student evidence arrays, record IDs, lesson history, Firebase sync, backups, and exports unchanged; legacy entries without a category now display as `Previous / uncategorized` in Student Profile.
- Added regression tests for enhanced coverage/fallbacks, exact page recommendations, generated-asset privacy, Section 6/8 separation, canonical snapshot use, and additive JSON persistence.

## 2026-08-28

- Made Presentation Laser's Scoop mode lock touch/stylus scrolling from the start of the gesture across the actual lesson surface, with pointer capture and an iPad touch fallback; Scroll mode deliberately restores normal panning.
- Kept the fixed left and right presentation toolbars plus actual in-lesson buttons, links, fields, and selectors tappable during Scoop without reopening page scrolling; preserved mouse laser behavior and left all student, lesson, Firebase, sync, backup, and storage data contracts unchanged.
- Added a long Scoop-only scroll strip beneath Top in the right presentation dock. Stylus/finger movement inside that dedicated strip scrolls the page in the matching direction while the lesson surface remains locked for scooping.
- Increased the Scoop scroll strip to a high-sensitivity 4:1 travel ratio so short stylus movements move through long lesson pages quickly without enabling native scrolling elsewhere.
- Fixed manually entered students being silently omitted when the teacher saved a group without first pressing the separate Add button, and assigned every new roster entry a permanent private student ID immediately.
- Removed the five-name Home-card truncation so the complete permanent roster is visible on each group card.
- Added inline student display-name correction in the group editor. Renames preserve permanent identity, old-name matching, historical snapshots, attendance, charting, and other student records.
- Added explicit permanent moves between current-year groups, with dated membership intervals and a visible past-membership summary; removals and moves do not delete lessons or student data.
- Added a one-session Combine action on every current group card. Teachers can select any groups and a session date, teach from one combined roster, and leave every permanent roster unchanged.
- Made past-date combinations attach an already-saved host lesson to each selected group's history, so a session recorded before this release can be classified without moving or rewriting student evidence.
- Added stable-ID participant snapshots that lock once student data or attendance exists, read-only linked lesson history in every joined group, combined-session attendance propagation, school-year-filtered cross-group Student Profile evidence lookup, and home-group-at-time metadata for new student evidence.
- Added sync-safety entity merging for membership history and name-change audit entries, including regression coverage for independent membership and group edits.
- Published commit `987c858` to GitHub Pages and verified the successful deployment plus the versioned HTML and JavaScript roster-membership markers.
- Published the final past-session bridge through commit `c2bebaa` and verified GitHub Pages serves the `20260828-roster-membership-2` HTML and JavaScript markers.

## 2026-08-27

- Added automatic independent recovery copies of each newly confirmed Firebase revision to Google Drive and native iPad Files, with daily and weekly dated filenames.
- Added native payload validation, atomic writes, SHA-256/readback verification, Drive byte-size verification, and a small non-blocking failure notice with persistent Records status. The backup path does not restore, merge, delete, or modify Firebase data, and retention pruning remains disabled for the initial safety rollout.
- Added a repository-wide fast recovery runbook for Codex, Claude, and future maintainers: use the teacher's selected downloaded checkpoint before searching Firebase, stop writes, preserve the current cloud copy, preview stable-ID differences, and recover additively only.
- Documented practical backup sizing: approximately 3-5 MB per human-readable daily checkpoint at the current database size, with 1-2 GB recommended for a cumulative school-year archive; audio remains separate.
- Added an automatic private Cloud backup timeline to Records & Data. Successful changed-data Firebase saves now index their immutable revisions into six four-hour recovery windows per day, giving a year-scale history without duplicating full student payloads.
- Added read-only checkpoint downloads with date, size, reason, and record/lesson counts for new revisions. Viewing or downloading the timeline cannot restore, merge, overwrite, or delete live data.
- Added a native Stage safety gate and a read-only `Load protected Firebase copy` path so a stale Stage copy cannot automatically upload over a recovered cloud copy; deliberate upload/merge remains separately labeled.
- Applied the authorized private Firebase recovery as a stable-ID additive merge instead of restoring an older whole-app snapshot. Preserved the pre-recovery live payload as a separate immutable revision, wrote the merged payload to a new immutable revision, and changed the main pointer only under an unchanged-update-time precondition.
- Verified the merged revision by exact chunk readback and aggregate checks: 379 master records, 21 groups, 64 saved lessons, 118 chart summaries, 83 encoding observations, 14 dictation misses, 13 legacy attendance records, 6 explicit attendance sessions, 3 attendance-activity entries, 8 lesson drafts, 2 Section 2 overrides, and 52 unique protected roster profiles. No records or prior revisions were deleted or overwritten.
- Stopped automatic signed-in startup retries for pending Firebase Storage audio after failed retries were found to create shared revisions and a cross-device reload loop. Existing recordings, recording links, instructional records, and deliberate Google Drive audio remain unchanged.
- Added a protected all-recoveries export so every locally retained reconciliation branch can be compared before any additive data recovery; the existing latest-Recovery download remains available.
- Moved Section 4's single timer dock beneath the selected Top or Bottom charting board so the timing controls stay close to the words being scored.
- Preserved one uninterrupted timer when the teacher switches halves or works in the notes area; no performance-linked color or student-facing signal was added.

## 2026-08-26

- Disabled autocorrect, spellcheck, and automatic capitalization only on Section 4 `said...` response fields so iPad keyboard and stylus transcriptions remain verbatim without changing charting behavior.
- Added a charting school-year selector to Student Profile. Charting summaries, metrics, trends, sheets, recordings, comparisons, and record tables default to the active July-June school year while prior years remain available deliberately.
- Added a toggleable Charting History panel beside Section 4's purple controls. It can show prior records for any student currently in the group and switch school years without changing the active live-charting student or modifying saved data.
- Classified dated charting records by their actual session date before fallback metadata, preventing older sessions from being mixed into the current year after a school-year metadata backfill. No charting, student, lesson, or sync data was migrated or rewritten.
- Replaced inferred/default-present attendance with explicit confirmed daily sessions. A persistent, gently pulsing lesson reminder allows one-tap all-present marking, individual present/absent confirmation, or an explicit no-session dismissal without blocking lesson preparation.
- Allowed one attendance date to reference the same lesson across any combination of Day 1 and Day 2 portions; switching lesson portions after confirmation updates the same session rather than creating duplicate attendance.
- Added prior-date attendance editing from both the lesson attendance controls and student calendar, including lesson selection, local dates, optional notes, stable private student-ID mappings, and an audit snapshot for corrections.
- Preserved all legacy attendance and student records without automatic migration or deletion. Explicit corrected sessions take precedence only for the dates the teacher deliberately saves.
- Published the confirmed-attendance release to GitHub Pages and verified the versioned HTML and JavaScript are live.
- Refined the attendance popup for classroom speed: every unsaved date now opens with the roster preset present, teachers toggle only absences, and lesson portions are collapsed into an advisory coverage summary that detects meaningful section controls and presentation navigation without treating scrolling as instruction.
- Replaced the prior-date attendance list with a four-week calendar distinguishing confirmed sessions, explicit no-session dates, legacy records needing review, and blank dates.
- Locked the lesson page behind the scrollable attendance popup, including iPad-style overscroll containment and exact background-position restoration after closing.
- Published the refined attendance workflow to GitHub Pages and verified the `20260827-attendance-ux-4` HTML and JavaScript are live.
- Brought 45+45 Section 2B to full interaction parity with Section 2: matching source groups, charting/review tools, custom words, card editing, whiteboard, applicable intro launches, navigation, and student Stage output while preserving independent Day 2 review/current words.
- Left Section 2 and all existing lesson/student/charting data contracts unchanged; no migration or saved-data rewrite is part of the Section 2B patch.
- Replaced the recreated Section 8 Student Stage worksheet with a full-page lossless rendering of the official WRS Student Dictation Page for both manual Paper and Follow Lesson modes.
- Kept the generated worksheet as a loading/error fallback and precached the official page for reliable offline use in browsers and the native iPad Stage shell.

## 2026-08-18

- Re-established V1 as the active application and paused `/v2/` development.
- Preserved recovered V1 presenter work and presenter prototype files.
- Added the V1 focus map and privacy migration plan.
- Added permanent private student IDs and school-year metadata.
- Removed real public roster defaults from tracked application code.
- Prepared owner-scoped Firebase rules and a legacy ownership migration with a required safe deployment order.
- Protected student portal data and removed tracked files containing student information from the current tree.
- Published five recovery/privacy commits to GitHub `main`.
- Added repository-wide continuity instructions, durable decisions, and a private local intake workflow.
- Added a count-only preview before the legacy privacy migration changes any records; the migration uses `teacherUid` for teacher ownership, while `ownerUid` remains reserved for student-side authentication.
- Audited the live Firebase project: confirmed the private per-user backup, found no legacy portal collections, deployed strict Firestore rules, blocked the shared legacy path, and verified a successful private sync after deployment.
- Removed the obsolete legacy student migration button after confirming there were no records requiring that migration.
- Added a school-year selector to the V1 home screen so the current year is shown by default and archived groups remain available without mixing into daily planning.
- Privately imported and verified the 2026-2027 teaching groups in the hosted app, reusing confirmed student identities and syncing the result to the authenticated Firebase record. No roster data was added to Git.
- Added current-year group editing for names, schedules, instructional placement, and student membership while preserving student profiles and historical records; archived groups remain protected.
- Added a backup-first, duplicate-resistant historical WRS charting importer and student-ID-based longitudinal profile/lesson-assistant lookups. Historical evidence does not fabricate lessons, attendance, dictation, or recordings.

## 2026-08-19

- Published and completed the private 2025-2026 historical WRS baseline import: 259 records added, one duplicate skipped, backup created first, and authenticated Firebase sync verified.
- Verified that longitudinal profiles, performance graphs, comparisons, and historical record tables display the imported evidence without creating lesson, attendance, dictation, or recording records.
- Documented a false offline-banner condition in the embedded browser; Firebase continued syncing successfully despite the unreliable browser network flag.
- Added a per-group lesson-format preference directly below the group cards. New groups default to 45+45, both format selectors stay synchronized, and Generate Best Lesson preserves the selected format.

## 2026-08-20

- Widened the V1 teaching workspace responsively to use desktop and laptop screens more effectively while retaining Section 9's larger passage layout and compact mobile spacing.
- Increased the visual contrast of prefix/suffix cards and upgraded 45+45 Section 2B from static word chips to an independent interactive Day 2 word-building deck with navigation and regeneration.
- Standardized Section 2/2B prefix and suffix cards to a wider responsive rectangle that fits longer affixes consistently without changing card classification or behavior.
- Added per-group lesson identity and continuity: numbered lessons, teacher-selected dates, separate Day 1/Day 2 dates, open-lesson resume prompts, partial completion, preserved incomplete lessons, section-progress persistence, and lightweight saved-version history.
- Clarified lesson actions as Start Teaching, Plan New, and Finish; Start Teaching now saves the active session and opens Present mode by default.

## 2026-08-21

- Added previous/next section controls to the V1 presentation dock and made presentation navigation and pace tracking follow the currently visible Day 1 or Day 2 sequence, including interactive Sections 1B and 2B.
- Added editable dates for open lesson sessions and immediate persistence for active-day and planned Day 2 selections across group switches.
- Added confirmed official lesson-history corrections for lesson numbers and Day 1/Day 2 dates plus a one-click synthetic Demo Group for isolated workflow testing.
- Removed the broad school-year reset and “Restart as Lesson 1” controls after review; official date/number corrections remain available through the guarded history editor.
- Defaulted Day 2 and newly planned lessons to the next Monday-Thursday instructional date, renamed completion to “Complete Lesson As Is,” and made incomplete sections valid when completing a lesson.
- Gave Complete Lesson As Is and Plan a new lesson distinct high-visibility colors and expanded both confirmation messages to state the resulting lesson status, number, and next date.
- Made the selected group unmistakable with a stronger card highlight and repeated the group name in the Home continuity heading.
- Replaced stale fixed V1 asset query strings with deployment-specific versions and made network-first service-worker fetches bypass the browser HTTP cache.
- Prevented concurrent Firebase chunk corruption by writing immutable revision-scoped backups, atomically switching the private main pointer, blocking stale-browser overwrites, and safely repairing interrupted legacy chunk JSON from an intact signed-in local copy.
- Added the existing Firebase account/sync control to Home and realtime private-revision detection so idle devices can load completed changes promptly while browsers with unsynced edits are protected from automatic replacement.
- Stopped signed-in startup from publishing unchanged Firebase revisions, preventing two open devices from repeatedly reloading identical data.
- Consolidated Home planning into a compact data-driven Recommended Plan plus the authoritative Customize editor, removing duplicate format controls, redundant section summaries, Build Lesson, and the unfinished template action.
- Replaced exact lesson duplication with same-charting-page reteach planning that preserves history while refreshing Section 2/2B current words and prior-concept review words, and removed a duplicate Section 8 Sounds picker.
- Changed service-worker handling for app code to network-first with offline fallback so GitHub Pages updates appear promptly; large curriculum assets remain cache-first.
- Added presentation-wide floating pen/highlighter tools for every lesson section, including color, size, undo, clear, and an interaction mode, while preserving Section 9's independent passage annotation tools.
- Added a non-persistent presentation laser directly below Notes with a bright red point and short fading tail.
- Made the presentation laser follow the mouse without clicking and pass all clicks through to the lesson controls beneath it.
- Prevented moved touch gestures from scrolling Present mode while Laser is active, preserving taps for controls and drags for visible syllable scoops.
- Refined Laser input for stylus teaching: finger gestures scroll the lesson while mouse/stylus movement controls the laser, so Laser can remain enabled during navigation.
- Added an explicit Laser Scoop/Scroll mode for generic capacitive styluses that iPad reports as touch; Scoop captures their movement and Scroll restores page navigation without disabling Laser.
- Made the presentation Ink palette always visible in arrow/interact mode, retired the redundant visible Notes and Ink-toggle controls, and anchored both floating toolbars beside the centered lesson workspace on wide screens.
- Added a privacy-first Follow Lesson mode to Student Stage. It follows the visible Present section without refreshing the teacher page, preserves all manual Stage overrides, and falls back to a neutral screen when a section has no approved student renderer.
- Added separate student-facing Stage renderers for Section 6 sound reference, Section 7 magnetic journal, and Section 8 dictation paper; Section 4 continues to project only its clean charting wordlist.
- Added an optional native iPad Stage bridge hook while leaving the existing browser presentation and Firebase/student-record formats unchanged.
- Expanded Follow Lesson with approved student renderers for Section 2/2B built-word cards, the active Section 3 card, and the active Section 5 sentence, plus a manual Cards display for selected Section 7 spelling words.
- Verified the new card and sentence Stage payloads at projector size, live cross-window switching, and the main V1 page in headless Chrome with no console or page errors.

## 2026-08-22

- Installed Xcode and the iOS platform, enabled Developer Mode on the target iPad, and configured local Personal Team signing without storing the team identifier in Git.
- Added an isolated, data-free UIKit Stage proof with separate private iPad and noninteractive external-display scenes.
- Built, signed, installed, and launched the proof on the target non-M1 iPad.
- Verified the split-display path over AirPlay Screen Mirroring: the iPad retained the teal teacher `A` scene while the Mac receiver displayed the blue student `B` scene after reopening the app with mirroring connected. USB-C/HDMI remains the fallback.
- Evolved the A/B proof into a native iPad web shell: the main scene hosts the existing V1 teacher app and the external scene hosts the student display without changing either browser route.
- Added trusted-origin native Stage handling, a second Swift payload whitelist, generic projected labels, in-memory-only relay, and rejection of unapproved fields and external asset URLs.
- Added a nonpersistent, noninteractive student webview with neutral reconnect fallback, retry, and latest-payload replay; Firebase and private records remain owned by hosted V1.
- Added native popup handling for the hosted sign-in flow and suppressed the redundant browser Student Stage popup when the external scene owns projection.
- Verified generic physical-iOS and A16 simulator builds, full-size hosted V1 rendering in the simulator, and a standalone sanitizer check.
- Installed and hardware-tested the native webview shell on the target iPad; the hosted teacher app retained its existing Present flow while Screen Mirroring received the separate student display.
- Added a native-only, confirmation-gated Mirror Teacher mode that projects transient snapshots of the exact teacher webview for sections that need live modeling, without storing frames or changing browser presentation behavior.
- Kept sanitized Stage as the default and made every Stage selection, app background transition, and web-process restart end teacher mirroring immediately.
- Hid Mirror Teacher unless the matching native projection bridge is present, preventing older installed shell builds from showing a control they cannot execute.
- Added trusted-origin JavaScript confirmation handling to the native teacher webview so approving the Mirror Teacher privacy warning actually activates projection; untrusted and subframe dialogs fail closed.
- Compiled, signed, installed, and launched the corrected confirmation-handler build on the connected iPad for hardware Mirror testing.

## 2026-08-23

- Hardware-tested native Mirror Teacher and confirmed that the external display follows the exact teacher webview, then returns to sanitized Follow Lesson when selected.
- Replaced Section 4's recent-performance dots with current-lesson charting status so each student shows a neutral unfinished state or a green `Saved` marker without exposing performance at the live teaching surface.
- Gave Start, Pause, and Stop distinct control colors and unified Section 4 finalization so Stop, student changes, section navigation, and scrolling into the next section automatically preserve meaningful charting data.
- Added page-hide/unload chart-data protection, refreshed V1 asset/cache versions, and verified the scroll-to-Section-5 autosave flow locally with synthetic data and no console errors.
- Replaced the ambiguous Firebase conflict retry with explicit backup-first choices: save the device's local copy, deliberately load the cloud copy after confirmation, or keep the device offline. Ordinary connection failures retain the normal retry action.
- Upgraded private Firebase sync to an authoritative revision-4 workflow with per-device shared-state signatures, immutable revision manifests, transaction retries, and three-way reconciliation from the last confirmed cloud baseline.
- Separated device-only navigation and student-selection state from shared instructional records so scrolling or changing the active student no longer creates false cross-device conflicts.
- Added automatic local Recovery snapshots plus immutable private Firebase recovery branches before cloud replacement or reconciliation, with a Records & Data action to download the latest recovery file.
- Made local-folder syncing backup-only: it continues writing dated full backups but never auto-restores during an ordinary save or folder connection.
- Published and verified the revision-4 authoritative sync release on GitHub Pages, including the versioned recovery helper and updated offline cache.
- Replaced Section 4 Stage's recreated word sheet with the authentic embedded Reader PDF page, full-page projector fitting, a generated-page loading/error fallback, strict Reader/page path derivation, and offline caching for all Reader PDFs.
- Fixed iPad Stage opening the Reader cover by replacing raw Section 4 PDF embedding with 583 exact lossless page images generated from the official Reader PDFs. The correct Reader/page now fills Student Stage consistently in browsers and `WKWebView`; strict path derivation, the clean generated fallback, and runtime offline caching remain intact.

## 2026-08-24

- Added a dedicated 19-scene Substep 2.1 Section 2 introductory presentation with automatic card reveals, paired welded-sound reading, three-finger tapping, word building, guided practice, suffix handling, concept marking, teacher cues, keyboard navigation, and a clean return to ongoing Section 2 practice.
- Extended Follow Lesson and the native Stage sanitizer so the introductory sequence projects as separate student-safe scenes while teacher prompts remain private.
- Verified the prototype's key scenes, live browser Stage synchronization, finish behavior, and iPad-sized layout; the native iOS Stage shell also builds successfully with the expanded sanitized card payload.
- Added a separate 24-scene `Visual Discovery` version of the 2.1 introduction while preserving the original guided version. Students now discover shared endings and changing vowels before reveals, connect auditory and visual patterns, and contrast the commonly confused `ang/ing`, `ank/ink`, `ong/ung`, and occasional `ang/ong` sounds.
- Reused the exact 2.1 Section 1 keyword artwork, corrected suffix cards to a wider hyphenated `-s` form, changed marking practice to question-then-reveal steps, and added a student notebook scene matching the official `ng` page 6 and `nk` page 7 entries.
- Verified all 24 discovery scenes and both Stage renderers in the live browser, confirmed the original 19-scene intro remains available, passed JavaScript and sync-safety checks, and rebuilt the native iOS Stage shell successfully.
- Replaced the 2.1 poster crops with individual sound-card images for `ang`, `ing`, `ong`, `ung`, `ank`, `ink`, `onk`, and `unk`; added matching short-vowel mouth-position images to all four pronunciation contrasts; and cached the lesson assets for offline use. Rechecked every discovery scene plus teacher and Student Stage layouts with no missing images or overflow.
- Added a 28-scene Substep 3.5 Visual Discovery that introduces `-ing` and `-ed` from the familiar `bug + -s` suffix model, keeps the base word unchanged and first, and confines introductory `-ed` pronunciation to `/ĕd/` or `/id/` as directed by the manual.
- Added a Section 7 spelling-discovery entry point that opens directly on the base-protection routine, including face-down base/suffix cards, staged `landed` and `melting` spelling, marking practice, and the Suffix Endings notebook entry.
- Extended the clean student Stage renderer for all 3.5 discovery layouts, kept teacher cues out of projection, fixed the shared intro overlay's dynamic substep label, and corrected the full-lesson group-day picker to handle its intentional no-day selection without a console error.
- Browser-audited all 28 teacher scenes, both Section 2 and Section 7 launch paths, live Stage following, layout overflow, and preservation of the existing 19/24-scene 2.1 intros; JavaScript syntax and sync-safety checks pass, and the native iOS Stage shell builds successfully.

## 2026-08-25

- Stabilized Laser Scoop on touch/stylus devices: activation no longer seeds a stuck point at the Laser button, lift/cancel releases the live tip, Scoop captures touch correctly inside Visual Discovery as well as Present mode, and the left ink palette cannot steal Scoop gestures while the mode is active.
- Revised 3.5 meaning and Section 7 spelling slides to follow the manual's exact base-first prompts, including separate monosyllabic tapping and multisyllabic syllable language, facedown-card modeling, and base-then-whole-word rereading.
- Fixed suffix-word rendering so the actual base word—not an explanatory label—is underlined, made every base underline continuous below descenders, and clarified the past-action `-ed` comparison.
- Identified and added the exact Student Notebook destinations: printed pages 23 and 24, with `fishing`, `rented`, and the `check(ing)` marking review.
- Added intro-header `Mirror teacher`, `Mark`, and `Laser` controls to both the 2.1 and 3.5 lessons. The student display can toggle between its Stage layout and a teacher-style intro mirror, while native iPad projection uses the existing exact teacher-webview mirror.
- Verified both intro variants, mirror/Stage switching, marking and laser activation, updated Section 7 labeling, and browser console output; JavaScript, sync-safety, diff checks, and the unsigned iOS simulator build pass.
- Corrected the intro presentation controls to reuse the existing Present-mode palette and dock exactly. Removed the duplicate header Mark/Laser buttons so only Mirror teacher remains beside Close; the copied dock now navigates intro slides, closes back to Present correctly, and remains visible in the teacher-style mirrored display.
