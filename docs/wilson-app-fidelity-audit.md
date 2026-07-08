# Wilson App Fidelity Audit

Date: 2026-07-06
Scope: Teach Today app in `/Users/macg/Documents/New project`
Private source: `Manuals/Wilson Instructor Manual Bible 1-6 - 2026-07-06 18-15.pdf`

## Source Review Status

The provided PDF was rendered and OCR-read page by page. It contains 108 PDF pages and ends on the manual's page 104 with the Part 8 sentence proofreading procedure. The table of contents inside the PDF says the Step Instruction section starts on manual page 105, the Comprehension & Fluency Block 3 Guide starts later, and the Appendix follows after that. Those sections are not present in this PDF file.

This audit is therefore grounded in the source pages that are present:

- Front matter and "How to Use This Manual"
- Introduction
- Lesson Planning & Execution
- Lesson Plan Overview
- Lesson Part Procedures for Parts 1-8

Source gap before implementation: do not implement exact Step Instruction, detailed Block 3 procedures, Appendix forms, or end-of-step details until a complete scan/PDF is available. The current PDF gives enough to define the app architecture, data model, and teacher/student control flow, but not enough to encode exact substep-by-substep procedures from the missing sections.

## Manual-Derived App Principles

The app should be built as a Wilson-style instructional control system, not as a generic reading-game platform.

- The 10-part lesson plan is the main instructional unit.
- Blocks 1, 2, and 3 must stay connected: decoding work, encoding/spelling work, and connected-text fluency/comprehension should reinforce the same current and review concepts.
- Steps and substeps are sequential, but movement is mastery-based.
- Each substep should support an introductory/accuracy phase and then an automaticity/fluency phase.
- Students should not advance because they "finished" a task or earned points. Advancement should depend on teacher-visible evidence.
- Teacher observation, charting, dictation evidence, error patterns, and teacher approval are central.
- Games and student activities are acceptable only when tied to the assigned step/substep, current skill, review skill, or documented trouble spot.
- Controlled text matters. Reading/spelling items should come from taught or previously taught structures, high frequency words, and the appropriate AB/A/B level.
- Encoding matters as much as decoding.
- Vocabulary and comprehension should be woven into instruction, not treated as decorative add-ons.
- Student tools should mirror multisensory routines digitally: cards, tiles, tapping prompts, scooping, marking, dictation, proofreading, vocabulary notebooks, fluency timing, retell, and teacher notes.

## Internal Implementation Map

### 1. Steps, Substeps, and Placement

Manual concept:
WRS uses sequenced steps and substeps. Students begin at an appropriate initial point and progress through substeps based on mastery.

App feature:
Student placement profile with current step/substep, reader level, instructional phase, and locked/unlocked status.

Teacher action:
Set or adjust current step/substep, place student/group, pause advancement, document reason for override.

Student action:
Sees only assigned/current activities and review activities, not the entire program as an unlocked game map.

Data saved:
`studentId`, `groupId`, `currentStep`, `currentSubstep`, `readerLevel`, `phase`, `placementSource`, `teacherOverride`, `overrideReason`, `updatedAt`.

Mastery rule:
Substep can advance only when required evidence categories are met and teacher approves.

Current app status:
`app.js` has a broad `scopeMap` for Steps 1-12 and default teaching groups with `substep`. `student.html` shows a full 12-step journey. Student lesson curriculum currently has only Step 2.1 data in `student-lesson-data.js`.

Needed patch:
Add a formal `studentPlacement` and `masteryGate` model. Hide locked future content from normal student flow unless teacher/developer mode explicitly opens it.

Open questions:
Need complete Step Instruction pages for exact substep procedures and any step-specific mastery notes.

### 2. 10-Part Lesson Plan

Manual concept:
Each lesson has 10 parts across three blocks: foundational reading, foundational spelling/writing, and fluency/comprehension.

App feature:
Lesson builder and live lesson cockpit organized around Parts 1-10.

