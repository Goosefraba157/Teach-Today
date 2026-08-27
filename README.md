# Dyslexia Instruction Engine

A local browser app for managing reading groups and generating ready-to-teach weekly lessons from a structured substep map.

## Open it

Open `index.html` in a browser.

For the live iPad-style lesson flow, open `TeachToday.html`.

From Teach Today, use `Student profile` to open a separate student data tab.

For patch testing, open `DeveloperDashboard.html` and unlock creator mode. The master menu entries live in `developer-menu-config.js`; add future pages, games, prototypes, diagnostics, or debug links to that one list and the dashboard will render them automatically. The access helper is `developer-access.js`, and installed/offline coverage is listed in `service-worker.js`.

For student-data checks, open `DeveloperDataDiagnostic.html` from the developer dashboard. It compares one student across the teacher master state (`dyslexiaInstructionEngine.v2`), student home session (`tt_student_v1`), lesson progress keys (`teachToday.studentLessonProgress.v1.<studentId>`), the Game Hub ledger (`teachTodayGameHub.v1`), standalone 2.1 drill stores, student activity outbox, game-specific stores, and backup/sync status flags. New stores should be added to `developer-data-diagnostic.js` in the store summary and student report builders so future patches stay auditable.

## Fast backup recovery

Use the newest `teach-today-daily-YYYY-MM-DD.json` from Google Drive -> Teach Today Backups -> Daily or iPad Files -> On My iPad -> Teach Today Stage -> Backups -> Daily. Stop edits on every device, preserve the current Firebase revision, compare stable IDs and counts, and recover additively. Never replace newer valid data with an older whole-app file, and do not broadly search Firebase when the teacher has supplied a dated checkpoint.

## What it does

- Stores groups, students, current substep, trouble spots, teacher notes, and past plans in the browser.
- Includes the full Student Reader substep spread from 1.1 through 12.6.
- Tracks the Reader flow by substep: Section #4 wordlist charting pages, sentence pages, and Section #9 passage pages.
- Shows the current Reader position in setup, such as 1 of 11 AB wordlist pages, plus the matching sentence and passage positions.
- Pulls lesson word chips from the exact assigned Section #4 Reader wordlist page.
- Displays the assigned Section #4 wordlist in a chart-style top/bottom layout.
- Defaults live charting to the bottom half, with a clear Top/Bottom selector so the score matches the half being taught.
- Displays the assigned Reader sentence page with high-frequency words and the numbered sentence list.
- Adds live Section #4 data capture: select one active student, mark OK/X per word, type what the student said, time the read, add notes, and save the record.
- Shows obvious timer/microphone status while teaching, including blocked microphone notes when the browser does not allow recording.
- Keeps one master in-app record log for all students and all groups, with CSV export for Excel.
- Saves the charting half, correct count, wrong count, WCPM, wrong words, spoken attempts, timing, notes, and next recommendation.
- Shows a quick student snapshot with recent lessons, average correct, WCPM, automaticity rate, frequent misses, and next recommendation.
- Adds numbered trend lines for accuracy, WCPM, and sec/15w, plus color status dots so students who need support are easy to spot at a glance.
- Shows Section 2 in the setup area with 6 review words and 8 current words before the Section #4 page tracker; review real words come from Reader wordlist pages and review nonsense words come from Reader `N` pages.
- Regenerates Section 2 word choices each time Generate is clicked while keeping saved plans stable.
- Highlights important student-record columns with color so accuracy, timing, WCPM, and risk are easier to scan.
- Uses structured Dictation Book content for Block 2: words, phrases, sentences, and cumulative "What Says?" sound summaries for Steps 1-6.
- Section 1 now lists cumulative short vowel codes, v-e long sound codes, consonants, welded/glued sounds and exceptions, known prefixes, known Latin bases, and known suffixes by substep.
- Always includes review words. If no trouble spot is entered, the app picks review words from a prior substep/concept.
- Defaults to AB pages, with A available for support and B available for challenge.
- Records Section #4 results using 15-word charting: 12+/15 for accuracy, 14+/15 for fluency, and 12+/15 under 35 seconds for automaticity.
- Repeats a page when accuracy is below 12/15, and uses the previous page as a warm-up when accuracy is present but fluency or automaticity is not.
- Generates a week of lessons with Reader page assignments, review words, current charting words, Dictation Book spelling content, sentence reading, passage reading, and a teacher adjustment move.
- Adds a copy-ready lesson script for each generated lesson using the three-block WRS flow: Word Study, Spelling, and Fluency/Comprehension.
- Labels sections 1-10 so the lesson can be copied into a planning document quickly.
- Adjusts the plan when you mark needs such as blending, suffix confusion, slow decoding, dictation, vowel sounds, multisyllable division, nonsense words, or fluency.
- Prints or copies the generated week.
- Adds a separate `TeachToday.html` view for vertical iPad use: one sticky teaching bar, quick section jumps, and Sections 1-10 stacked for live class flow.
- Adds `StudentProfile.html` for individual student history, graphs, marked review words, frequent misses, and full lesson records.

## Curriculum note

The app is built around a Wilson-style scope progression and original decodable practice items. It does not copy lesson pages, passages, or proprietary word lists from copyrighted materials. A future version can add a private import area for teacher-owned/licensed word banks.

## Next build targets

- Add an import screen for custom word banks by substep.
- Add audio playback storage for prior microphone sessions when browser storage allows it.
- Add deeper student trend charts for school-year reporting.
- Add a weekly calendar view.
- Export lesson plans as PDF or DOCX.
- Add admin settings for school year, ARD notes, and progress summaries.
