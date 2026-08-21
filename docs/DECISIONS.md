# Teach Today — Durable Decisions

This file records decisions future chats should not accidentally reverse. Current execution status belongs in `../HANDOFF.md`.

## Active version

- **Decision:** Continue V1 as the active product and preserve its visual design.
- **Reason:** V1 already has the strongest working teacher-to-lesson-to-presenter experience and has been tested with students.
- **Boundary:** `/v2/` remains intact but paused. Its ideas may be reviewed later; it is not the active route.

## Presentation work

- **Decision:** Improve V1 slides incrementally rather than replacing the application wholesale.
- **Reason:** The existing app looks and works well, so changes must preserve known-good flows.
- **Boundary:** The `lesson-planner-v2-*` presenter prototype is a behavior reference, not the paused `/v2/` application.
- **Layout:** The regular teaching workspace should use available laptop and desktop width responsively, while Section 9 may remain wider for passage reading and mobile screens retain compact gutters.
- **45+45 parity:** Section 2B uses its own Day 2 word-building deck and interaction state, mirroring the essential Section 2 student display without sharing or overwriting Day 1 navigation.

## Lesson planning defaults

- **Decision:** Lesson format is a per-group preference, shown immediately after group selection and preserved when generating a recommended lesson.
- **Default:** Groups without a saved preference begin with the 45+45 group-days format; selecting another format updates only that group.
- **Boundary:** “Generate Best Lesson” may optimize instructional content but must not change the teacher-selected lesson format.

## Lesson identity and continuity

- **Decision:** A group may have one explicitly active lesson at a time. The app must identify it by lesson number, group, session day, and a teacher-selected date.
- **45+45 sessions:** Day 1 and Day 2 belong to the same lesson number but store separate dates; Day 2 may occur on any later date. The teacher may instead complete the lesson after Day 1.
- **Switching groups:** Leaving a group preserves its lesson, active day, completed/skipped sections, saved versions, and scroll position. Returning offers a clear choice to continue, complete, or preserve it as incomplete and plan a new lesson.
- **Teaching action:** Start Teaching is the primary live action and opens Present mode. Building or reviewing a draft does not by itself mean that teaching has started.
- **Corrections:** Current-year official lesson dates and numbers may be corrected from the selected group's lesson-history control only after explicit confirmation. Corrections do not alter student evidence or instructional content.
- **Test separation:** Resetting a current-year group's lesson sequence preserves generated plans as excluded test records and returns the official sequence to zero. Demo teaching should use a group explicitly marked as a demo group so test saves do not enter official group continuity.

## Student identity and school years

- **Decision:** Use permanent private student IDs to connect records across school years while keeping each year's groups and activity separate.
- **Reason:** Students may leave or remain, while longitudinal growth must remain available without merging yearly operational data.
- **Decision:** Teacher-facing labels should use the minimum recognizable name, normally first name plus last initial, rather than full legal names.
- **Decision:** Archiving ends an active school-year membership; it does not delete historical records.

## Privacy and hosting

- **Decision:** The public GitHub Pages application contains code and non-sensitive curriculum assets only. Private student records belong in authenticated, owner-scoped Firebase storage.
- **Decision:** Never commit rosters, IDs, student reports, Firebase exports, credentials, or tokens to GitHub.
- **Decision:** Strict Firebase rules must be deployed only after legacy records receive and verify ownership metadata, to avoid locking the teacher out of existing data.
- **Decision:** Privacy safeguards support responsible FERPA handling but do not by themselves constitute legal certification; account security, access review, retention, consent, and school policy remain operational responsibilities.

## Cross-chat continuity

- **Decision:** The repository is the shared source of truth across chats, ChatGPT accounts, and computers.
- **Reason:** Separate ChatGPT accounts do not share memory or chat history automatically.
- **Mechanism:** `AGENTS.md` defines working rules, `HANDOFF.md` holds current state, this file records durable decisions, and `CHANGELOG.md` records completed work.

## Private intake

- **Decision:** Private files may be supplied as chat attachments or placed temporarily in `private-input/`, but must not be committed.
- **Decision:** Imports must minimize fields, preview mappings/counts, avoid exposing identifiers in logs, and preserve source data until verification succeeds.
