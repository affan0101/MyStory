# Visual and audio provenance

## User-provided material

`public/images/home-original.jpg` is Affan's supplied photograph. It is used with his instruction to base the opening scene on his home. The supplied CV was read for factual education/work details; the original PDF and personal contact information are not part of the public site.

## Original website artwork

The three WebP illustrations were generated for this project using the image-generation tool, then compressed from their originals at quality 83:

| Asset | Purpose | Bytes |
| --- | --- | ---: |
| `home.webp` | Warm miniature white home, red lower walls, veranda and trees | 138534 |
| `bamboo-school.webp` | Modest bamboo village school and benches | 229202 |
| `hills.webp` | Forested hills inspired by the Pachmarhi memory | 184978 |

These are interpretations, not documentary images or exact historical reconstructions. The home photograph informed its illustration. Schools, hills and other places remain stylized. No friend's likeness has been invented.

All real 3D models are authored in `components/story/World.tsx` from shared primitive geometry. No external model packages or copyrighted scene assets are downloaded at runtime. Scenes reuse geometries/materials and instance repeated plants and keyboard keys.

## Fonts and interface

DM Sans and Cormorant Garamond are self-hosted from the installed Fontsource packages. Their SIL Open Font License files are included in `public/fonts/`. Lucide supplies interface icons. Existing shadcn and Radix components provide the accessible sheet and switch primitives; starter license files remain in the repository.

## Sound

`lib/story/score.ts` composes a quiet harmonic motif using Web Audio oscillators, chapter-specific cues and a controlled output gain. It contains no downloaded music, film score or named-person voice samples.

Narration uses a matching available browser voice after a user gesture. Voice synthesis behavior belongs to the visitor's browser/device, and some voices may require that device's network connection. No narration-service API key is included. See `docs/AUDIO.md` for the remaining recorded-voice production work.
