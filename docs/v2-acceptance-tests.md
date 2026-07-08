# Teach Today V2 Acceptance Tests

## Acceptance Test Goal

V2 MVP is accepted when one Step 3.1 lesson can move through the complete instructional loop:

Lesson plan -> assignment -> student activity -> evidence -> teacher review -> mastery decision

## Test 1: Teacher Creates Lesson

Steps:

1. Open V2 teacher dashboard.
2. Select a group or student.
3. Choose Step 3.1 lesson template.
4. Select included lesson parts and activity types.
5. Save the lesson.

Pass criteria:

- A `LessonPlan` is created.
- The lesson has `step`, `substep`, `teacherId`, `studentIds` or `groupId`, `parts`, and `status`.
- Lesson completion does not mark mastery.

## Test 2: Teacher Assigns Lesson

Steps:

1. Open saved lesson.
2. Choose student or group assignment.
3. Select student-facing activities.
4. Click assign.

Pass criteria:

- An `Assignment` is created for each student.
- Assignment links to `lessonId`, `studentId`, `step`, `substep`, and activity IDs.
- Assignment status is `assigned`.

## Test 3: Student Sees Assigned Work

Steps:

1. Open V2 student home.
2. View assigned quests/activities.
3. Confirm only assigned work appears.

Pass criteria:

- Student sees nickname/avatar, not full sensitive profile data.
- Student sees the assigned lesson activities.
- Future curriculum is locked or hidden.

## Test 4: Student Completes Syllable Activity

Steps:

1. Open assigned syllable scoop activity.
2. Complete at least three items.
3. Use one retry or hint.

Pass criteria:

- Each item creates a `StudentAttempt`.
- Attempts save correctness, time, attempt count, and hints used.
- Each attempt creates or updates an `EvidenceRecord`.
- Reward feedback does not update mastery directly.

## Test 5: Student Completes Encoding Activity

Steps:

1. Open typed dictation or tile build activity.
2. Complete real word and sentence-style items.
3. Submit.

Pass criteria:

- Encoding attempts are saved separately from decoding attempts.
- Errors are tagged when possible.
- Teacher review status is `pending` when review is needed.

## Test 6: Student Completes Reading/Comprehension Activity

Steps:

1. Open passage reading or retell activity.
2. Save reading completion, recording, note, or retell response.

Pass criteria:

- Evidence links to lesson, student, step/substep, and activity.
- Recording or note has a review item.
- Fluency/comprehension evidence does not auto-master the substep.

## Test 7: Teacher Reviews Evidence

Steps:

1. Open teacher review queue.
2. Filter by student or lesson.
3. Review attempts and evidence.
4. Mark evidence accepted, retry, reteach, or ignored for mastery.

Pass criteria:

- Review status updates on evidence records.
- Teacher notes are saved.
- Review decision appears in lesson history.

## Test 8: Mastery Updates

Steps:

1. Open mastery panel for student/substep.
2. Review evidence summary.
3. Choose repeat, continue, pause, or override.

Pass criteria:

- `MasteryStatus` updates from evidence summary and teacher decision.
- A `MasteryDecision` record is saved.
- Student does not advance from completion or points alone.
- Override requires a reason.

## Test 9: Game Guardrails

Steps:

1. Launch any V2 student activity.
2. Inspect activity config.

Pass criteria:

- Activity declares lesson, assignment, step/substep, lesson part, skill type, item source, and mastery impact.
- Activity cannot write mastery directly.
- Activity can save attempts and evidence.

## Test 10: Privacy

Steps:

1. View student mode.
2. View teacher mode.
3. View shared or projected student display.

Pass criteria:

- Student mode uses nickname/avatar.
- Teacher mode can access full roster details.
- Shared student display avoids sensitive progress details unless teacher intentionally opens them.

## Test 11: Local Data

Steps:

1. Create lesson and assignment.
2. Complete student activity.
3. Refresh browser.

Pass criteria:

- V2 state persists locally.
- Attempts and evidence remain linked.
- No V1 state shape is required for V2 to load.

## Test 12: Accessibility

Steps:

1. Use teacher planner on desktop and tablet width.
2. Use student activity on tablet/laptop width.
3. Navigate with keyboard where practical.

Pass criteria:

- Text does not overlap.
- Student task area is uncluttered.
- Controls are large enough for touch.
- Correct/incorrect states do not rely on color alone.
- Motion is minimal or reducible.

## MVP Acceptance Summary

The Month 1 MVP passes when:

- Teacher creates a Step 3.1 lesson.
- Teacher assigns it.
- Student completes linked activities.
- App saves attempts and evidence.
- Teacher reviews evidence.
- Teacher makes a mastery decision.
- History and student progress reflect the decision.

Anything that earns points, badges, or rewards without evidence remains engagement only.
