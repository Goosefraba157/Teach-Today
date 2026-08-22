# Teach Today Stage Proof

This isolated iPad app verifies the exact external-display hardware path before the V1 web app is embedded.

- The iPad main scene is teal and marked `A`.
- A connected external display receives a blue noninteractive scene marked `B`.
- The project does not read or write Teach Today, Firebase, or student data.

Open `TeachTodayStageProof.xcodeproj`, choose a Personal Team under Signing & Capabilities, select the connected iPad, and run. After installation, disconnect the Mac and attach the projector while the proof app remains open.

Verified on the target non-M1 iPad using AirPlay Screen Mirroring to a Mac:

1. Start Screen Mirroring.
2. Close Stage Proof from the iPad app switcher.
3. Reopen Stage Proof while mirroring remains connected.

The iPad retains the teal `A` teacher scene and the AirPlay receiver shows the blue `B` student scene. USB-C/HDMI remains the wired fallback. No signing team is stored in Git; each developer selects their own team locally.
