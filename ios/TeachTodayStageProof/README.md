# Teach Today iPad Stage Shell

This project wraps the hosted V1 teacher app in an iPad `WKWebView` and renders its sanitized Student Stage payload in a separate, noninteractive external-display scene.

- The iPad main scene loads the existing hosted `TeachToday.html` experience.
- The external scene loads `StudentDisplay.html` in a nonpersistent web store.
- Stage messages are accepted only from the trusted GitHub Pages app origin and pass through a second Swift whitelist before projection.
- The latest sanitized payload is held in memory only and replayed when an external display reconnects.
- A neutral reconnecting screen covers external-page loading or process failures, so teacher content is never used as a fallback.
- `Mirror Teacher` can deliberately show the exact teacher webview on the connected display for live modeling. It requires a privacy warning, keeps no frame history, and ends whenever a Stage choice is selected or the app leaves the foreground.
- The shell contains no Firebase configuration, credentials, roster, student result, or lesson-record code. Firebase remains owned by the hosted V1 app.
- Stage is local-only: its verified persistent WebKit/IndexedDB store is the classroom authority. Automatic Firebase synchronization is paused. Native Files checkpoints and explicitly connected Google Drive backups remain independent; browser/Safari keeps its separate protected Firebase workflow. Follow `../../HANDOFF.md` if an older note conflicts.

Open `TeachTodayStageProof.xcodeproj`, choose a Personal Team under Signing & Capabilities, select the connected iPad, and run. Approve the macOS Keychain prompt if the development certificate requests signing-key access. The Personal Team stays in local Xcode settings and is not committed.

The browser-based Present and Student Stage flow remains unchanged. Inside the native shell, the existing Stage `Follow Lesson` control drives the external scene without opening a second teacher-facing window. `Mirror Teacher` is shown only in the native shell.

Section 4 Follow Lesson uses exact lossless page images generated from the official Reader PDFs. Do not restore raw PDF embedding: iPad `WKWebView` may ignore the requested page fragment and show the Reader cover instead.

Section 8 Follow Lesson and the manual Paper choice use the fixed lossless image rendered from the official WRS Student Dictation Page. The hosted app precaches that page for offline use and retains the generated worksheet only as a loading/error fallback; no native payload field or rebuild is required for this display change.

## Verified

- The original A/B scene proof succeeded on the target non-M1 A16 iPad over AirPlay Screen Mirroring.
- The webview shell builds for physical iOS and the matching A16 iPad simulator.
- The A16 simulator renders the hosted Teach Today onboarding at full iPad size.
- A standalone sanitizer check confirms unapproved student names, notes, scoring fields, and external asset URLs do not cross the native Stage boundary.
- The installed webview shell loads the hosted V1 app and successfully controls a separate external student display over Screen Mirroring.

## Still to verify on hardware

- Keep Stage automatic Firebase synchronization off; verify local storage and native Files/connected Drive checkpoint status.
- Start Present mode, select Follow Lesson, and confirm Sections 1-9 update the external scene.
- Disconnect and reconnect AirPlay, then background and foreground the app, confirming the latest student-safe stage returns.
- Keep the existing browser Present/Stage flow available as the recovery path until these checks pass.
- Select `Mirror Teacher`, approve the warning, and verify the receiver follows the visible teacher webview smoothly; then select `Follow Lesson` and verify the sanitized Stage returns immediately.
- Background the app while mirroring and verify it resets to Stage before returning to the teacher webview.

Verified on the target non-M1 iPad using AirPlay Screen Mirroring to a Mac:

1. Start Screen Mirroring.
2. Close Stage Proof from the iPad app switcher.
3. Reopen Stage Proof while mirroring remains connected.
4. Use `Follow Lesson` or another Stage choice for the student-safe display.
5. Use `Mirror Teacher` only when the visible teacher webview is safe for students to see.

The original proof retained the teal `A` teacher scene and showed the blue `B` student scene on the AirPlay receiver. USB-C/HDMI remains the wired fallback.

## Lesson library and device PDFs

The V1 **Lesson library** on Home and the lesson toolbar browses saved lessons by school year, group, and stable student history. Selecting a group enables **Print all [group] lesson plans**. The library and PDF generation do not open a teaching lesson or write classroom records. Older lessons without student links remain available in group view; absent and unconfirmed participants are labeled explicitly.

The updated shell exposes **Open on device** (Apple Quick Look), **Open in…** (the system share/app chooser), and **Print** (AirPrint controls). Files stay under `On My iPad/Teach Today Stage/Lesson Plans/<group>/Planned|Completed|Downloaded`; group bundles and device-view copies use `Downloaded`. Connected Drive archives use `Teach Today Backups/Lesson Plans/<group>/...`. The bridge accepts only local archive PDF paths from the trusted main frame, validates the resolved path/content/size, and resets teacher mirroring before presenting private documents. Quick Look editing is disabled. Opening print controls does not mean a printer was selected or printing completed.

Older installed shells retain the in-app PDF preview and web sharing/Files fallback until updated. Install the new signed build **over** the existing app only after preserving the current checkpoint; never uninstall, clear WebKit data, change the bundle identifier, or restore an older whole-app snapshot. Physical viewer/share/AirPrint operation remains a hardware check after installation.
