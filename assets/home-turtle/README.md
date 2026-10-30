# Home turtle animation

`roll.webp` is a transparent 768 × 768 atlas with nine equal 256 × 256 cells, read left to right, top to bottom. Frame 0 shows the shell (menu open), frame 4 the side, and frame 8 the belly (menu closed). Home blends adjacent frames according to drawer position. The controller draws supplied artwork; it does not draw an approximate turtle with code.

Created with the built-in OpenAI Image Gen tool from the approved turtle concept and the existing `assets/morrocoy-logo.png`. The generated 1254 × 1254 RGBA atlas was resized uniformly to 768 × 768 and encoded as WebP, preserving alpha. It contains no classroom data.

Generation brief: one exact 3 × 3 transparent sprite grid of the same friendly logo-inspired stout tortoise rolling sideways about its head-to-tail axis from shell-up through side-on to belly-up; fixed overhead camera, head toward the top in every cell, matching teal/olive/gold shell, brown-eyed friendly face, four feet and golden toes, simplified book/checkmark/pencil scutes, no cape, no text, no drawn grid or background, consistent scale and centered frames. Nine row-major angles from 0 through 180 degrees. The requested 1536-square output was returned at 1254-square and normalized before use.

The optional quiet sound is synthesized locally with Web Audio after deliberate interaction; it is not a voice recording. Sound defaults off. Both sound and drawer-position preferences stay in separate device-local keys and never enter classroom records or backups. Reduced-motion mode uses the settled shell/belly pose without the rolling/wiggle animation.
