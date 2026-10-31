# Compact bubbles and personal sidebar — visual verification

## Reader ink correction (2026-10-30)

- Latest patch `20261030-reader-ink-2`: all twelve color families reviewed against the teacher-confirmed cover-color table. Reader3 gold and4 yellow are now visually distinct; lime/cyan/light gray regain their intended pale fill. A1px darker digit edge keeps pale numbers legible; no shaded boxes. Non-stroke fallback and forced-color override are included.
- Actual26px number samples: tmp/home-design/reader-palette.png, rendered from the production color/outline functions and stylesheet. All12 inspected together, especially3.5 versus4.2. Home capture: tmp/home-design/reader-ink-home.png. Bright fills differ from the earlier mock’s over-darkened accessible palette intentionally at the teacher’s request.
- Similar pairs2/3,3/4,5/6,7/8,9/10,11/12 have CIELAB deltaE76≥25 regression coverage. Every digit edge has contrast≥4.5:1 against white; this measures edge contrast, not the pale fill itself. Actual computed stroke is1px, expected fill/edge colors and paint order verified in browser.
- Records uses the real Bootstrap floppy.svg icon with a faint matching watermark; unchanged label and existing data panel opens/closes successfully. Icon is offline-cached. No existing text, routes, classroom data or save behavior changed.
- All196 automated checks pass, including prior data-immutability/offline tests. Synthetic Home has no console errors or horizontal overflow. Publication verified 2026-10-31: `b0b2d96`, successful Pages deployment 41170681060; all ten checked public responses match tested bytes, including exact iPad entry and floppy icon.


## Targets and evidence

- Approved cards: generated `exec-921748db-fb6b-4f2b-9404-e5be2054be5a.png` (selected four-column option 3, revised to colored digits only).
- Approved sidebar: generated `exec-4ba8c569-6c51-47fc-9558-413ec15e2488.png` (selected warm option 2, then revised binder forms, shaded chart columns and straight Profile circles).
- Implementation: isolated fictional classroom at http://localhost:4174/TeachToday.html. No production student data used.
- Final screenshots: tmp/home-design/bubbles-desktop.png, bubbles-desktop-closed.png, bubbles-ipad-landscape.png, bubbles-ipad-portrait.png, bubbles-phone-open.png and bubbles-phone-closed.png.
- Combined full-view source/implementation: tmp/home-design/bubbles-comparison.png. Both full-screen images normalized to 1269×881 from the 1505×1045 source and 1280×889 CSS viewport (browser gutter excluded). Same Home/top/open-menu state. Different invented rosters/lesson values are intentional.
- Focused sidebar comparison: tmp/home-design/bubbles-menu-comparison.png. Source is a magnified standalone menu concept, not a literal device viewport; implementation retains the established 210px/184px drawer widths, typography and spacing. The comparison displays the source at 420px wide and the actual 210px sidebar at 2×. No pixel-perfect row-size claim is made for the standalone menu sketch. Binder, chart sheet, circles and date were separately inspected at actual UI size.

## Findings and fixes

- Initial compact pass still used 264px cards, leaving the third-row actions below the 889px viewport. Removed redundant stats padding, tightened gaps and reduced only the secondary Substep/Lesson labels. Final cards measure 243.55px and the tenth card ends at y857.64. Body roster text remains14px, status13px and actions44px high. All names remain visible and longer content can expand cards.
- Narrow sidebar date initially approached the Attendance label; reduced watermark to34px. At834px the label ends at x123.94 and the date begins at x124.14, with no overlap. Decoration is pale and does not intercept pointer events. Existing menu font13px is retained at this narrower width.
- Final combined comparisons opened and reviewed after fixes. No remaining P0/P1/P2 issues.

## Fidelity surfaces

- Typography: existing V1 font family and navy hierarchy retained; title20px, roster14px, substep/lesson26px. Names wrap in full, no clamping. Small stats labels11px match secondary hierarchy; existing sidebar fonts/wording remain unchanged.
- Spacing/layout: approved four-column neutral rounded bubbles, single thin stats divider and no nested tinted panels. Three/two/one columns at smaller breakpoints; existing New/Demo and continuation/history surfaces retained. Active group has a subtle teal outline. Drawer column count remains stable while released width expands cards. No horizontal overflow at1280×889,1024×768,834×1194,390×844.
- Colors: actual digits use cover-inspired ink for all12 readers; initial ink contrast was checked against white; the reader-ink correction above supersedes the pale fills with contrasting edges. Original group colors remain only in existing progress bars. Pale cream navigation rows, mint chart row, warm day watermark and four status-colored decorative circles match selected direction.
- Image quality: real approved raster crops with preserved aspect ratio, low contrast behind live labels. Lesson binder retains structured gray bands and rings; chart paper has shaded column cells and no connected line graph; Profile circles align in one row. No uploaded educational records or readable private data are in runtime artwork.
- Copy/content: every navigation label/icon/destination preserved. Existing lesson summary/status/last-section logic unchanged; no invented last-section label or completion. Current date is local calendar decoration, not attendance evidence. Reference mock numeric examples are not a request to change saved group values.

## Functional/data verification

- All195 automated checks pass, including all12 colors, invalid substep fallback, escaped full names, byte-identical classroom state after current/archive rendering, local midnight/month/foreground rollover without writes, turtle gesture/reduced-motion/preference behavior and exact versioned offline scripts/CSS/artwork resolution.
- Browser checks: Combine/Edit open and cancel; Attendance, Lesson library, Charting Central and Profile destinations; Profile returns Home; school-year archive browsing; Readers submenu; keyboard drawer collapse/expand enlarges cards from247.75→300.25px at1280; phone overlay/reference/menu destination auto-close. Action buttons retain44px touch height. Fresh final browser Home has no console errors. An earlier navigation/automation observer error did not recur in the fresh tab.
- Runtime diff changes only Home rendering markup/color helper, Home CSS, decorative day DOM updates, artwork and cache/entry versions. No classroom save/sync functions, Firebase configuration/rules, migration, roster/assessment/attendance data model, native shell or paused v2 edits.
- Physical iPad touch remains a teacher check. Longer saved group titles/rosters intentionally grow their cards rather than lose information.

Publication verified: code `973c82e`, Pages deployment 41165641708 succeeded. All nine checked public responses match tested files: HTML, exact native entry, main/controller JavaScript, CSS, service worker and three navigation images. No live student records were changed.

final result: passed
