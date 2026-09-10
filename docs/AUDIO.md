# Audio behavior and production checkpoint

## Implemented

- A single narration coordinator owns the active utterance. Cancellation tokens reject stale callbacks after rapid jumps, pause or language changes.
- No speech or music starts on page load. User entry enables playback; silent entry remains available.
- All 35 English paragraphs have equivalent Hindi speech-normalized inputs. Visible Hinglish remains Roman-script copy.
- Hindi requires an available Hindi voice. English prefers en-IN and otherwise another English voice. The app never substitutes an unrelated language.
- The player reports Playing only on the browser's actual speech-start event. Missing voice, unsupported speech and failed startup remain readable states.
- Utterances are bounded at 180 characters to avoid long-text stalls. Pausing cancels speech and retains the current chunk. Resume restarts that chunk; switching languages restarts the equivalent paragraph.
- Captions show the current approved paragraph, updated from real speech-start events. They are paragraph captions, not fabricated word-level cue timings.
- Manual scroll pauses guided narration. Paragraph progression scrolls only when the next spoken paragraph is outside the comfortable reading area.
- Tab hiding pauses narration and suspends the original score; returning does not automatically resume.
- Independent voice/music levels, mute, caption preference and remembered language. Device speech volume changes apply to subsequent utterances.
- The original score ducks under narration and stops when the last paragraph finishes.

## Recorded narration still pending

This release is explicitly a device-narration edition. It does not contain studio recordings and does not promise the same voice across devices. No speech/music-generation service is connected in the current environment.

The next audio-production phase should create 11 natural Indian-voice chapter recordings per language from the approved copy. Keep both languages mapped to p01–p35. Review Affan, Shubhangi, Deeksha, Ayan, Banshita, Aarya, Anshika, Pachmarhi and institution names by listening. Preserve 8.20 as eight point two zero and the IIT Bombay **zonal round** distinction.

Store licensed final files in `public/audio/<language>/<chapter>.opus` (with broadly supported alternatives if needed), and measured paragraph cue points in a narration manifest. Replace the device source inside the playback coordinator; retain stable paragraph identities, gesture entry, pause/mute semantics and readable errors. Do not ship invented cue times or expose a voice-service API secret in browser code.

Before declaring audio production complete, listen to every chapter on headphones and phone speakers; test English/Hinglish changes mid-playback, interrupted loading, tab switching and the final fade.
