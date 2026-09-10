# Affan — A Life in Chapters

A cinematic, bilingual journey from a white house in Bihar to Java software engineering. Eleven chapters preserve Affan Ahmad's approved story, with 35 aligned paragraphs in Hinglish and English.

## Current release status

The production build, type checks, lint and seven playback tests pass. Source and release version 1 are saved. Private publishing is blocked by a platform HTTPS certificate timeout (two attempts); no live URL is verified. The GitHub connector also returned a 403 write-access error. See `docs/PROGRESS.md` and `docs/deployment.json` for exact recovery details.

## Experience

- One real Three.js canvas, eleven handmade miniature scenes, soft lighting and pointer-responsive motion.
- Original home photograph and three optimized illustrated fallbacks.
- Language switching preserves the current chapter and narration paragraph.
- Optional device narration, Hindi speech normalization, captions, original Web Audio score, mute and independent volume controls.
- Silent reading, reduced motion, lightweight 3D, WebGL error fallback and tab-visibility pause.
- Friends, cricket, school, Kolkata design studies, SIRT Bhopal, hackathons, Pachmarhi, freelancing and CloudNexus all remain part of the story.

## Run

Node 22.13 or later and pnpm 11.19.0:

```sh
corepack enable
pnpm install
pnpm dev
```

```sh
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

The app uses React, TypeScript, Vinext/Vite and Three.js through React Three Fiber. The Sites-compatible starter handles the server build. No API keys or paid services are required for the current experience.

## Continuation

Read `AGENTS.md`, `docs/PROGRESS.md` and `docs/REQUIREMENTS.md` before changing the project. The complete accepted story is in `docs/STORY_AND_BRIEF.md`. Resume the saved phase rather than generating the project again. Preserve `.openai/hosting.json` and its existing Site identity.

## Audio and performance limits

Narration currently uses the visitor's installed browser/device voices. A matching Hindi or English voice is required; unsupported voices produce a readable message. It is not a recording of Affan and does not claim studio narration quality. Natural recorded narration and listening review remain a production upgrade.

Artwork is approximately 540 KB in total. Rendering caps pixel ratio at 1.5, uses a single canvas and shared geometry, lowers resolution on sustained slow frames, and pauses in hidden tabs. Real-device visual, listening and frame-rate verification is still required; automated checks do not establish a universal FPS guarantee.

See `docs/ASSETS.md`, `docs/AUDIO.md` and `docs/QA.md` for provenance and validation details. The input resume and its private contact details are not published.
