# Teach Today V2 Build Plan

## One-Month Target

Build one complete Step 3.1 vertical slice that proves the Lesson Engine works end to end:

Teacher plan -> assignment -> student activity -> evidence -> review -> mastery decision -> next action

## Build Strategy

Do not rebuild the whole app in Month 1. Build a clean V2 module alongside V1, reuse proven V1 data/resources where safe, and leave legacy pages stable.

The MVP should prioritize workflow truth over visual polish. Art slots and placeholders are enough until the lesson engine proves itself.

## Week 1 Deliverables

Goal: V2 foundation and basic planner.

- Finalize V2 docs.
- Create V2 route/shell structure.
- Create local-first V2 state store.
- Seed one teacher, group, and two sample students.
- Seed Step 3.1 curriculum placeholder data.
- Seed one Step 3.1 `LessonTemplate`.
- Build basic teacher dashboard shell.
- Build basic student shell with nickname/avatar placeholders.
- Build basic lesson planner that creates a `LessonPlan`.
- Add schema helpers for `LessonPlan`, `Assignment`, `StudentAttempt`, `EvidenceRecord`, and `MasteryStatus`.

Definition of done:

- Teacher can open V2, choose Step 3.1, create a draft lesson, and see it saved in V2 state.

## Week 2 Deliverables

Goal: Teacher lesson planner and live teacher runtime.

- Expand lesson planner to edit lesson parts and items.
- Add Step 3.1 lesson parts for reading concepts, word cards, spelling, dictation, passage/recording, and review notes.
- Add assignment generation from lesson parts.
- Build lesson detail page.
- Build teacher live lesson page with checklist and notes.
- Add teacher controls: save, assign, close lesson, repeat later.
- Add basic lesson history record.

Definition of done:

- Teacher can create a Step 3.1 lesson, select student/group, choose included activities, and assign it.

## Week 3 Deliverables

Goal: Student assignment runtime and evidence logging.

- Build student assignment list.
- Build reusable activity runtime shell.
- Implement 3-5 MVP activities:
  - Word card read/check
  - Syllable scoop
  - Tile build
  - Typed dictation
  - Passage read/record or retell note
- Save `StudentAttempt` for every item interaction.
- Convert attempts into `EvidenceRecord` objects.
- Track hints, retries, correctness, time, and error type where possible.
- Show student reward feedback without changing mastery.

Definition of done:

- Student can complete assigned Step 3.1 activities and the app saves reviewable evidence.

## Week 4 Deliverables

Goal: Teacher review, mastery, history, and polish.

- Build teacher review queue.
- Group evidence by student, lesson, activity, and skill type.
- Add teacher decisions: accept evidence, needs retry, reteach, ignore for mastery.
- Add simple mastery status panel.
- Add mastery decisions: repeat, continue, pause, override.
- Add lesson history and student basic report.
- Add privacy checks for nickname/avatar display.
- Add polish pass for responsive layouts and accessibility.
- Add acceptance test checklist.

Definition of done:

- Teacher can review student evidence, make a mastery decision, and see the next recommended action.

## First Coding Step

Create the V2 shell and data spine first:

1. Add V2 entry route/page.
2. Add V2 local store.
3. Add seed data for teacher/group/students/Step 3.1.
4. Add domain helpers for lesson, assignment, attempt, evidence, and mastery.
5. Add teacher dashboard and planner shell that saves a real `LessonPlan`.

Do not start with games. Start with the data spine and teacher planner.

## MVP Activity Priority

1. Syllable scoop
2. Tile build
3. Typed dictation
4. Word card read/check
5. Passage reading/recording or retell

These cover decoding, encoding, fluency/comprehension evidence, and teacher review.

## Risks

- The available manual does not include later Step Instruction, full Block 3 guide, or Appendix pages.
- Step 3.1 exact item sets must be treated as placeholders until approved source material is confirmed.
- Audio recording and Firebase Storage can add time in Week 3/4.
- Too much game polish can distract from evidence flow.
- V1 data migration could become a trap if attempted too early.

## Risk Controls

- Use placeholder Step 3.1 items in MVP unless approved materials are available.
- Keep mastery thresholds simple and teacher-approved.
- Build local-first before cloud sync.
- Make art slots before final art.
- Leave V1 stable and build V2 separately.

## Month 1 Realism

The one-month MVP is realistic if the scope stays vertical and narrow. It is not realistic if Month 1 also tries to rebuild all steps, import all V1 games, create final art, implement automatic speech scoring, and complete full Firebase production sync.
