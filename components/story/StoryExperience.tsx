"use client";
/* eslint-disable @next/next/no-img-element -- Pre-compressed WebP assets are served directly; no runtime image service is required. */

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowDownRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Headphones, MapPin, Menu, Pause, Play, SlidersHorizontal, Volume2, VolumeX, X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { chapters, labels, skills, type Language } from "@/data/chapters";
import paragraphs from "@/data/paragraphs.json";
import speechHi from "@/data/speech-hi.json";
import { Narrator, normalizeEnglish, type Playback } from "@/lib/story/narrator";
import { StoryScore } from "@/lib/story/score";

const World = lazy(() => import("./World"));
const offsets = chapters.map(ch => paragraphs.findIndex(p => p.id === ch.paragraphs[0].id));
const paragraphChapter = (index: number) => Math.max(0, offsets.findLastIndex(offset => offset <= index));
const two = (value: number) => String(value).padStart(2, "0");
const strip = (value: string) => value.replace(/\*\*/g, "");
function RichText({ text }: { text: string }) { return <>{text.split(/(\*\*.*?\*\*)/g).map((part, i) => part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}</>; }

export default function StoryExperience() {
  const [lang, setLang] = useState<Language>("hi");
  const [active, setActive] = useState(0);
  const [rendered, setRendered] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [worldReady, setWorldReady] = useState(false);
  const [worldFailed, setWorldFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [light, setLight] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [musicVolume, setMusicVolume] = useState(.36);
  const [voiceVolume, setVoiceVolume] = useState(.9);
  const [muted, setMuted] = useState(false);
  const [soundStarted, setSoundStarted] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [voiceUnsupported, setVoiceUnsupported] = useState(false);
  const [musicFailed, setMusicFailed] = useState(false);
  const [voiceName, setVoiceName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);
  const [playback, setPlayback] = useState<Playback>({ status: "idle", index: 0, caption: "" });
  const narrator = useRef<Narrator | null>(null);
  const score = useRef<StoryScore | null>(null);
  const lastSpoken = useRef(-1);
  const narrationWasMuted = useRef(false);
  const audioEpoch = useRef(0);
  const progress = useRef<HTMLDivElement>(null);
  const displayed = reduced ? active : rendered;
  const transitioning = !reduced && active !== rendered;
  const current = chapters[active];
  const t = labels[lang];
  const speaking = playback.status === "playing" || playback.status === "loading";
  const showCaptions = captions && playback.status === "playing" && !muted;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    // Restore browser preferences after the server-rendered first paint.
    const restoreFrame = requestAnimationFrame(() => {
    let saved: Record<string, unknown> = {};
    try { saved = JSON.parse(localStorage.getItem("affan-story-preferences") || "{}"); } catch { /* Reading works in private mode too. */ }
    if (!saved || typeof saved !== "object") saved = {};
    if (saved.lang === "en" || saved.lang === "hi") setLang(saved.lang);
    setReduced(typeof saved.reduced === "boolean" ? saved.reduced : media.matches);
    setLight(typeof saved.light === "boolean" ? saved.light : window.innerWidth < 760 || (device.deviceMemory || 8) <= 4 || navigator.hardwareConcurrency <= 4 || !!device.connection?.saveData);
    if (typeof saved.captions === "boolean") setCaptions(saved.captions);
    if (typeof saved.musicVolume === "number") setMusicVolume(Math.max(0, Math.min(1, saved.musicVolume)));
    if (typeof saved.voiceVolume === "number") setVoiceVolume(Math.max(0, Math.min(1, saved.voiceVolume)));
    setVoiceUnsupported(!("speechSynthesis" in window && "SpeechSynthesisUtterance" in window));
    setPrefsReady(true);
    });
    const motionChanged = (event: MediaQueryListEvent) => setReduced(event.matches);
    media.addEventListener("change", motionChanged);
    const timer = window.setTimeout(() => setMounted(true), 350);
    return () => { cancelAnimationFrame(restoreFrame); clearTimeout(timer); media.removeEventListener("change", motionChanged); };
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    document.documentElement.lang = lang === "hi" ? "hi-Latn" : "en";
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    try { localStorage.setItem("affan-story-preferences", JSON.stringify({ lang, reduced, light, captions, musicVolume, voiceVolume })); } catch { /* Preference storage is optional. */ }
  }, [lang, reduced, light, captions, musicVolume, voiceVolume, prefsReady]);

  useEffect(() => {
    const epochOwner = audioEpoch;
    score.current = new StoryScore();
    if ("speechSynthesis" in window && "SpeechSynthesisUtterance" in window) {
      const controller = new Narrator(window.speechSynthesis, text => new SpeechSynthesisUtterance(text), { hi: speechHi, en: paragraphs.map(p => normalizeEnglish(p.en)) }, state => {
        setPlayback(state);
        score.current?.duck(state.status === "playing" || state.status === "loading");
        if (state.status === "ended") { score.current?.finish(); setMusicPlaying(false); }
        if (state.status === "playing" && lastSpoken.current !== state.index) {
          lastSpoken.current = state.index;
          const element = document.getElementById(paragraphs[state.index].id);
          if (element) {
            const bounds = element.getBoundingClientRect();
            if (bounds.top < 130 || bounds.bottom > innerHeight - 230) element.scrollIntoView({ block: "center", behavior: document.documentElement.dataset.motion === "reduced" ? "instant" : "smooth" });
          }
        }
      });
      narrator.current = controller;
    }
    const hidden = () => { if (document.hidden) { audioEpoch.current++; narrator.current?.pause(); score.current?.pause(); setMusicPlaying(false); } };
    const manual = () => { narrator.current?.pause(); };
    const keyScroll = (event: KeyboardEvent) => { if (["PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp", " "].includes(event.key) && !(event.target as HTMLElement).closest("button, input, [role='dialog'], a")) manual(); };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("wheel", manual, { passive: true });
    window.addEventListener("touchmove", manual, { passive: true });
    window.addEventListener("keydown", keyScroll);
    return () => { epochOwner.current++; narrator.current?.destroy(); score.current?.destroy(); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("wheel", manual); window.removeEventListener("touchmove", manual); window.removeEventListener("keydown", keyScroll); };
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () => {
      const available = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith(lang));
      setVoiceName((available.find(v => v.lang.toLowerCase() === `${lang}-in`) || available[0])?.name || "");
    };
    update(); window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, [lang]);

  useEffect(() => { narrator.current?.setVolume(voiceVolume); }, [voiceVolume]);
  useEffect(() => { score.current?.setVolume(musicVolume); }, [musicVolume]);
  useEffect(() => { score.current?.cue(active); }, [active]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.chapter));
    }, { rootMargin: "-25% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("[data-chapter]").forEach(element => observer.observe(element));
    let frame = 0;
    const scroll = () => { if (frame) return; frame = requestAnimationFrame(() => { const length = document.documentElement.scrollHeight - innerHeight; if (progress.current) progress.current.style.transform = `scaleX(${length ? scrollY / length : 0})`; frame = 0; }); };
    window.addEventListener("scroll", scroll, { passive: true }); scroll();
    return () => { observer.disconnect(); window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (reduced || active === rendered) return;
    const swap = setTimeout(() => setRendered(active), 200);
    return () => clearTimeout(swap);
  }, [active, reduced, rendered]);

  const ready = useCallback(() => setWorldReady(true), []);
  const failed = useCallback(() => { setWorldFailed(true); setWorldReady(false); }, []);
  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(chapters.length - 1, index));
    narrator.current?.select(offsets[target], lang); lastSpoken.current = -1;
    setActive(target); setMenuOpen(false);
    document.getElementById(chapters[target].id)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
  };
  const enableMusic = async () => {
    const epoch = ++audioEpoch.current;
    setSoundStarted(true); setMuted(false); score.current?.setMuted(false);
    const ok = await score.current?.start();
    if (epoch !== audioEpoch.current) return;
    if (document.hidden) { score.current?.pause(); return; }
    setMusicPlaying(!!ok); setMusicFailed(!ok);
  };
  const play = (index?: number) => {
    void enableMusic();
    if (!narrator.current) { setVoiceUnsupported(true); return; }
    if (index !== undefined) { lastSpoken.current = -1; narrator.current.start(index, lang); }
    else if (paragraphChapter(playback.index) === active && playback.status !== "idle") narrator.current.resume();
    else narrator.current.start(offsets[active], lang);
  };
  const pause = () => { audioEpoch.current++; narrator.current?.pause(); score.current?.pause(); setMusicPlaying(false); };
  const changeLanguage = (language: Language) => {
    if (language === lang) return;
    // Preserve the paragraph's viewport position when translated lengths change.
    const element = document.getElementById(speaking ? paragraphs[playback.index].id : current.id);
    const before = element?.getBoundingClientRect().top;
    setLang(language); narrator.current?.setLanguage(language);
    requestAnimationFrame(() => { if (element && before !== undefined && !speaking) window.scrollBy({ top: element.getBoundingClientRect().top - before, behavior: "instant" }); });
  };
  const toggleMute = () => {
    if (!soundStarted) { void enableMusic(); return; }
    const next = !muted; setMuted(next); score.current?.setMuted(next);
    if (next) { narrationWasMuted.current = speaking; narrator.current?.pause(); }
    else { void enableMusic(); if (narrationWasMuted.current) narrator.current?.resume(); narrationWasMuted.current = false; }
  };
  const errorText = voiceUnsupported ? t.voiceUnsupported : playback.status === "error" ? playback.error === "missing" ? t.voiceMissing : t.voiceError : "";
  const heroIntro = lang === "hi" ? "Bihar ke ek gaon se software ki duniya tak. Beech mein thodi dosti, thoda cricket, aur bahut saari zindagi." : "From a village in Bihar to the world of software. With friendships, a little cricket, and a whole lot of life along the way.";

  return <main className={`story-experience ${reduced ? "reduce-motion" : ""}`} style={{ "--chapter-accent": current.accent } as CSSProperties}>
    <a className="skip-link" href="#story-content">{lang === "hi" ? "Seedha kahani par jaayein" : "Skip to the story"}</a>
    <div className="reading-progress" aria-hidden="true"><div ref={progress}/></div>
    <header className="site-header">
      <a className="wordmark" href="#home" onClick={e => { e.preventDefault(); goTo(0); }} aria-label="Affan Ahmad · Home">affan<span>.</span></a>
      <div className="header-caption">{lang === "hi" ? "EK ZINDAGI, KAI CHAPTERS" : "ONE LIFE, MANY CHAPTERS"}</div>
      <nav className="header-controls" aria-label={lang === "hi" ? "Website controls" : "Website controls"}>
        <div className="language-picker" aria-label="Language"><button aria-pressed={lang === "hi"} onClick={() => changeLanguage("hi")}>Hinglish</button><button aria-pressed={lang === "en"} onClick={() => changeLanguage("en")}>English</button></div>
        <button className="icon-button header-sound" aria-label={muted || !soundStarted ? t.unmute : t.mute} title={muted || !soundStarted ? t.unmute : t.mute} onClick={toggleMute}>{muted || !soundStarted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild><button className="chapter-menu"><span>{t.chapters}</span><Menu size={18}/></button></SheetTrigger>
          <SheetContent className="story-sheet chapters-sheet" showCloseButton={false}>
            <SheetClose className="sheet-close icon-button" aria-label={t.close}><X size={20}/></SheetClose>
            <SheetHeader><p className="eyebrow">AFFAN AHMAD · 01—11</p><SheetTitle>{t.story}</SheetTitle><SheetDescription>{t.choose}</SheetDescription></SheetHeader>
            <nav className="chapter-list" aria-label={t.chapters}>{chapters.map((chapter, index) => <button key={chapter.id} className={active === index ? "selected" : ""} onClick={() => goTo(index)} aria-current={active === index ? "location" : undefined}><span>{two(index + 1)}</span><div><strong>{chapter.eyebrow[lang]}</strong><small>{chapter.location}</small></div><ArrowUpRight size={16}/></button>)}</nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>

    <div className={`scene-stage ${transitioning && !reduced ? "scene-changing" : ""} ${worldReady ? "world-ready" : ""}`} aria-hidden="true">
      <div className="scene-halo"/>
      <img className="scene-poster" src={chapters[displayed].image} alt="" fetchPriority="high" width={1672} height={941}/>
      <div className="world-canvas">{mounted && !worldFailed && <Suspense fallback={null}><World kind={chapters[displayed].scene} reduced={reduced} light={light} onReady={ready} onFailure={failed}/></Suspense>}</div>
      <div className="scene-orbit"/>
      <span className="scene-axis">{two(displayed + 1)} / 11</span>
    </div>
    <aside className="scene-location"><MapPin size={13}/><span key={current.id}>{current.location}</span><span className="scene-location-line"/>{worldFailed && <small>{t.unavailable3d}</small>}</aside>
    <nav className="chapter-rail" aria-label={t.chapters}>{chapters.map((chapter, index) => <button key={chapter.id} className={active === index ? "active" : ""} onClick={() => goTo(index)} aria-label={`${two(index + 1)} · ${chapter.eyebrow[lang]}`} aria-current={active === index ? "location" : undefined}><span className="rail-tooltip">{chapter.eyebrow[lang]}</span><i/></button>)}</nav>

    <div className="story-content" id="story-content">
      {chapters.map((chapter, chapterIndex) => {
        const lines = chapter.title[lang].split("\n");
        const Heading = chapterIndex === 0 ? "h1" : "h2";
        return <section className={`story-chapter chapter-${chapter.id} ${chapterIndex === active ? "chapter-active" : ""}`} data-chapter={chapterIndex} id={chapter.id} key={chapter.id} aria-labelledby={`${chapter.id}-title`} style={{ "--local-accent": chapter.accent } as CSSProperties}>
          <div className="chapter-copy">
            <div className="chapter-kicker"><span className="chapter-no">{two(chapterIndex + 1)}</span><span className="eyebrow">{chapter.eyebrow[lang]}</span><span className="kicker-line"/></div>
            <Heading id={`${chapter.id}-title`}>{lines[0]}<br/><em>{lines[1]}</em></Heading>
            <div className="chapter-meta"><span>{chapter.period}</span><span>·</span><span>{chapter.location}</span></div>
            {chapterIndex === 0 && <div className="hero-intro"><p>{heroIntro}</p><div className="hero-actions"><button className="primary-button" onClick={() => speaking ? pause() : play(0)}>{speaking ? <Pause size={16}/> : <Headphones size={16}/>}<span>{speaking ? t.pause : t.begin}</span><ArrowUpRight size={17}/></button><button className="text-button" onClick={() => { pause(); document.getElementById("p01")?.scrollIntoView({ block: "center", behavior: reduced ? "instant" : "smooth" }); }}>{t.silent}<ArrowDownRight size={16}/></button></div><div className="scroll-invitation"><span className="scroll-symbol"><ArrowDown size={13}/></span>{t.scroll}</div></div>}
            <div className={`chapter-paragraphs ${chapterIndex === 0 ? "opening-paragraphs" : ""}`}>
              {chapter.paragraphs.map(paragraph => {
                const index = paragraphs.findIndex(p => p.id === paragraph.id);
                const highlighted = speaking && playback.index === index;
                return <div key={paragraph.id} id={paragraph.id} className={`story-paragraph ${highlighted ? "being-read" : ""}`}><p><RichText text={paragraph[lang]}/></p><button className="paragraph-listen" onClick={() => play(index)} aria-label={`${t.replayParagraph}: ${strip(paragraph[lang]).slice(0, 65)}`} title={t.replayParagraph}><Play size={12}/></button></div>;
              })}
            </div>
            {chapter.id === "home" && <button className="memory-link" onClick={() => setPhotoOpen(true)}><span className="memory-thumbnail"><img src="/images/home-original.jpg" alt="" loading="lazy" width={72} height={54}/></span><span><small>{t.memory}</small>{t.original}</span><ArrowUpRight size={18}/></button>}
            {chapter.id === "fab-four" && <div className="friend-signatures" aria-label="Fab Four"><span>Affan</span><i>+</i><span>Deeksha</span><i>+</i><span>Ayan</span><i>+</i><span>Banshita</span></div>}
            {chapter.id === "hackathons" && <div className="milestones"><div><span>2024</span><p>{lang === "hi" ? "National hackathon finalist" : "National hackathon finalist"}<small>ABV-IIITM Gwalior · October</small></p><ArrowUpRight size={18}/></div><div><span>2025</span><p>{lang === "hi" ? "Meshmerize zonal round winner" : "Meshmerize zonal round winner"}<small>IIT Bombay Techfest · October</small></p><Check size={18}/></div></div>}
            {chapter.id === "today" && <div className="finale"><p className="eyebrow">{t.skillTitle}</p><div className="skills">{skills.map(skill => <span key={skill}>{skill}</span>)}</div><div className="profile-line"><span>8.20<small>CGPA · B.Tech CSE</small></span><span>200+<small>DSA problems</small></span><span>SDE 1<small>CloudNexus</small></span></div><p className="personal-note">{t.portraitNote}</p><a className="github-link" href="https://github.com/affan0101" target="_blank" rel="noopener noreferrer">GitHub <ArrowUpRight size={17}/></a><p className="ending-line">{t.end}</p><button className="text-button" onClick={() => goTo(0)}>{t.restart}<ArrowUpRight size={17}/></button></div>}
            {chapterIndex < 10 && <button className="chapter-forward" onClick={() => goTo(chapterIndex + 1)}><span>{two(chapterIndex + 2)} / {chapters[chapterIndex + 1].eyebrow[lang]}</span><ArrowDown size={16}/></button>}
          </div>
        </section>;
      })}
    </div>

    <Sheet open={photoOpen} onOpenChange={setPhotoOpen}><SheetContent className="story-sheet photo-sheet" showCloseButton={false}><SheetClose className="sheet-close icon-button" aria-label={t.close}><X size={20}/></SheetClose><SheetHeader><p className="eyebrow">BIHAR, INDIA</p><SheetTitle>{t.memory}</SheetTitle><SheetDescription>{t.memoryNote}</SheetDescription></SheetHeader><figure><img src="/images/home-original.jpg" alt={lang === "hi" ? "Bihar mein Affan ka asli ghar: safed deewarein, neeche laal rang aur saamne ped." : "Affan's real home in Bihar, with white walls, a red base and trees in front."} width={1280} height={859}/><figcaption>{t.homeCaption}</figcaption></figure></SheetContent></Sheet>

    <div className={`caption-panel ${showCaptions ? "caption-visible" : ""}`} aria-hidden={!showCaptions}><span>{two(playback.index + 1)} / 35 · {t.voice}</span><p tabIndex={showCaptions ? 0 : -1}><RichText text={paragraphs[playback.index][lang]}/></p></div>
    {errorText && <div className="playback-notice" role="status"><p>{errorText}</p><button onClick={() => play()}>{t.play}<Play size={12}/></button></div>}
    <footer className="story-player">
      <div className="player-chapter"><span className="player-number">{two(active + 1)}<small>/ 11</small></span><div><small>{t.chapter}</small><span>{current.eyebrow[lang]}</span></div></div>
      <div className="playback-controls"><button className="icon-button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={t.previous}><ChevronLeft size={18}/></button><button className={`play-button ${speaking ? "is-playing" : ""}`} onClick={() => speaking || musicPlaying && voiceUnsupported ? pause() : play()} aria-label={speaking ? t.pause : t.play} title={speaking ? t.pause : t.play}>{speaking ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}</button><button className="icon-button" onClick={() => goTo(active + 1)} disabled={active === 10} aria-label={t.next}><ChevronRight size={18}/></button></div>
      <div className="player-extras"><span className={`sound-wave ${musicPlaying && !muted ? "wave-playing" : ""}`} aria-hidden="true">{[0, 1, 2, 3, 4].map(n => <i key={n} style={{ animationDelay: `${n * .13}s` }}/>)}</span><button className="icon-button player-mute" aria-label={muted || !soundStarted ? t.unmute : t.mute} onClick={toggleMute}>{muted || !soundStarted ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button>
        <Sheet><SheetTrigger asChild><button className="icon-button" aria-label={t.settings} title={t.settings}><SlidersHorizontal size={17}/></button></SheetTrigger><SheetContent className="story-sheet settings-sheet" showCloseButton={false}><SheetClose className="sheet-close icon-button" aria-label={t.close}><X size={20}/></SheetClose><SheetHeader><p className="eyebrow">{lang === "hi" ? "APNE HISAAB SE" : "MAKE IT YOURS"}</p><SheetTitle>{t.settings}</SheetTitle><SheetDescription>{t.deviceVoice}</SheetDescription></SheetHeader><div className="settings-body">
          <div className="voice-info"><Headphones size={20}/><div><small>{t.voiceLabel}</small><p>{voiceName || (lang === "hi" ? "Hindi voice available nahi hai" : "No English voice available")}</p></div></div>
          <label className="volume-setting"><span>{t.voice}<output>{Math.round(voiceVolume * 100)}%</output></span><input type="range" min={0} max={1} step={.05} value={voiceVolume} onChange={e => setVoiceVolume(Number(e.target.value))}/></label>
          <label className="volume-setting"><span>{t.music}<output>{Math.round(musicVolume * 100)}%</output></span><input type="range" min={0} max={1} step={.05} value={musicVolume} onChange={e => setMusicVolume(Number(e.target.value))}/></label>
          {musicFailed && <p className="setting-note" role="status">{lang === "hi" ? "Music start nahi hua. Sound button se phir try karein." : "Music could not start. Try the sound button again."}</p>}
          <div className="setting-switch"><label htmlFor="caption-setting">{t.captions}</label><Switch id="caption-setting" checked={captions} onCheckedChange={setCaptions}/></div>
          <div className="setting-switch"><label htmlFor="motion-setting">{t.motion}</label><Switch id="motion-setting" checked={reduced} onCheckedChange={setReduced}/></div>
          <div className="setting-switch"><label htmlFor="quality-setting">{t.quality}<small>{t.qualityHelp}</small></label><Switch id="quality-setting" checked={light} onCheckedChange={setLight}/></div>
          <p className="setting-note">{lang === "hi" ? "Awaaz aapke play karne par hi shuru hoti hai. Tab badalne par playback ruk jaata hai." : "Sound begins when you choose to play. Switching tabs pauses playback."}</p>
        </div></SheetContent></Sheet>
      </div>
    </footer>
  </main>;
}