Teacher action:
Create/assign lesson, choose lesson type, select controlled sources, teach live, save evidence, wrap up with next action.

Student action:
Receives assigned practice that is linked back to a lesson part and current/review concept.

Data saved:
`lessonId`, `planId`, `partsIncluded`, `step`, `substep`, `sourcePages`, `teacherSelections`, `studentIds`, `status`, `evidenceIds`.

Mastery rule:
A lesson can be "complete" for attendance/history, but completion does not equal mastery.

Current app status:
`teach-today.js` defines `TT_LESSON_SECTIONS` for Parts 1-10 and has a dashboard-first planner, print-style preview, live flow, wrap-up panel, lesson history, and Wilson lesson plan export wiring.

Needed patch:
Separate lesson completion status from mastery status. Add a teacher-facing "evidence collected" state for each part.

Open questions:
Need complete Appendix/form pages before mirroring any official forms beyond paraphrased app structures.

### 3. Part 1 - Sounds Quick Drill

Manual concept:
Quick sound-symbol drill using sound cards, focusing on new sounds, trouble sounds, and review, with efficient pacing.

App feature:
Digital sound card deck with teacher-led and student-practice modes.

Teacher action:
Select current/new/trouble sounds, mark exact/similar/review responses, save trouble spots.

Student action:
Names letter/sound or chooses sound-symbol response; can record audio when appropriate.

Data saved:
`skillType: soundSymbol`, `sound`, `grapheme`, `response`, `accuracy`, `confidence`, `audioId`, `errorType`, `teacherReviewStatus`.

Mastery rule:
Automaticity requires repeated accurate responses over time, not one good round.

Current app status:
There is sound audio, a student sounds drill route, local and cloud activity storage for sound drills, and profile display of sound drill sessions.

Needed patch:
Normalize sound drill events into the same evidence model as charting and dictation. Add teacher review and mastery impact fields.

Open questions:
Need exact sound-card sequence from complete source/approved app data before expanding beyond currently indexed sounds.

### 4. Part 2 - Teach & Review Concepts for Reading

Manual concept:
Teacher presents word structure using cards/tiles, tapping for one-syllable words and scooping for multisyllabic words, with guided questioning and marking.

App feature:
Digital card/tile board for teacher modeling plus student practice for building, reading, marking, and explaining word structure.

Teacher action:
Choose review words, current words, trouble spots, and concept questions. Save student needs.

Student action:
Tap, blend, build, mark, scoop, or read words tied to the current substep.

Data saved:
`skillType: conceptReading`, `word`, `wordPattern`, `cardsUsed`, `markingExpected`, `studentMarking`, `correct`, `errorType`, `attemptCount`, `teacherPromptUsed`.

Mastery rule:
Student demonstrates accurate word reading and concept understanding before automaticity work replaces heavy prompting.

Current app status:
`teach-today.js` has Section 2 card rendering, word replacement tools, current/review word selections, trouble spot pull-forward, and whiteboard tiles. Student Step 2.1 has decode choice, rapid decode, and tile build.

Needed patch:
Create a reusable `conceptActivity` registry so student activities know which concept, pattern, and manual-aligned routine they support.

Open questions:
Need complete Step Instruction for exact current concepts by substep.

### 5. Part 3 - Word Cards and High Frequency Words

Manual concept:
Word cards build automaticity with phonetically regular words, review words, targeted vocabulary, and separate high frequency word practice.

App feature:
Digital word card deck and high frequency word deck, with separate evidence for regular word automaticity and HFW recognition/spelling.

Teacher action:
Assign current/review card packet, target vocabulary, tag HFWs as known or needs practice.

Student action:
Read cards quickly, practice HFWs, review tricky parts, and complete short automaticity checks.

Data saved:
`skillType: wordCards|hfw`, `word`, `isHighFrequency`, `isReview`, `responseMs`, `correct`, `prompted`, `mastered`.

Mastery rule:
A word/HFW is mastered only after repeated accurate, automatic performance. HFW reading and spelling should be tracked separately.

