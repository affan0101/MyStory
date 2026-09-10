# Verification and practical limits

## Automated verification

- TypeScript strict check and ESLint: passing.
- Seven narration coordinator tests: no autoplay; Playing only after actual start; active and paused language changes; cancelled callback isolation; rapid chapter jumps; missing-voice handling; terminal completion; bounded text chunks.
- Story integrity: 35 exact accepted paragraphs in each language, stable ordered IDs, 35 Hindi speech inputs, and eleven non-overlapping chapter ranges.
- Key names and factual anchors retained; illustrated artwork stays under the 650 KB budget (actual approximately 540 KB).
- Production build: a first pass exposed unresolved Fontsource-relative font URLs. Replaced those with explicit self-hosted WOFF2 URLs; the repaired build emits all five WOFF2 files. Final source review also restored the Tailwind color mappings used by settings switches and connected pointer motion without intercepting page interaction. The final production rebuild and emitted-asset assertions passed.

## Performance safeguards in the implementation

- One dynamically imported Three.js canvas; server-rendered story and compressed poster visible first.
- Pixel ratio capped at 1.5, default 1 on small/low-memory devices. After 150 frames averaging more than 32 ms, rendering lowers pixel ratio to 1.
- Shared geometry/materials, instanced repeated foliage and keys, one shadow light at 1024 px, no post-processing, and lightweight mode disables shadows and extra ball motion.
- Hidden tabs stop continuous 3D rendering and suspend sound. Reduced motion uses demand rendering and removes CSS animation/transitions.
- Scroll progress updates one DOM transform per animation frame. React story state changes at chapter boundaries rather than every scroll tick.
- Preference errors, unavailable audio and WebGL context failure preserve the complete HTML story.

## Not yet verified on hardware

Browser visual/end-to-end testing has not been requested in this environment; the managed preview workflow permits it only on explicit request. No live-device visual, FPS, memory or listening claims have been made. The reference-research browser also lacked WebGL support, so it could not establish 3D performance.

Before a final public launch, verify on a hardware-accelerated desktop and an actual phone:

1. Hero and each scene at 360 px, 390 px, 768 px and desktop widths; all controls remain readable and reachable.
2. Real WebGL shadows, camera framing, scene fades, fallback illustrations and context loss.
3. Installed Hindi and English voices, paragraph captions, language switching, rapid navigation and silent entry.
4. Scroll and audio interruption behavior, keyboard navigation, sheet focus trapping and reduced motion.
5. Measured frame time and memory over all eleven chapters, mobile heat/battery, and slower network startup.

These checks are release follow-up work, not claimed as completed by the build or mocked speech tests.

## Build size observation

The dynamically imported Three.js scene chunk is approximately 230 KB gzip (875 KB minified before compression), below the 300 KB compressed budget checked locally. Vite still emits its generic 500 KB uncompressed chunk warning. It is loaded separately from the narrative entry and is not misreported as a build failure or a measured frame-rate result. Five WOFF2 fonts total approximately 88 KB.
