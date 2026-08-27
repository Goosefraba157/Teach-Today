# Teach Today — Working Instructions

These instructions apply to the entire repository.

## Start every task here

Before changing code or data:

1. Read `HANDOFF.md` for the current state and next safe action.
2. Read `docs/DECISIONS.md` before changing architecture, privacy, storage, routes, or version direction.
3. Check `docs/CHANGELOG.md` for recent work.
4. Inspect the working tree and preserve unrelated user changes.

`HANDOFF.md` is the canonical current-state file. Do not create another project-state, status, or handoff document. If an older note conflicts with it, follow `HANDOFF.md` and record the conflict there.

## Product boundaries

- V1 (`TeachToday.html` and its existing teacher/student/presenter flow) is the active product.
- Preserve V1's visual design and working routes.
- `/v2/` is paused reference material. Do not route users to it or extend it unless the user explicitly reactivates it.
- Slides and presentation mode are the current product priority after the privacy rollout is safely completed.
- Do not move or rename runtime files without auditing GitHub Pages paths, Firebase references, service-worker caches, and links.

## Student privacy and uploads

- Treat rosters, student identifiers, assessment results, notes, exports, screenshots, PDFs, and spreadsheets containing student information as private educational records.
- Never commit private student data, Firebase exports, credentials, tokens, or unredacted roster files to Git or GitHub.
- Use first name plus last initial for teacher-facing recognition when practical. Keep permanent student IDs private and separate from display names.
- Put any local private source files under `private-input/`; Git ignores its contents except for its instructions file.
- A chat attachment is temporary input, not permission to publish it. Extract only what the requested task requires, write only the minimum necessary data to the authorized private store, and do not copy the source into tracked repository paths.
- Before bulk importing or migrating student records, preview the mapping/counts, preserve the original data, and obtain explicit user confirmation for any destructive or irreversible step.
- Do not claim FERPA compliance as a legal conclusion. Describe the safeguards implemented and flag remaining operational duties.

## Updating shared memory

After every material change:

1. Update `HANDOFF.md` with what changed, current deployment/migration status, and the exact next step.
2. Add a concise entry to `docs/CHANGELOG.md`.
3. Add or revise `docs/DECISIONS.md` only when a durable product, architecture, privacy, or workflow decision changes.
4. Commit these documentation updates with the related code and push them so other computers/accounts receive the same state.

Do not place secrets or student-identifying information in any memory document.

## Git and deployment safety

- Pull/fetch before starting work on a different computer or account.
- Use small, reviewable commits. Never force-push or rewrite shared history without explicit authorization and a verified backup.
- GitHub Pages publication and Firebase rules deployment are separate operations.
- For the current privacy rollout: publish application code, run and verify the signed-in legacy ownership migration, and only then deploy strict Firebase rules.

## Fast recovery rule

When the teacher reports missing or conflicting Teach Today data, use the lowest-token recovery path first:

1. Stop writes: tell the teacher not to press Upload / merge, Restore backup, sign out, clear app data, or continue editing on another device.
2. Ask for the downloaded `teach-today-cloud-recovery-*.json` checkpoint from **Records -> Cloud backup timeline**, preferably the newest checkpoint from before the loss. A dated local-folder `teach-today-backup-*.json` is the second choice.
3. Do not begin by scanning every Firebase revision when either file is available. The checkpoint is a complete self-contained recovery package.
4. Before any cloud write, preserve the current Firebase main payload as a new immutable recovery revision and verify that the live pointer has not changed.
5. Compare by stable group, lesson, student, and record IDs; preview counts; then perform an additive merge only. Never restore an older whole-app snapshot over newer valid records, delete unmatched data, or overwrite an existing revision.
6. If no downloaded file exists, use the app's Cloud backup timeline date/time to retrieve that specific immutable revision directly. Search broadly only when the selected revision is unavailable or corrupt.

Recommended teacher prompt: `Teach Today recovery. Use the attached checkpoint from [date and time] as the last known good copy. Preserve the current Firebase copy first. Perform an additive recovery only. Do not delete or overwrite newer valid records.`