Current app status:
`wilson-hfw-data.js` exists. `teach-today.js` renders HFW cards and Section 3 word cards. Student app does not yet have a full HFW mastery loop.

Needed patch:
Add `highFrequencyWordMastery` to the student evidence model and a teacher review surface for unknown HFWs.

Open questions:
Need confirm HFW sequence from complete licensed resources and avoid exposing copyrighted lists publicly.

### 6. Part 4 - Wordlist Reading and Charting

Manual concept:
Wordlist charting is a central formative assessment for decoding accuracy/automaticity and substep progression.

App feature:
Live charting with real/nonsense wordlist source, error capture, timing, automaticity flag, and error pattern summary.

Teacher action:
Chart each student, save exact misses, decide repeat/warm-up/advance, identify trouble spot.

Student action:
Reads list independently; receives teacher-guided correction after the charting attempt.

Data saved:
`skillType: wordlistChart`, `wordlistType: real|nonsense`, `correctCount`, `total`, `seconds`, `wordRecords`, `errors`, `automaticity`, `recommendation`.

Mastery rule:
Substep progression needs real-word and, when provided, nonsense-word accuracy/automaticity evidence. The app should not advance page/substep on completion alone.

Current app status:
Live charting exists in `app.js` and `teach-today.js`, with `masterRecords`, word-level misses, timing, WCPM, flags, recommendations, chart history, profile/report charts, and Section 4 stage preview.

Needed patch:
Move from per-page recommendation to a formal substep gate that checks real and nonsense evidence across attempts and requires teacher approval.

Open questions:
Need exact group/individual charting thresholds from complete source for any edge cases not present in the current PDF.

### 7. Part 5 - Sentence Reading

Manual concept:
Students read controlled sentences for meaning, fluency, phrasing, vocabulary, and comprehension, using penciling/scooping.

App feature:
Digital sentence reader with scooping/phrasing tool, fluency note, vocabulary prompt, and teacher/student view.

Teacher action:
Select sentence page, model phrasing, mark comprehension/vocabulary/fluency notes.

Student action:
Read silently, then orally; use scoop/phrase tool when assigned.

Data saved:
`skillType: sentenceReading`, `sentenceId`, `sourcePage`, `silentReadConfirmed`, `oralReadStatus`, `scoops`, `vocabNotes`, `teacherNotes`.

Mastery rule:
Sentence reading supports fluency/comprehension evidence but should not independently advance a substep without wordlist/dictation evidence.

Current app status:
Reader sentence data exists. Lesson planner selects sentence pages. Section 5 is represented in the live lesson flow and preview. Student Step 2.1 has a self-graded sentence-read activity.

Needed patch:
Replace self-grade-only sentence evidence with teacher-reviewable sentence fluency/comprehension evidence, optionally including recording.

Open questions:
Need exact expectations for sentence work by substep from complete Step Instruction.

### 8. Part 6 - Quick Drill in Reverse

Manual concept:
Teacher says a sound or word element; student identifies corresponding grapheme/tile or word element.

App feature:
Reverse drill with teacher dictation controls and student tile selection.

Teacher action:
Select current/review/trouble sounds and word elements.

Student action:
Select tiles/cards for dictated sound or element.

Data saved:
`skillType: reverseDrill`, `dictatedSound`, `selectedGrapheme`, `wordElement`, `correct`, `errorType`, `attemptCount`.

Mastery rule:
Repeated quick and accurate sound-to-symbol association supports encoding readiness.

Current app status:
Section 6 targets are generated in `teach-today.js`; digital tiles/whiteboard support exists. Student side does not yet have a full reverse-drill loop.

Needed patch:
Add reverse drill student activity that saves attempts with `mode: encodingPrerequisite`.

Open questions:
Need exact current/review target rules by substep.

### 9. Part 7 - Teach & Review Concepts for Spelling

Manual concept:
Spelling is taught by building words with tiles/cards, segmenting sounds/syllables/word elements, then orally spelling and reading back.

