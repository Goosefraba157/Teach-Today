# Teach Today V1 Focus Map

## Product Boundary

V1 Teach Today is the active product. Its current visual design and working routes are the baseline to protect.

The `/v2/` directory is a paused lesson-engine experiment. It remains in the repository for reference and possible future reuse, but it is not part of the active slide work.

Files named `lesson-planner-v2-*` are a separate presenter prototype created after the `/v2/` experiment. They may supply useful presentation behavior, but they do not replace V1.

## Active User Path

1. Teacher opens `TeachToday.html`.
2. Teacher selects a group.
3. Teacher builds or opens the current lesson.
4. Teacher enters the live lesson runtime.
5. Teacher enters presentation mode.
6. Teacher navigates lesson slides and optionally opens the student display.

This path is the acceptance boundary for current work.

## V1 Surface Map

| Surface | Primary files | Current role |
| --- | --- | --- |
| Teacher home and planner | `TeachToday.html`, `teach-today.js`, `teach-today.css` | Group selection, lesson setup, lesson launch |
| Live lesson runtime | `TeachToday.html`, `teach-today.js`, `teach-today.css` | Sections 1-10, charting, dictation, pacing |
| Presentation mode | `TeachToday.html`, `teach-today.js`, `teach-today.css` | Teacher-facing presentation controls and lesson display |
| Recovered presenter prototype | `lesson-planner-v2.html`, `lesson-planner-v2.js`, `lesson-planner-v2-presenter.js`, `lesson-planner-v2.css` | Source of slide patterns to evaluate and selectively integrate |
| Student display | `StudentDisplay.html`, `student-display.js`, `student-display.css` | Projected/student-safe lesson content |
| Student lesson | `student-lesson.html`, `student-lesson.js`, `student-lesson.css` | Student-facing lesson activities and progress |
| Curriculum/data indexes | `reader-*.js`, `dictation-*.js`, `wilson-hfw-data.js` | Reader, sentence, dictation, and high-frequency-word content |
| Persistence and sync | `app.js`, Firebase rules/config, student activity/progress modules | Local state, Firebase integration, records and progress |
| Developer tools | `DeveloperDashboard.html`, `developer-dashboard.js`, `developer-menu-config.js` | Safe access to previews, diagnostics, and experimental routes |
| Offline support | `service-worker.js`, `manifest.webmanifest`, `pwa-register.js` | Installability and asset caching |

## Safety Rules for Slide Work

- Keep V1 routes and filenames stable.
- Integrate one presentation behavior at a time.
- Preserve classic V1 behavior until the replacement behavior is verified.
- Check `service-worker.js` whenever a runtime asset is added or renamed.
- Do not connect the active V1 navigation to `/v2/`.
- Do not delete the presenter prototype after copying a feature; retain it until the V1 slide audit is complete.
- Run JavaScript syntax checks and smoke-test the active user path after every integration batch.
- Commit each known-good slide milestone so rollback remains simple.

## Current Priority

Create a slide-by-slide comparison of V1 presentation mode and the recovered presenter prototype, then improve V1 while retaining its existing visual language.
