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
- **Presentation-wide ink:** Present mode keeps one session-only annotation palette visible across all lesson sections, defaulting to its arrow/interact state so it does not block normal controls. Its marks clear when Present mode ends and remain separate from Section 9's specialized passage annotation canvas and saved passage state. The prior red-only Notes drawing mode is not a second visible annotation tool.
- **Presentation tool placement:** Floating Ink and presentation controls anchor beside the centered lesson workspace on wide/zoomed-out screens, with viewport-edge fallbacks on narrow screens.
- **Laser pointer:** The presentation laser is a passive, transient red pointer with a fading trail that preserves normal taps/clicks. Because generic iPad styluses may be reported as ordinary touch, Laser exposes explicit `Scoop` and `Scroll` modes: Scoop captures all touch movement for pointing, while Scroll restores touch page navigation without requiring Laser to be turned off. It is never persisted, exported, or treated as student/lesson evidence.
- **Separate student stage:** The teacher's Present view remains the authoritative interactive lesson surface. Student Stage receives a minimized, sanitized payload and renders separate student-safe content; it must never mirror teacher scoring controls, active-student details, notes, or private ink.
- **Stage following:** `Follow Lesson` may switch Stage from the teacher's visible section, but only sections with an approved student renderer display lesson content. Sections 2/2B use the active built-word cards, Section 3 the active card, Section 5 the active sentence, and Section 7 the blank magnetic journal by default; Section 7 cards are an explicit manual Stage choice. Unsupported sections fail closed to the neutral privacy screen, and any manual Stage mode remains an explicit override.
- **External iPad display:** The web Stage contract should remain renderer- and transport-independent so it can serve same-browser windows now and a native iPad external-display scene later. Native installation is an additive shell around V1, not a replacement for the existing Present flow.
- **Classroom display transport:** AirPlay Screen Mirroring is the preferred classroom connection for compatible Newline/Promethean boards. The native shell overrides ordinary duplication with a noninteractive student scene while retaining the private teacher scene on the iPad; USB-C/HDMI provides the wired fallback. Both routes must use the same sanitized Stage contract.

## Lesson planning defaults

- **Decision:** Lesson format is a per-group preference, selected in Customize and preserved when generating a recommended lesson.
- **Default:** Groups without a saved preference begin with the 45+45 group-days format; selecting another format updates only that group.
- **Boundary:** “Generate Best Lesson” may optimize instructional content but must not change the teacher-selected lesson format.
- **Planner hierarchy:** The official open-lesson continuity panel and the proposed Recommended Plan are distinct. Customize is the authoritative lesson editor and owns the single format picker; the compact recommendation layer explains evidence, readiness, and sequence without duplicating every section control.
- **Same-page reteach:** Redoing a weak charting lesson creates a new lesson that retains the Section 4 charting page while refreshing Section 2/2B current practice words from that page and review words from prior concepts. The original lesson and evidence remain unchanged.

## Lesson identity and continuity

- **Decision:** A group may have one explicitly active lesson at a time. The app must identify it by lesson number, group, session day, and a teacher-selected date.
- **45+45 sessions:** Day 1 and Day 2 belong to the same lesson number but store separate dates. Day 2 defaults to the next Monday-Thursday instructional date and remains editable. The teacher may complete the lesson as-is at any point; unfinished sections are valid.
- **Switching groups:** Leaving a group preserves its lesson, active day, completed/skipped sections, saved versions, and scroll position. Returning offers a clear choice to continue, complete, or preserve it as incomplete and plan a new lesson.
- **Teaching action:** Start Teaching is the primary live action and opens Present mode. Building or reviewing a draft does not by itself mean that teaching has started.
- **Corrections:** Current-year official lesson dates and numbers may be corrected from the selected group's lesson-history control only after explicit confirmation. Corrections do not alter student evidence or instructional content.
- **Next lesson defaults:** Completing a lesson as-is or preserving it as incomplete and planning another prepares the next automatic lesson number on the next Monday-Thursday instructional date. Teachers may override the date, including Friday when needed.
- **Test separation:** Demo teaching should use a group explicitly marked as a demo group so test saves do not enter official group continuity. Routine UI must not expose a broad school-year lesson reset.

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
- **Firebase concurrency:** Large private backups use immutable revision-scoped chunks and atomically update the owner-scoped main pointer only after every chunk is written. A tab must not overwrite metadata changed by another signed-in browser after its initial read; it should stop and request a refresh instead.
- **Cross-device refresh:** Signed-in clients listen only to the private owner-scoped revision pointer. A clean client may automatically load a newer completed whole-app revision; a client with unsynced local edits must preserve them and require attention instead of attempting an automatic merge or last-write-wins replacement.

## Cross-chat continuity

- **Decision:** The repository is the shared source of truth across chats, ChatGPT accounts, and computers.
- **Reason:** Separate ChatGPT accounts do not share memory or chat history automatically.
- **Mechanism:** `AGENTS.md` defines working rules, `HANDOFF.md` holds current state, this file records durable decisions, and `CHANGELOG.md` records completed work.

## Private intake

- **Decision:** Private files may be supplied as chat attachments or placed temporarily in `private-input/`, but must not be committed.
- **Decision:** Imports must minimize fields, preview mappings/counts, avoid exposing identifiers in logs, and preserve source data until verification succeeds.