App feature:
Digital spelling tile builder for teacher-led and student practice.

Teacher action:
Dictate review/current/nonsense words, observe tile build, save error patterns.

Student action:
Repeat word, segment/tap/scoop, build with tiles, spell orally/typed, read back.

Data saved:
`skillType: spellingConcept`, `word`, `targetPattern`, `tileSequence`, `typedSpelling`, `correct`, `errorType`, `teacherPromptUsed`.

Mastery rule:
Encoding accuracy must count as a separate required evidence category.

Current app status:
Section 7 spelling sets, card rendering, and word-card fixes exist in `teach-today.js`. Student Step 2.1 has tile-build and typed encoding activities.

Needed patch:
Tie spelling activity attempts to lesson/substep evidence, not just local XP. Add explicit teacher-reviewed written-response status when needed.

Open questions:
Need exact spelling concept procedures for each substep from missing Step Instruction.

### 10. Part 8 - Written Work Dictation

Manual concept:
Dictation includes sounds, word elements, real/nonsense words, phrases, and sentences, with oral spelling before writing, marking, and proofreading.

App feature:
Dictation cockpit with typed/tile responses, item categories, sentence proofreading checklist, and teacher review.

Teacher action:
Dictate items, mark misses, categorize errors, save proofreading notes.

Student action:
Repeat, spell orally or type/build, proofread, mark words/sentences, read back with phrasing.

Data saved:
`skillType: dictation`, `dictationType`, `item`, `studentResponse`, `correct`, `errorType`, `proofreadingStepsCompleted`, `teacherReviewStatus`.

Mastery rule:
Substep progression requires independent spelling accuracy. Dictation evidence should be weighted alongside decoding evidence.

Current app status:
Section 8 dictation plan generation exists for sounds, elements, real words, nonsense, phrases, and sentences. Teachers can save dictation misses and encoding observations; profiles and reports show dictation miss patterns.

Needed patch:
Upgrade from "miss logging" to full attempt logging with correct/incorrect totals, error categories, and teacher review status.

Open questions:
Need exact end-of-step dictation scoring from missing source.

### 11. Part 9 - Controlled Text Passage Reading

Manual concept:
Controlled passage reading applies taught word structure in connected text with silent reading, visualization/retell, oral reading, fluency, and comprehension.

App feature:
Controlled passage reader with passage assignment, annotation/scooping, retell prompt, teacher notes, fluency timing, and comprehension evidence.

Teacher action:
Select passage, guide silent/oral reading, save retell quality, fluency, vocabulary, and comprehension notes.

Student action:
Read passage, retell, answer comprehension prompts, optionally record fluency.

Data saved:
`skillType: controlledPassage`, `passageId`, `sourcePage`, `retellStatus`, `oralFluency`, `comprehensionStatus`, `vocabNotes`, `teacherReviewStatus`.

Mastery rule:
Controlled-text fluency and comprehension support substep/step mastery but need teacher review.

Current app status:
Section 9 passage catalog, passage memory, PDF/image reader, annotation rail, companion vocabulary/questions, and Wilson export mapping exist.

Needed patch:
Convert Section 9 notes into formal evidence records. Add retell/comprehension/fluency fields and teacher review status.

Open questions:
The detailed Block 3 Guide is missing from the PDF, so exact Part 9 procedure should be verified before implementing detailed automation.

### 12. Part 10 - Listening/Reading Fluency and Comprehension

Manual concept:
Part 10 uses enriched/authentic text for listening/reading fluency and comprehension with scaffolded discussion, vocabulary, background knowledge, and gradual release.

App feature:
Teacher-controlled Part 10 planning and notes with text source, read-aloud/listening mode, student retell, vocabulary, and comprehension notes.

Teacher action:
Choose appropriate text, guide discussion, save comprehension/vocabulary observations.

Student action:
Listen/read, visualize, retell, discuss vocabulary and comprehension.

