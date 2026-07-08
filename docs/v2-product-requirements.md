# Teach Today V2 Product Requirements

## Product Definition

Teach Today V2 is a teacher-controlled Wilson-style lesson planning and student practice system. It connects lesson plans, assignments, student evidence, teacher review, and mastery decisions while presenting the student side as a fun educational game platform.

The teacher side is the instructional control center. The student side is the learning game world. The data layer is the evidence and mastery engine. The art layer is modular and can be designed separately, then imported cleanly.

## Month 1 MVP

The Month 1 MVP is one complete vertical slice for Step 3.1-style multisyllabic work.

The slice must prove:

1. Teacher creates or selects a lesson.
2. Teacher assigns the lesson to a student or group.
3. Student sees assigned activities.
4. Student completes activities.
5. App saves evidence from each activity.
6. Teacher reviews evidence.
7. Mastery status updates only from evidence and/or teacher decision.
8. Teacher can decide repeat, continue, or review.

## Step 3.1 Slice Scope

The MVP should support a small seeded Step 3.1 curriculum set with:

- Multisyllabic word reading
- Syllable division and scooping
- Schwa awareness
- Prefix and suffix review
- Word cards
- Word building with tiles
- Encoding/spelling practice
- Dictation-style typed responses
- Controlled sentence or passage reading
- Simple comprehension/retell note or recording

Use the manual and lesson decks as private design references. Do not copy protected manual text or lesson slide content into the app.

## Included In MVP

- V2 teacher shell
- V2 student shell
- One seeded teacher account/profile shape
- Basic students and groups
- Step 3.1 curriculum seed
- Lesson template for the Step 3.1 vertical slice
- Teacher lesson planner
- Teacher lesson runtime/checklist
- Assignment creation from a lesson
- Student assignment list
- Student activity runtime for 3-5 activity types
- Evidence logging for every student attempt
- Teacher review queue
- Simple mastery status
- Lesson history
- Basic reporting for the selected student/group
- Local-first data model with Firebase-ready collection paths
- Asset slots and placeholder art hooks

## Intentionally Excluded

- Full Steps 1-12 implementation
- Exact substep procedures beyond available approved source material
- Full Block 3 guide logic until the later source pages are provided
- Full Appendix/form reproduction
- Automatic speech scoring
- Handwriting recognition
- Multiplayer games
- Parent portal
- AI-generated lesson content in the live MVP
- Public reproduction of protected Wilson text or lesson deck text
- Points-based progression

## V1 Pieces To Reuse

- Existing 10-part lesson section concept
- Teacher dashboard and quick planner ideas
- Reader, wordlist, sentence, dictation, and high frequency word data structures where legally appropriate
- Existing charting and live record ideas
- Section 9 passage viewer ideas and recording workflow
- Student profile/reporting ideas
- Firebase/local backup lessons learned
- Game hub concept as a future launch surface
- Word building, syllable, dictation, and decoding game ideas after they are connected to evidence

## V1 Pieces To Leave Alone For Now

- Monolithic global app state
- Completion-based student mastery labels
- Game points as progress
- Student map that exposes too much future curriculum
- Legacy localStorage shapes as the V2 source of truth
- Existing games until they can declare lesson, skill, source item set, and mastery impact
- Deep refactors of V1 pages not needed for the vertical slice

## Teacher Requirements

- Teacher can select student/group, step/substep, lesson template, and lesson items.
- Teacher can see which lesson parts are included.
- Teacher can assign student activities from the lesson.
- Teacher can run a live lesson and mark observations.
- Teacher can review student attempts before they affect mastery.
- Teacher can repeat, continue, pause, or override with a reason.
- Teacher can view lesson history and evidence summaries.

## Student Requirements

- Student sees only assigned work.
- Student uses nickname/avatar identity.
- Student activities feel like quests or challenges.
- Student receives immediate, encouraging feedback.
- Student can retry weak items.
- Student earns effort/reward feedback without automatic advancement.
- Student attempts save instructional evidence.

## Game/Activity Rule

An activity can be playful, animated, and rewarding, but it must declare its instructional connection:

- Lesson plan
- Assignment
- Step/substep
- Lesson part
- Skill type
- Decoding or encoding target
- Item source
- Evidence saved
- Teacher review status
- Mastery impact

If it cannot declare these fields, it is not part of the Lesson Engine MVP.

## MVP Success

The MVP succeeds when a teacher can plan one Step 3.1 lesson, assign it, watch a student complete connected practice, review the evidence, and make a mastery decision without relying on points or completion alone.
