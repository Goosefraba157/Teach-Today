# Rolling turtle Home drawer — visual verification

## Source and evidence

- Approved layout: `/Users/macg/.codex/generated_images/01a18a38-c480-7692-b1e9-97457bb9e3dc/exec-6a43cbeb-99c9-4d02-93b2-079c7a788650.png` (full-width cards, small edge overlap; turtle character subsequently refined).
- Approved character/roll: `/Users/macg/.codex/generated_images/01a18a38-c480-7692-b1e9-97457bb9e3dc/exec-a0c50281-f1c0-4df9-9cdd-713b527ae023.png` and original `assets/morrocoy-logo.png`.
- Implementation: isolated synthetic Home at `http://localhost:4174/TeachToday.html`.
- Desktop screenshots: `tmp/home-design/turtle-open.png`, `turtle-closed.png`. Full-screen comparison: `turtle-comparison.png`; focused artwork comparison: `turtle-art-comparison.png`. Original generated production atlas inspected as well.
- Desktop CSS viewport 1280×889. Source layout normalized to 1280×889; final browser image 1269×881 (capture omits viewport gutter), normalized to 1280×889 for comparison. Source and screenshot are at Home top, first group selected, ten synthetic groups, no open panels. Keyboard focus outline on the handle is intentional accessibility feedback. No classroom data was used in screenshots.
- Additional browser evidence: `tmp/home-design/turtle-ipad-portrait-open.png` / `turtle-ipad-portrait-closed.png`, `turtle-ipad-landscape-closed.png`, `turtle-phone-open.png` / `turtle-phone-closed.png`.

## Comparison history and fixes

1. Initial interaction review confirmed true mouse dragging and endpoint poses, with zero console errors. Removed a redundant desktop Close menu row to retain the approved compact sidebar; phones keep that secondary close control.
2. Tablet review found that an auto-fill grid could add a column after closing and make cards smaller. Fixed column count by viewport so releasing the drawer width always enlarges existing cards: 834px viewport 194→256px, 1024px 184→236px, 1280px 196→238px. Post-fix screenshots/DOM measurements confirm no sideways overflow in open or closed states.
3. Added inert covered content and destination auto-close for phone overlay. Browser verified inert attributes, Escape dismissal, accessible handle labels/expanded state, and opening History followed by automatic drawer closure. Reference menu buttons deliberately keep the drawer open so their links remain usable.
4. Final full-screen source/implementation comparison and focused approved-character/production-atlas comparison opened together and inspected. No actionable P0/P1/P2 findings remain.

## Fidelity surfaces

- Typography: existing V1 fonts, navy text, compact card hierarchy and readable roster/position/status wrapping retained. No new font dependency.
- Layout/spacing: closed drawer leaves zero reserved gutter, normal page padding only. Handle overlaps a small part of the left edge as approved, moves with the menu, and remains tappable when closed. Existing header, controls, new/demo cards, continuation/history surfaces remain; phone main content stays full width behind the overlay.
- Colors/tokens: original white/mint/teal sidebar and group colors retained. Generated turtle matches the approved teal shell, olive/gold plates, educational emblems and friendly golden-brown face/belly.
- Assets: genuine generated transparent nine-pose atlas, alpha preserved, uniformly normalized to a 768-square WebP (~142KB). Existing logo remains and serves as artwork-load fallback. No code-drawn replacement character. Adjacent poses blend according to actual drag position, including reversal; endpoint poses are clear at the small handle size.
- Copy/content: card and navigation labels unchanged. Handle announces Open/Close with drag direction and expanded state. Turtle sound is explicit and off initially; its optional local sound is a synthesized chuckle effect, not recorded speech.

## Verification

- All 192 automated checks pass, including mouse/touch gesture progress and reversal, single-tap behavior, release-click suppression, cancel/lost capture/resize, keyboard, blocked storage, saved preferences, phone focus isolation/dismissal, reduced motion and offline first-use versioned runtime resolution and asset wiring.
- Real browser mouse drag closed/reopened the drawer; tap and arrow keys work. Readers submenu remains functional. Optional sound setting toggles without console errors. Closed state survived reload.
- Browser responsive checks cover 1280×889, 1024×768, 834×1194 and 390×844 with no horizontal overflow. Phone overlay/backdrop, reference submenu, destination auto-close and Escape were checked.
- Production controller never reads/writes classroom state or calls cloud/microphone APIs. Only two isolated UI preference keys are written.
- Syntax and Git diff checks passed. Browser console: zero errors in the synthetic workflow.

## Limits / follow-up polish

- Physical iPad touch and speaker audibility remain teacher checks. The optional synthesized effect is deliberately quiet; no real voice recording is included.
- Existing production header/branding placement is retained; approved illustration poses are adapted to a small practical handle with consistent character identity.

final result: passed
