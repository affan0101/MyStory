// Original, locally synthesized score: no fetched tracks or third-party audio.
export class StoryScore {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | undefined;
  private tick = 0;
  private chapter = 0;
  private volume = .36;
  private ducked = false;
  private muted = false;
  private running = false;
  private intent = 0;
  private wanted = false;
  private sources = new Set<AudioScheduledSourceNode>();
  async start() {
    const request = ++this.intent; this.wanted = true;
    if (!this.context) {
      const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return false;
      this.context = new Context();
      this.output = this.context.createGain(); this.output.gain.value = 0;
      const compressor = this.context.createDynamicsCompressor(); compressor.threshold.value = -16; compressor.ratio.value = 4;
      this.output.connect(compressor); compressor.connect(this.context.destination);
    }
    try { await this.context.resume(); } catch { return false; }
    if (request !== this.intent) { if (!this.wanted && this.context.state === "running") void this.context.suspend().catch(() => {}); return false; }
    if (this.context.state !== "running") return false;
    if (!this.running) { this.running = true; this.tick = 0; this.schedule(); this.timer = setInterval(() => this.schedule(), 1800); }
    this.level(); return true;
  }
  private level() {
    if (!this.context || !this.output) return;
    const gain = this.running && !this.muted ? this.volume * (this.ducked ? .12 : .32) : 0;
    this.output.gain.setTargetAtTime(gain, this.context.currentTime, .25);
  }
  private note(hz: number, at: number, duration: number, strength: number, type: OscillatorType = "sine") {
    const ctx = this.context; if (!ctx || !this.output) return;
    const source = ctx.createOscillator(); const env = ctx.createGain(); source.type = type; source.frequency.value = hz;
    env.gain.setValueAtTime(0, at); env.gain.linearRampToValueAtTime(strength, at + .08); env.gain.exponentialRampToValueAtTime(.0001, at + duration);
    source.connect(env); env.connect(this.output); this.sources.add(source);
    source.onended = () => { source.disconnect(); env.disconnect(); this.sources.delete(source); };
    source.start(at); source.stop(at + duration + .05);
  }
  private schedule() {
    const ctx = this.context; if (!ctx || !this.running) return;
    const roots = [146.83, 130.81, 174.61, 130.81];
    const root = roots[Math.floor(this.tick / 4) % roots.length];
    const motif = [2, 2.5, 3, 2.5, 2.25, 2, 1.5, 2];
    const now = ctx.currentTime + .04;
    if (this.tick % 2 === 0) { this.note(root, now, 4.2, .32); this.note(root * 1.5, now, 4.2, .13); }
    this.note(root * motif[this.tick % motif.length], now + .15, 2.5, .23, "sine");
    if ([3, 5, 6, 8, 9].includes(this.chapter)) this.note(root * 2, now + .9, 1.1, .06, "triangle");
    if ([0, 1, 7].includes(this.chapter) && this.tick % 6 === 0) { this.note(1240, now + .65, .27, .035); this.note(1480, now + .9, .25, .02); }
    this.tick++;
  }
  cue(chapter: number) {
    if (chapter === this.chapter) return;
    this.chapter = chapter;
    if (!this.running || !this.context) return;
    const now = this.context.currentTime;
    if (chapter === 1) { this.note(659.25, now, 1.8, .12); this.note(1318.5, now + .01, 1.1, .045); }
    else if (chapter === 3) this.note(180, now, .09, .22, "triangle");
    else this.note(chapter === 7 ? 523.25 : 293.66, now, 1.8, .07);
  }
  setVolume(value: number) { this.volume = value; this.level(); }
  setMuted(value: boolean) { this.muted = value; this.level(); }
  duck(value: boolean) { this.ducked = value; this.level(); }
  finish() {
    this.running = false; clearInterval(this.timer); this.level();
    const request = this.intent;
    setTimeout(() => { if (request === this.intent) this.pause(); }, 900);
  }
  pause() {
    this.intent++; this.wanted = false;
    this.running = false; clearInterval(this.timer); this.level();
    // Suspended contexts do not keep synthesizing when the tab is hidden.
    if (this.context?.state === "running") void this.context.suspend().catch(() => {});
    for (const source of this.sources) { try { source.stop(); } catch {} }
    this.sources.clear();
  }
  destroy() { this.pause(); if (this.context) void this.context.close().catch(() => {}); this.context = null; }
}
