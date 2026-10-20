# Section 8 Student Profile — design verification

final result: passed

This report covers synthetic fixtures only. No screenshots or records from a real student are included. Referenced images are retained locally in ignored private-input; machine-specific paths are excluded from this public report.

## Visual targets and capture

- Real words: `private-input/dictation-profile-qa-20261020/reference-real.png`
- Nonsense: `private-input/dictation-profile-qa-20261020/reference-nonsense.png`
- HFW: `private-input/dictation-profile-qa-20261020/reference-hfw.png`
- Browser: Codex in-app browser; local-only synthetic fixture at port 8797.
- Tablet CSS viewport and screenshot: 1440 × 1024, density 1. Source rasters: 1487 × 1058. Sources were proportionally fitted/padded to 1440 × 1024 for combined comparisons.
- Mobile CSS viewport and screenshot: 390 × 844, density 1. No mobile source design was supplied; mobile checks assess usability rather than pixel fidelity.
- Final captures: `private-input/dictation-profile-qa-20261020/teach-today-dictation-real-final.jpg`, `private-input/dictation-profile-qa-20261020/teach-today-dictation-nonsense-final.jpg`, `private-input/dictation-profile-qa-20261020/teach-today-dictation-hfw-final.jpg`, `private-input/dictation-profile-qa-20261020/teach-today-dictation-mobile-final.jpg`.
- Full-view combined comparisons: `private-input/dictation-profile-qa-20261020/teach-today-dictation-real-final-comparison.jpg`, `private-input/dictation-profile-qa-20261020/teach-today-dictation-nonsense-final-comparison.jpg`, `private-input/dictation-profile-qa-20261020/teach-today-dictation-hfw-final-comparison.jpg`.
- Focused chart/text comparison: `private-input/dictation-profile-qa-20261020/teach-today-dictation-final-focused-comparison.jpg`.

## Comparison history and fixes

1. Initial capture: the existing group picker pushed the graph below the useful tablet viewport (P2). The dictation view now collapses that picker behind a working Change student/group action. Compact heading/metrics spacing restores the graph and all date labels within the landscape viewport. Post-fix tablet capture and combined comparison were inspected.
2. Narrow-screen check: the existing flex header squeezed student identity behind the school-year controls (P2). A Profile-only mobile grid separates identity and controls, with normal document flow and a scrollable tab row. Final mobile screenshot was inspected; DOM width is 390 at a 390px viewport.
3. Bar text: increased saved-target text to 16px and adjusted uniform plot-height calculations for wrapping. Browser bounding-box checks confirmed every target stays inside its scored bar in real/nonsense/HFW views. Short bars keep an even numeric scale; zero is an annotation without a misleading filled bar.

No actionable P0/P1/P2 findings remain.

## Required fidelity surfaces

- Fonts/typography: retained V1's Inter/system stack and existing app header; 28px section title, 16px saved targets, 19px score labels. Correct/missed markers supplement color. The original header scale is intentionally retained rather than copying generated brand lettering.
- Spacing/layout: one full-width graph, no right duplicate list. All assessed targets are inside their bars. Date controls, evidence expansion, category selection, summary/history, and student switching work. Longer histories use horizontal scrolling; narrow screens retain usable column widths.
- Colors/tokens: existing teal/navy/white system; blue targets, red recorded errors/missed markers, teal correct markers, neutral observations-only columns, purple teacher tags. Existing V1 borders/radii are retained.
- Image/asset quality: existing app turtle/logo asset reused, with no substitute image assets or third-party viewer. Charts are live data visualizations, not raster mockups.
- Copy/content: production shows saved data, not sample error spellings. Missing written responses show a missed target only. Existing snapshots expose their legacy category-confirmation limitation. Variable HFW totals use percentage axes and actual denominators; the fixture's lists differ slightly from the illustrative mock and therefore its computed aggregate differs honestly.

## Behavior and integrity

- All 136 repository checks pass, including exact student/lesson matching, legacy preservation, per-category assessment, three category modes, future lessons, HFW-only exclusion from Real Words Progress Monitoring, timezone date labels, and fresh Stage storage reads.
- In-app browser verified correct weighted fixture totals, five/three/variable in-bar item counts, observation-only dates, date expansion, complete history, recurring misses, supporting-tag links (29 raw observations), empty/student switching, absence/unknown attendance safeguards, cancellation, and creation of only chosen category snapshots.
- A new synthetic lesson save refreshed the open graph immediately: latest date and total updated while unassessed HFW/nonsense totals stayed unchanged.
- The synthetic fixture's visible read-only check reported byte-identical saved state after browsing and zero page errors. Browser error logs were empty.
- Existing live teaching item buttons were not redesigned. No real device, cloud data, migration, or recovery operation was used.

## Remaining limits and follow-up polish

- Physical iPad touch, native WebKit rendering, and printing remain teacher/device checks. Printing uses the complete history table rather than clipping long graphs.
- P3: wording and density can be tuned after normal classroom use; no further styling loop is required before release.

## Implementation checklist

- [x] Approved graph layout and all three main categories.
- [x] Accurate source identity, provenance, category totals, date labels, and old-data preservation.
- [x] New-lesson confirmation/save path and fresh Profile updates.
- [x] Browser interactions, read-only integrity, mobile check, and combined visual comparisons.
- [x] Runtime/cache references and project continuity documentation updated.