Data saved:
`skillType: enrichedComprehension`, `textSource`, `mode`, `retell`, `vocabulary`, `comprehensionNotes`, `teacherReviewStatus`.

Mastery rule:
Part 10 should inform comprehension support and teacher planning, but it should not replace word-level mastery evidence.

Current app status:
Part 10 exists as a lesson section label/story area but is less developed than Sections 1-9. Section 9 companion work supports vocabulary/questions for controlled passages.

Needed patch:
Add Part 10 planning/evidence panel after complete Block 3 source is provided.

Open questions:
Detailed Block 3 Guide is not present in the PDF.

### 13. Vocabulary

Manual concept:
Vocabulary is interwoven into word study and connected text, with targeted words selected based on student need and repeated across lessons.

App feature:
Vocabulary notebook and teacher target-vocabulary planner.

Teacher action:
Choose target vocabulary from current substep words and connected texts; add simple definition/context prompt.

Student action:
Review word meaning, use it in a sentence, connect to passage/context.

Data saved:
`skillType: vocabulary`, `word`, `meaning`, `source`, `studentSentence`, `visualNote`, `reviewedDates`, `masteryStatus`.

Mastery rule:
Vocabulary mastery is repeated-use and comprehension-based, not a one-time matching game.

Current app status:
Section 9 companion vocabulary exists. Section 2/3/7/8 can weave vocabulary words. There is not yet a general student vocabulary notebook.

Needed patch:
Create `vocabularyNotebook` per student and a teacher panel to target/review words across lessons.

Open questions:
Need confirm whether app should store teacher-created definitions only, not copied manual wording.

### 14. Mastery Gates and Progress Monitoring

Manual concept:
Progression from substep to substep and step to step depends on mastery evidence, formative assessment, error analysis, and teacher judgment.

App feature:
Mastery Control Center.

Teacher action:
Review evidence, see missing categories, repeat weak skills, pause advancement, approve advancement, override with reason.

Student action:
Sees current practice and teacher-approved next step only.

Data saved:
`masteryGateId`, `studentId`, `substep`, `decodingEvidence`, `encodingEvidence`, `hfwEvidence`, `automaticityEvidence`, `fluencyEvidence`, `comprehensionEvidence`, `teacherApproval`, `overrideReason`, `status`.

Mastery rule:
Default substep gate should require decoding accuracy/automaticity, encoding accuracy, concept marking/understanding, controlled sentence/passage fluency as appropriate, repeated performance across attempts, and teacher approval.

Current app status:
Teacher profiles calculate trends and recommendations. Student progress calculates local mastery labels. These are not yet unified into a formal gate.

Needed patch:
Build a computed mastery gate from existing `masterRecords`, `dictationMisses`, `encodingObservations`, `markedReviewWords`, and future student-attempt evidence.

Open questions:
Need complete end-of-step assessment guidance before coding step-to-step gates.

## Current App Alignment

### What The App Currently Does Well

- Teacher dashboard starts from groups and lesson planning, not a marketing/landing page.
- Groups have current substeps, reader level, students, history, page progress, and chart results.
- Lesson planner already mirrors the 10-part lesson shape with Sections 1-10.
- The planner can build lessons from current substep, reader level, wordlist page, sentence page, passage, review sources, and teacher selections.
- Section 4 charting saves per-student records with correct count, timing, wrong words, word records, automaticity flags, and recommendations.
- Section 8 dictation supports sounds, word elements, real words, nonsense words, phrases, and sentences from current/review sources.
- Student profiles and reports show decoding trends, dictation misses, error patterns, lesson history, attendance, and linked lessons.
- Section 9 has a strong controlled-passage foundation with passage metadata, persistent story selection, annotation, companion vocabulary/questions, and export wiring.
- Student app has an engaging home, easy student entry, assigned tasks, Step 2.1 adaptive path, decoding/encoding loops, XP, and local progress.
- Game hub is easy to access and has a shared points ledger.
- Cloud/local sync exists in several places: main local storage, local backup, Firebase teacher sync, student activity outbox, and Google Drive audio handling.

