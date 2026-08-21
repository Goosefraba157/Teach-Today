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
- Changed service-worker handling for app code to network-first with offline fallback so GitHub Pages updates appear promptly; large curriculum assets remain cache-first.
