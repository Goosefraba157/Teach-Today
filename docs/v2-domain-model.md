# Teach Today V2 Domain Model

## Model Principles

- Lesson plans are the center of teacher instruction.
- Assignments are generated from lessons.
- Student activities create attempts.
- Attempts create evidence records.
- Teacher review controls mastery impact.
- Mastery is separate from completion, points, and rewards.
- V2 data should be local-first and Firebase-ready.

## Core Entities

### Teacher

Represents the instructional owner.

Key fields: `id`, `displayName`, `email`, `role`, `tenantId`, `settings`.

### Student

Represents a learner with privacy-safe display fields.

Key fields: `id`, `legalName`, `displayName`, `nickname`, `avatarId`, `currentStep`, `currentSubstep`, `groupIds`, `active`, `createdAt`.

### Group

Represents a teacher-managed instructional group.

Key fields: `id`, `name`, `studentIds`, `currentStep`, `currentSubstep`, `readerLevel`, `notes`.

### Step, Substep, Skill

Represent the curriculum map.

Key fields: `id`, `stepId`, `substepId`, `title`, `phase`, `skillTypes`, `targets`, `reviewPrerequisites`, `sourceSets`.

### LessonTemplate

Reusable planning pattern for a step/substep.

Key fields: `id`, `step`, `substep`, `title`, `lessonType`, `partBlueprints`, `defaultActivities`, `masteryTargets`.

### LessonPlan

Teacher-created lesson instance.

Key fields: `id`, `templateId`, `teacherId`, `groupId`, `studentIds`, `step`, `substep`, `title`, `lessonDate`, `status`, `parts`, `assignments`, `teacherNotes`.

### LessonPart

One planned section inside a lesson.

Key fields: `id`, `lessonId`, `partNumber`, `name`, `skillTypes`, `items`, `teacherMode`, `studentAssignable`, `estimatedMinutes`.

### LessonItem

One word, sound, sentence, passage reference, prompt, or activity target.

Key fields: `id`, `type`, `text`, `displayText`, `sourceRef`, `wordPattern`, `encodingTarget`, `decodingTarget`, `expectedMarking`, `reviewTag`.

### Assignment

Student-facing work generated from a lesson.

Key fields: `id`, `lessonId`, `studentId`, `groupId`, `activityIds`, `status`, `dueAt`, `masteryImpact`, `createdBy`.

### StudentAttempt

Raw student interaction event.

Key fields: `id`, `assignmentId`, `studentId`, `activityId`, `itemId`, `response`, `correct`, `attemptCount`, `timeMs`, `hintsUsed`, `createdAt`.

### EvidenceRecord

Instructional interpretation of one or more attempts.

Key fields: `id`, `attemptId`, `lessonId`, `studentId`, `skillType`, `step`, `substep`, `accuracy`, `errorTypes`, `teacherReviewStatus`, `masteryImpact`.

### ErrorPattern

Aggregated student need.

Key fields: `id`, `studentId`, `step`, `substep`, `skillType`, `pattern`, `count`, `lastSeenAt`, `status`.

### TeacherReviewItem

Teacher-facing review task.

Key fields: `id`, `studentId`, `lessonId`, `evidenceRecordIds`, `reviewType`, `status`, `teacherDecision`, `notes`.

### MasteryStatus

Current readiness state for a student/substep.

Key fields: `id`, `studentId`, `step`, `substep`, `status`, `evidenceSummary`, `missingEvidence`, `updatedAt`.

### MasteryDecision

Teacher or system-supported decision.

Key fields: `id`, `studentId`, `step`, `substep`, `decision`, `reason`, `evidenceRecordIds`, `teacherId`, `createdAt`.

## LessonPlan Example