### What Is Missing Compared To The Available Manual Pages

- No formal mastery gate connecting decoding, encoding, HFW, fluency, comprehension, repeated attempts, and teacher approval.
- Student app progress and teacher lesson evidence are not unified.
- Student Step 2.1 attempts are mostly local and do not currently send detailed item-level decoding/encoding attempts into the teacher evidence stream.
- Teacher dashboard does not yet show "current substep readiness" with required evidence categories and missing evidence.
- Teacher cannot yet assign a specific lesson/drill from the main planner into the student app as a structured assignment tied to `lessonId`.
- Progression is still partly page-progress/activity-progress driven.
- No robust teacher approval/hold/override workflow for advancement.
- HFW mastery is not first-class across reading and spelling.
- Vocabulary notebook is not first-class.
- Word marking and syllable scooping are teacher-side tools, but not yet complete student evidence tools.
- Dictation saves misses, but not full attempt totals and proofreading evidence.
- Part 10 is underdeveloped.
- Games are not yet governed by a central rule that each game/activity must declare step, substep, skill type, source pool, and mastery impact.
- Step Instruction, detailed Block 3 Guide, and Appendix source pages are missing from the provided PDF, so exact procedure coverage cannot be verified yet.

## Data Model Updates Needed

### `studentEvidenceAttempt`

Use this for every student activity, teacher chart, dictation item, game round, fluency read, vocabulary response, and comprehension response.

Suggested fields:

- `id`
- `studentId`
- `studentName`
- `groupId`
- `lessonId`
- `planId`
- `step`
- `substep`
- `phase`: `introductory`, `accuracy`, `automaticity`, `fluency`
- `skillType`: `soundSymbol`, `conceptReading`, `wordCards`, `hfwReading`, `wordlistChart`, `sentenceReading`, `reverseDrill`, `spellingConcept`, `dictation`, `controlledPassage`, `vocabulary`, `comprehension`, `fluency`
- `lessonPart`: `1` through `10`
- `wordPattern`
- `item`
- `expected`
- `response`
- `correct`
- `errorType`
- `promptLevel`
- `timeMs`
- `attemptCount`
- `sourceType`: `teacherLive`, `studentLesson`, `game`, `homePractice`
- `sourcePage`
- `teacherReviewStatus`: `notRequired`, `pending`, `approved`, `needsReteach`
- `masteryImpact`: `none`, `practice`, `evidence`, `gate`
- `createdAt`

### `masteryGate`

Suggested fields:

- `studentId`
- `substep`
- `status`: `notStarted`, `accuracyBuilding`, `automaticityBuilding`, `readyForTeacherReview`, `approvedToAdvance`, `paused`, `overrideAdvance`
- `requirements`
- `evidenceIds`
- `missingEvidence`
- `teacherApproval`
- `teacherNotes`
- `overrideReason`
- `updatedAt`

### `assignment`

Suggested fields:

- `assignmentId`
- `studentIds`
- `groupId`
- `lessonId`
- `substep`
- `skillType`
- `activityTemplateId`
- `itemSource`
- `dueDate`
- `teacherReviewRequired`
- `status`

### `activityTemplate`

Suggested fields:

- `templateId`
- `title`
- `lessonPart`
- `skillType`
- `allowedSubsteps`
- `currentOrReview`
- `requiresTeacherReview`
- `masteryImpact`
- `gameLikeAllowed`
- `sourcePool`

## Student Activity Redesign Guidance

Do not add more free-floating games until activities declare their instructional purpose.

Redesign student activities around these templates first:

- Sound-symbol quick drill
- Reverse sound-to-tile drill
- Word card automaticity
- High frequency word reading/spelling
- Word build with tiles
- Typed spelling dictation
- Sentence dictation and proofreading
- Syllable scoop and word marking
- Controlled sentence reading
- Controlled passage reading/retell
- Vocabulary notebook entry/review
- Fluency timing or recording
- Comprehension retell/question response

