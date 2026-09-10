export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "ended" | "error";
export type VoiceLanguage = "hi" | "en";
export type Playback = { status: PlaybackStatus; index: number; error?: "missing" | "failed"; caption: string };
export type SpeechHost = Pick<SpeechSynthesis, "getVoices" | "speak" | "cancel">;

// Short utterances avoid long-text stalls in browser speech implementations.
export function splitSpeech(text: string): string[] {
  const sentences = text.replace(/\*\*/g, "").match(/[^।!?]+[।!?]?/g) || [text];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    let chunk = "";
    for (const word of sentence.trim().split(/\s+/)) {
      if (chunk.length + word.length > 180 && chunk) { chunks.push(chunk.trim()); chunk = ""; }
      chunk += `${word} `;
    }
    if (chunk.trim()) chunks.push(chunk.trim());
  }
  return chunks;
}
export function chooseVoice(voices: SpeechSynthesisVoice[], lang: VoiceLanguage) {
  const matching = voices.filter(v => v.lang.toLowerCase().replace("_", "-").split("-")[0] === lang);
  return matching.find(v => v.lang.toLowerCase().replace("_", "-") === `${lang}-in`) || matching.find(v => v.default) || matching[0];
}
export function normalizeEnglish(text: string) {
  return text.replace(/\*\*/g, "").replace(/ABV-IIITM/g, "A B V, I I I T M").replace(/\bSIRT\b/g, "S I R T")
    .replace(/B\.Tech/g, "Bachelor of Technology").replace(/8\.20/g, "eight point two zero")
    .replace(/\bCGPA\b/g, "C G P A").replace(/\bDSA\b/g, "data structures and algorithms")
    .replace(/\bJWT\b/g, "J W T").replace(/\bAPIs\b/g, "A P I's").replace(/MedexJob\.com/g, "Medex Job dot com");
}

/** One owner for speech; generation guards discard every cancelled callback. */
export class Narrator {
  private host: SpeechHost;
  private createUtterance: (text: string) => SpeechSynthesisUtterance;
  private texts: Record<VoiceLanguage, string[]>;
  private publish: (state: Playback) => void;
  private token = 0;
  private chunk = 0;
  private lang: VoiceLanguage = "hi";
  private volume = .9;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private state: Playback = { status: "idle", index: 0, caption: "" };
  constructor(host: SpeechHost, createUtterance: (text: string) => SpeechSynthesisUtterance, texts: Record<VoiceLanguage, string[]>, publish: (state: Playback) => void) {
    this.host = host; this.createUtterance = createUtterance; this.texts = texts; this.publish = publish;
  }
  private emit(status: PlaybackStatus, error?: Playback["error"]) { this.state = { ...this.state, status, error }; this.publish({ ...this.state }); }
  private cancel() { this.token++; clearTimeout(this.timer); this.host.cancel(); }
  private speakChunk() {
    const token = this.token;
    const voice = chooseVoice(this.host.getVoices(), this.lang);
    if (!voice) { this.emit("error", "missing"); return; }
    const chunks = splitSpeech(this.texts[this.lang][this.state.index]);
    const text = chunks[this.chunk];
    if (!text) { this.advance(); return; }
    const utterance = this.createUtterance(text);
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = this.lang === "hi" ? .91 : .94; utterance.pitch = 1; utterance.volume = this.volume;
    // Caption follows an actual spoken chunk; translated text remains in the page.
    this.state.caption = text;
    this.emit("loading");
    utterance.onstart = () => { if (token !== this.token) return; clearTimeout(this.timer); this.emit("playing"); };
    utterance.onend = () => { if (token !== this.token) return; clearTimeout(this.timer); this.chunk++; this.speakChunk(); };
    utterance.onerror = () => { if (token !== this.token) return; this.cancel(); this.emit("error", "failed"); };
    this.timer = setTimeout(() => { if (token !== this.token) return; this.cancel(); this.emit("error", "failed"); }, 10000);
    try { this.host.speak(utterance); } catch { this.cancel(); this.emit("error", "failed"); }
  }
  private advance() {
    if (this.state.index + 1 >= this.texts[this.lang].length) { this.chunk = 0; this.emit("ended"); return; }
    this.state.index++; this.chunk = 0; this.speakChunk();
  }
  start(index: number, lang: VoiceLanguage) { this.cancel(); this.state.index = Math.max(0, Math.min(index, this.texts[lang].length - 1)); this.lang = lang; this.chunk = 0; this.speakChunk(); }
  pause() { this.cancel(); if (["playing", "loading"].includes(this.state.status)) this.emit("paused"); }
  resume() { this.cancel(); if (this.state.status === "ended") { this.state.index = 0; this.chunk = 0; } this.speakChunk(); }
  select(index: number, lang: VoiceLanguage) { this.cancel(); this.state = { status: "paused", index, caption: "" }; this.chunk = 0; this.lang = lang; this.publish({ ...this.state }); }
  setLanguage(lang: VoiceLanguage) { const wasPlaying = ["playing", "loading"].includes(this.state.status); if (wasPlaying) this.start(this.state.index, lang); else this.select(this.state.index, lang); }
  setVolume(volume: number) { this.volume = Math.max(0, Math.min(1, volume)); }
  destroy() { this.cancel(); }
}
