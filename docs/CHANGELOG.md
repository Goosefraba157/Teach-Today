# Teach Today — Change Log

This is a concise development record. Student names, IDs, results, and other private data do not belong here.

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
