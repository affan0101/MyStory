import test from "node:test";
import assert from "node:assert/strict";
import { Narrator, chooseVoice, splitSpeech, normalizeEnglish, type Playback } from "../lib/story/narrator.ts";

const voice = (lang: string) => ({ lang, name: lang, default: false } as SpeechSynthesisVoice);
function setup(voices = [voice("hi-IN"), voice("en-IN")]) {
  const utterances: SpeechSynthesisUtterance[] = [];
  const events: Playback[] = [];
  let cancelled = 0;
  const host = { getVoices: () => voices, speak: (utterance: SpeechSynthesisUtterance) => utterances.push(utterance), cancel: () => { cancelled++; } };
  const narrator = new Narrator(host, text => ({ text } as SpeechSynthesisUtterance), { hi: ["पहला पैराग्राफ।", "दूसरा पैराग्राफ।"], en: ["First paragraph.", "Second paragraph."] }, event => events.push(event));
  const fire = (utterance: SpeechSynthesisUtterance, event: "onstart" | "onend" | "onerror") => utterance[event]?.call(utterance, {} as SpeechSynthesisErrorEvent);
  return { narrator, utterances, events, fire, get cancelled() { return cancelled; } };
}
test("no autoplay; Playing is only reported after onstart", () => {
  const x = setup(); assert.equal(x.utterances.length, 0);
  x.narrator.start(0, "hi"); assert.equal(x.events.at(-1)?.status, "loading");
  x.fire(x.utterances[0], "onstart"); assert.equal(x.events.at(-1)?.status, "playing");
  x.narrator.destroy();
});
test("language change cancels old callbacks and retains equivalent paragraph", () => {
  const x = setup(); x.narrator.start(1, "hi"); const old = x.utterances[0]; x.fire(old, "onstart");
  x.narrator.setLanguage("en"); assert.equal(x.events.at(-1)?.index, 1); assert.equal(x.utterances.at(-1)?.text, "Second paragraph.");
  const count = x.utterances.length; x.fire(old, "onend"); x.fire(old, "onerror");
  assert.equal(x.utterances.length, count); assert.equal(x.events.at(-1)?.status, "loading"); x.narrator.destroy();
});
test("paused language switch remains paused and never queues speech", () => {
  const x = setup(); x.narrator.start(1, "hi"); x.fire(x.utterances[0], "onstart"); x.narrator.pause();
  x.narrator.setLanguage("en"); assert.equal(x.events.at(-1)?.status, "paused"); assert.equal(x.utterances.length, 1);
  x.narrator.resume(); assert.equal(x.utterances.at(-1)?.text, "Second paragraph."); x.narrator.destroy();
});
test("rapid chapter jumps never advance from cancelled speech", () => {
  const x = setup(); x.narrator.start(0, "en"); const old = x.utterances[0]; x.narrator.select(1, "en");
  x.fire(old, "onend"); assert.equal(x.events.at(-1)?.index, 1); assert.equal(x.events.at(-1)?.status, "paused"); assert.equal(x.utterances.length, 1); x.narrator.destroy();
});
test("no wrong-language substitution when a voice is missing", () => {
  const x = setup([voice("en-US")]); x.narrator.start(0, "hi");
  assert.equal(x.utterances.length, 0); assert.equal(x.events.at(-1)?.error, "missing");
  assert.equal(chooseVoice([voice("en-US"), voice("en-IN")], "en")?.lang, "en-IN"); x.narrator.destroy();
});
test("completion has a terminal ended state and does not loop", () => {
  const x = setup(); x.narrator.start(1, "en"); x.fire(x.utterances[0], "onstart"); x.fire(x.utterances[0], "onend");
  assert.equal(x.events.at(-1)?.status, "ended"); assert.equal(x.utterances.length, 1); x.narrator.destroy();
});
test("chunking preserves content and bounds long utterances", () => {
  const input = "This is a sentence about a software project. ".repeat(20);
  const chunks = splitSpeech(input);
  assert.ok(chunks.every(chunk => chunk.length <= 180));
  assert.equal(chunks.join(" "), input.trim());
  assert.match(normalizeEnglish("B.Tech 8.20 CGPA"), /eight point two zero/);
});
