# Teach Today V2 Architecture

## Architecture Goal

V2 should be a product platform with a clean instructional spine:

Curriculum -> Lesson Plan -> Assignment -> Student Attempt -> Evidence -> Teacher Review -> Mastery Decision

The student game layer plugs into this spine. It does not own progress.

## App Layers

### 1. Teacher Shell

Professional control center for planning, assignment, review, and mastery.

Primary jobs:

- Plan lessons
- Run live lessons
- Assign student practice
- Review evidence
- Decide repeat, continue, pause, or override
- View history and progress

### 2. Student Shell

Game-like learning world that only shows assigned work.

Primary jobs:

- Show avatar/nickname identity
- Show current quests/assignments
- Launch activities
- Give immediate feedback
- Celebrate effort
- Save attempts and evidence

### 3. Lesson Engine

Transforms curriculum and teacher choices into a lesson plan and assignment set.

Primary services:

- `curriculumService`
- `lessonTemplateService`
- `lessonPlanService`
- `lessonPartService`
- `assignmentService`

### 4. Activity Runtime

Runs reusable activities from assignment data.

MVP activity types:

- `wordCardRead`
- `syllableScoop`
- `tileBuild`
- `typedDictation`
- `passageReadRecord`
- `comprehensionRetell`

Each activity receives a config object and produces attempts.

### 5. Evidence Engine

Normalizes student interactions into teacher-readable evidence.

Primary services:

- `attemptService`
- `evidenceService`
- `errorPatternService`
- `reviewQueueService`
- `masteryService`

### 6. Data/Sync Layer

Local-first store with Firebase-ready persistence.

Primary services:

- `localStore`
- `syncQueue`
- `firebaseRepository`
- `storageRepository`
- `migrationService`

### 7. Art/Asset Layer

Reusable asset slots and components, not hardcoded art.

Primary areas:

- Avatars
- Badges
- Backgrounds
- Activity illustrations
- Icons
- UI tokens
- Animation hooks

## Teacher Routes

- `/v2/teacher` - dashboard overview
- `/v2/teacher/groups` - group list and group placement
- `/v2/teacher/students/:studentId` - student profile and mastery snapshot
- `/v2/teacher/lesson-planner` - create/select lesson
- `/v2/teacher/lessons/:lessonId` - lesson detail
- `/v2/teacher/lessons/:lessonId/live` - teacher live lesson runtime
- `/v2/teacher/assignments` - assignment manager
- `/v2/teacher/review` - evidence and teacher review queue
- `/v2/teacher/mastery` - mastery gates and decisions
- `/v2/teacher/history` - lesson history and basic reports
- `/v2/teacher/settings` - roster, privacy, sync, and asset settings

## Student Routes

- `/v2/student` - student home
- `/v2/student/profile` - avatar and nickname view
- `/v2/student/assignments` - assigned quests
- `/v2/student/activity/:assignmentId/:activityId` - activity runtime
- `/v2/student/rewards` - earned effort rewards
- `/v2/student/complete/:assignmentId` - assignment completion summary

## Data Flow

1. Teacher selects group/student and Step 3.1 lesson template.
2. Lesson Engine creates a `LessonPlan`.
3. Teacher edits parts and items.
4. Teacher assigns selected parts/activities.
5. Assignment Engine creates `Assignment` records.
6. Student shell displays assignment as quests.
7. Activity Runtime creates `StudentAttempt` records.
8. Evidence Engine creates `EvidenceRecord` records.
9. Review Queue shows evidence needing teacher review.
10. Mastery Engine updates recommendation.
11. Teacher creates `MasteryDecision`.
12. Dashboard/history update.

## Activity Contract

Every V2 activity must accept:

```json
{
  "activityId": "activity_syllable_scoop_001",
  "assignmentId": "assignment_001",
  "lessonId": "lesson_001",
  "studentId": "student_001",
  "step": "3",
  "substep": "3.1",
  "lessonPart": 2,
  "skillType": "syllableDivision",
  "items": [],
  "feedbackMode": "studentFriendly",
  "masteryImpact": "eligibleAfterReview"
}
```

Every activity must emit:

```json
{
  "attemptId": "attempt_001",
  "activityId": "activity_syllable_scoop_001",
  "itemId": "item_word_001",
  "response": {},
  "correct": true,
  "timeMs": 8300,
  "hintsUsed": 0,
  "errorTypes": []
}
```

## V1 Integration Boundary

V2 may read or adapt selected V1 resources, but V2 should not depend on V1 state shape.

Reuse:

- Curriculum/source data where appropriate
- Planner ideas
- Section rendering ideas
- Reporting patterns
- Firebase lessons learned

Do not reuse:

- V1 monolithic app state as the V2 model
- V1 completion-based mastery
- V1 game points as progress
- V1 route structure as the V2 route structure

## File Organization Direction

Exact implementation can adapt to the current repo, but the V2 code should be organized around domains:

- `v2/core/`
- `v2/data/`
- `v2/curriculum/`
- `v2/lesson-engine/`
- `v2/teacher/`
- `v2/student/`
- `v2/activities/`
- `v2/evidence/`
- `v2/mastery/`
- `v2/assets/`
- `v2/styles/`

## Architecture Acceptance Rule

A feature belongs in V2 only if it can connect to the lesson/evidence/mastery spine or clearly supports teacher/student shell infrastructure.
