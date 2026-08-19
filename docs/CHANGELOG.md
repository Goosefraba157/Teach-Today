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
