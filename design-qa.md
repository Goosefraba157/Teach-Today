# V1 compact Home — visual verification

- Source visual truth: `/Users/macg/.codex/generated_images/01a18a38-c480-7692-b1e9-97457bb9e3dc/exec-8fb95b8c-a93a-42dc-b279-a95c078d9e70.png`, followed by the teacher-approved completed/planned/in-progress/no-lesson status wording.
- Implementation: `http://localhost:4174/TeachToday.html`, isolated synthetic fixture only.
- Screenshot: `tmp/home-design/home-desktop.png`; comparison: `tmp/home-design/comparison.png`.
- Source pixels 1505×1045 normalized to 1280×889; browser capture 1280×889 CSS/pixel size at density 1. State: Home, first group selected, ten synthetic groups, top of page, closed menus. Screenshot names/data are fictional; no classroom data was used.
- Additional captures: `tmp/home-design/home-ipad-landscape.png` (1024×768), `home-ipad-portrait.png` (834×1194), `home-phone.png` (390×844). These local test artifacts are not published.

## Comparison history

1. Initial browser review found legacy `!important` styles shrinking sidebar data labels to 11px and tap targets to 34px. Fixed with scoped 14px/44px sidebar rules; preserved 13px labels at narrow tablet sizes. Hid legacy hidden account badges explicitly.
2. Responsive review found the existing lesson-history select creating 455px document width at 390px viewport. Constrained the history grid track and select; final browser measurement is 390px document width, with Tools opening/closing normally.
3. Final combined source/implementation image opened and visually inspected. No actionable P0/P1/P2 findings remain. Source image and implementation were compared at the same normalized viewport and Home state. Whole-screen comparison includes sidebar, header and both group-card rows; separate cropped regions were unnecessary because the combined image exposes all fidelity surfaces.

## Fidelity surfaces

- Typography: existing system/Inter stack retained, navy hierarchy, 14px roster text, 26px position values, 14px sidebar labels, readable wrapping. No roster truncation. Card titles retain actual saved group names.
- Spacing/layout: compact header, light 210px sidebar, five uniform columns at 1280px, four at iPad landscape, three portrait, one phone column. Consistent card field order and clear separate 44px Combine/Edit controls. Longer status wording intentionally adds a second line. Existing new/demo cards and continuation/history controls remain below.
- Colors/tokens: light white/mint/teal navigation, existing per-group colors preserved rather than reassigning mock colors. Selected card subtle group tint; position/status blocks use consistent pale group shades and dark readable text.
- Assets: original product logo retained intentionally rather than replacing it with the generated book symbol. Vendored Bootstrap Icons 1.11.3 SVG files with MIT license; no handcrafted icons or rasterized UI. Icons are offline-cached.
- Copy/content: all requested card removals made; names/progress preserved. State labels reflect saved plans and explicit drafts. Last section follows timestamps and meaningful activity; no synthetic chronology for untimed legacy records. No lesson number fabricated for unnumbered drafts.

## Interactions and verification

- Sidebar Readers popover, History and Records open; Home closes shared panels.
- Combine and Edit dialogs open and cancel without saving changes.
- School-year switching retains archived read-only group cards and restores current groups.
- Continue Lesson opens the existing teacher/Present flow. Working with Section 3 and returning through the presentation menu updates Home to Last worked: Section 3; no automatic section completion.
- Mobile Tools opens/closes with matching aria-expanded state.
- No sideways overflow at the four tested sizes. Sidebar scrolls at shorter tablet heights so all destinations remain available.
- Browser console: zero errors in the synthetic workflow. Automated checks: 183 passed; syntax and diff checks passed.

## Follow-up polish / limits

- Physical iPad touch and the teacher's real long group names remain classroom checks. Existing product branding, group-color assignment, account controls and attendance reminder intentionally remain.

final result: passed