```json
{
  "id": "lesson_3_1_2026_07_08_a",
  "templateId": "template_step_3_1_intro_accuracy",
  "teacherId": "teacher_001",
  "groupId": "group_blue",
  "studentIds": ["student_001", "student_002"],
  "step": "3",
  "substep": "3.1",
  "title": "Step 3.1 Multisyllabic Lesson",
  "lessonDate": "2026-07-08",
  "status": "planned",
  "parts": [
    {
      "id": "part_2",
      "partNumber": 2,
      "name": "Teach and Review Reading Concepts",
      "skillTypes": ["decoding", "syllableDivision", "wordMarking"],
      "studentAssignable": true,
      "items": ["item_word_001", "item_word_002"]
    },
    {
      "id": "part_8",
      "partNumber": 8,
      "name": "Written Work Dictation",
      "skillTypes": ["encoding", "dictation", "proofreading"],
      "studentAssignable": true,
      "items": ["item_dictation_001", "item_sentence_001"]
    }
  ],
  "teacherNotes": "",
  "createdAt": "2026-07-08T16:00:00.000Z",
  "updatedAt": "2026-07-08T16:00:00.000Z"
}
```

## Assignment Example

```json
{
  "id": "assignment_001",
  "lessonId": "lesson_3_1_2026_07_08_a",
  "studentId": "student_001",
  "groupId": "group_blue",
  "status": "assigned",
  "activityIds": [
    "activity_syllable_scoop_001",
    "activity_tile_build_001",
    "activity_dictation_001",
    "activity_passage_reading_001"
  ],
  "step": "3",
  "substep": "3.1",
  "masteryImpact": "eligibleAfterReview",
  "createdBy": "teacher_001",
  "createdAt": "2026-07-08T16:05:00.000Z"
}
```

## StudentAttempt/EvidenceRecord Example

```json
{
  "studentAttempt": {
    "id": "attempt_001",
    "assignmentId": "assignment_001",
    "studentId": "student_001",
    "activityId": "activity_syllable_scoop_001",
    "itemId": "item_word_001",
    "response": {
      "selectedDivision": ["firstSyllable", "secondSyllable"],
      "marking": ["scoop", "prefix"]
    },
    "correct": true,
    "attemptCount": 1,
    "timeMs": 8300,
    "hintsUsed": 0,
    "createdAt": "2026-07-08T16:12:00.000Z"
  },
  "evidenceRecord": {
    "id": "evidence_001",
    "attemptId": "attempt_001",
    "lessonId": "lesson_3_1_2026_07_08_a",
    "studentId": "student_001",
    "step": "3",
    "substep": "3.1",
    "skillType": "syllableDivision",
    "accuracy": 1,
    "errorTypes": [],
    "teacherReviewStatus": "pending",
    "masteryImpact": "eligibleAfterReview"
  }
}
```

## Firebase Collection Shape

Use tenant-scoped collections:

- `tenants/{tenantId}/teachers/{teacherId}`
- `tenants/{tenantId}/students/{studentId}`
- `tenants/{tenantId}/groups/{groupId}`
- `tenants/{tenantId}/curriculum/{curriculumId}`
- `tenants/{tenantId}/lessonTemplates/{templateId}`
- `tenants/{tenantId}/lessonPlans/{lessonId}`
- `tenants/{tenantId}/assignments/{assignmentId}`
- `tenants/{tenantId}/studentAttempts/{attemptId}`
- `tenants/{tenantId}/evidenceRecords/{evidenceId}`
- `tenants/{tenantId}/teacherReviewItems/{reviewItemId}`
- `tenants/{tenantId}/masteryStatuses/{masteryStatusId}`
- `tenants/{tenantId}/masteryDecisions/{masteryDecisionId}`

Audio or recording files should live in Storage:

- `tenants/{tenantId}/students/{studentId}/assignments/{assignmentId}/attempts/{attemptId}.webm`

## Local Data Shape

Use one versioned local store during MVP:

```json
{
  "schemaVersion": "v2.0.0",
  "teachers": {},
  "students": {},
  "groups": {},
  "curriculum": {},
  "lessonTemplates": {},
  "lessonPlans": {},
  "assignments": {},
  "studentAttempts": {},
  "evidenceRecords": {},
  "teacherReviewItems": {},
  "masteryStatuses": {},
  "masteryDecisions": {},
  "syncQueue": []
}
```

Preferred local key: `teachToday.v2.state`.

## Simple MVP Mastery Statuses

- `notStarted`
- `inProgress`
- `needsReview`
- `readyForTeacherDecision`
- `mastered`
- `repeat`
- `paused`

The MVP mastery engine should recommend a status, but the teacher decision is the final gate.