Existing games can remain if they are reclassified:

- Decode Dash: decoding/word recognition only for declared substep/pattern.
- Word Builder: spelling/encoding and word construction only for declared substep/pattern.
- Syllable Slice: syllable division/scooping only for declared substep/pattern.
- Letter Hunt/Letter Soccer: needs tighter Wilson skill declaration before it can count as evidence.
- Cursive Stroke Lab: handwriting/support skill, not Wilson mastery evidence unless attached to dictation/proofreading goals.

## Teacher Tools To Add First

1. Mastery Control Center
   - Student current substep
   - Evidence by category
   - Missing gate evidence
   - Error patterns
   - Recommended repeat/advance/hold
   - Teacher approve/pause/override

2. Assignment Builder
   - Start from current lesson/substep
   - Choose skill type and item source
   - Assign to one student or group
   - Require teacher review where needed

3. Review Queue
   - Student app attempts awaiting review
   - Dictation and written responses
   - Fluency recordings
   - Comprehension/retell notes

4. Evidence Timeline
   - Teacher charting
   - Dictation
   - Student app attempts
   - Games that count as practice/evidence
   - Lesson history links

5. Error Pattern Engine
   - Sound confusions
   - Grapheme errors
   - HFW misses
   - Nonsense word decoding weakness
   - Syllable/suffix/prefix/base errors
   - Fluency/comprehension notes

## Copyright and Fidelity Risks

- Do not copy manual procedures verbatim into public app text.
- Do not store or expose large manual excerpts in code, data files, prompts, or student-facing screens.
- Use paraphrased internal design notes and source-page references.
- Keep Wilson-controlled reader/dictation/source materials private and local unless the user confirms licensing and distribution boundaries.
- Do not represent Teach Today as an official Wilson product.
- Avoid "random game" expansion. Every game must declare its Wilson-aligned step, substep, skill, source pool, and whether it is practice or teacher-reviewable evidence.
- Do not implement exact missing procedures from memory or inference. The PDF provided does not include Step Instruction, detailed Block 3 Guide, or Appendix pages.

## Recommended Next Patch Plan

### Patch 1 - Evidence and Mastery Model

Add shared local data structures and helpers:

- `studentEvidenceAttempt`
- `masteryGate`
- `assignment`
- `activityTemplate`
- migration from existing charting/dictation/student lesson progress into computed evidence summaries

Goal:
Create the backbone without changing classroom workflow yet.

### Patch 2 - Teacher Mastery Control Center

Add a dashboard panel that computes readiness from existing evidence:

- decoding charting
- nonsense charting where available
- automaticity/timing
- dictation/encoding misses
- marked review words
- Section 9 notes where available
- student app activity imported from cloud/local records

Goal:
Teacher sees why a student should repeat, hold, or be reviewed for advancement.

### Patch 3 - Student Activity Event Logging

Update `student-lesson.js` so every attempt and activity completion can create a `studentEvidenceAttempt` and queue it through `student-activity-sync.js`.

Goal:
Student app practice becomes teacher-visible, item-level evidence instead of isolated XP/progress.

### Patch 4 - Assignment Builder

Let the teacher assign a lesson-linked activity from the planner/profile:

- current substep
- lesson part
- skill type
- item source
- review requirement

Goal:
Student app becomes the interactive extension of teacher instruction.

### Patch 5 - Activity Guardrails

Add an `activityTemplate` registry and require games/student activities to declare:

- step/substep
- skill type
- word pattern
- item source
- mastery impact
- teacher review requirement

Goal:
Prevent random games from counting as Wilson progress.

### Patch 6 - Complete Source Follow-Up

When the complete manual scan is available:

- Verify exact Step Instruction procedures for Steps 1-6.
- Verify detailed Block 3 Part 9/10 procedures.
- Verify Appendix forms and end-of-step assessment details.
- Update mastery gates and teacher tools accordingly.

Goal:
Avoid coding unsupported rules from an incomplete source.

