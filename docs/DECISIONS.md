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

