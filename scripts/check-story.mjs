import fs from 'node:fs';
import assert from 'node:assert/strict';
const paragraphs = JSON.parse(fs.readFileSync('data/paragraphs.json', 'utf8'));
const hindi = JSON.parse(fs.readFileSync('data/speech-hi.json', 'utf8'));
const approved = fs.readFileSync('docs/STORY_AND_BRIEF.md', 'utf8');
const chapters = fs.readFileSync('data/chapters.ts', 'utf8');
assert.equal(paragraphs.length, 35);
assert.equal(hindi.length, 35);
assert.equal(new Set(paragraphs.map(p => p.id)).size, 35);
for (const [i, p] of paragraphs.entries()) {
  assert.equal(p.id, `p${String(i + 1).padStart(2, '0')}`);
  assert.ok(approved.includes(p.hi), `${p.id}: changed Hinglish copy`);
  assert.ok(approved.includes(p.en), `${p.id}: changed English copy`);
  assert.ok(/[\u0900-\u097f]/.test(hindi[i]), `${p.id}: missing Hindi speech normalization`);
}
const ranges = [...chapters.matchAll(/range:\[(\d+),(\d+)\]/g)].map(m => [+m[1], +m[2]]);
assert.equal(ranges.length, 11);
let position = 0;
for (const [start, end] of ranges) { assert.equal(start, position, 'Missing or duplicated paragraph at chapter boundary'); assert.ok(end > start); position = end; }
assert.equal(position, 35);
for (const phrase of ['Shubhangi','Deeksha','Ayan','Banshita','Aarya','Anshika','Pachmarhi','8.20','zonal round','CloudNexus']) assert.ok(JSON.stringify(paragraphs).includes(phrase), `Missing fact: ${phrase}`);
const images = ['home.webp','bamboo-school.webp','hills.webp'];
const bytes = images.reduce((total, image) => total + fs.statSync(`public/images/${image}`).size, 0);
assert.ok(bytes < 650 * 1024, 'Illustrations exceed 650 KB budget');
assert.ok(!fs.readdirSync('public').some(file => /\.pdf$/i.test(file)), 'Do not publish the personal resume');
console.log(`PASS: 11 chapters, 35 exact bilingual paragraph pairs, 35 Hindi speech inputs, ${Math.round(bytes / 1024)} KB artwork.`);
