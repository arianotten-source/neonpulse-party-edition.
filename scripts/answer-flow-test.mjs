/**
 * Point timing + winner selection flow logic tests.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function computePendingPoints(left) {
  const t = Math.max(0, left);
  if (t <= 0) return 0;
  return t > 5 ? 15 : 10;
}

function awardFromPicks(pending, picks) {
  const scores = [0, 0, 0];
  const seen = new Set();
  for (const i of picks) {
    if (seen.has(i)) continue;
    seen.add(i);
    if (pending > 0) scores[i] += pending;
  }
  return scores;
}

const cases = [
  { left: 8, expect: 15 },
  { left: 5, expect: 10 },
  { left: 1, expect: 10 },
  { left: 0, expect: 0 },
];
for (const c of cases) {
  if (computePendingPoints(c.left) !== c.expect) {
    throw new Error(`points for ${c.left}s expected ${c.expect}`);
  }
}

let scores = awardFromPicks(15, [0]);
if (scores[0] !== 15) throw new Error("single winner failed");

scores = awardFromPicks(15, [0, 2]);
if (scores[0] !== 15 || scores[2] !== 15 || scores[1] !== 0) {
  throw new Error("multi winner failed");
}

scores = awardFromPicks(15, []);
if (scores.some((s) => s !== 0)) throw new Error("nobody picks should give 0");

scores = awardFromPicks(0, [1]);
if (scores[1] !== 0) throw new Error("timeout picks should give 0");

const mustHave = [
  "answerKnown",
  ">ANTWOORD<",
  "winnerSelectScreen",
  "pickPlayerAsWinner",
  "pickNobody",
  "nobodyPick",
  "GAME_PHASE",
  "lockQuestion",
  "computePendingPoints",
  "TIJD VERSTREKEN",
  "confirmWinners",
  "WINNAARS BEVESTIGEN",
  "awardSelectedWinnersOnce",
];
for (const s of mustHave) {
  if (!html.includes(s)) throw new Error("missing marker: " + s);
}

const mustNot = [
  "Fout / geen antwoord",
  "Antwoord gegeven",
  "answerScreen",
  "confirmPoints",
  "finishAnswer",
];
for (const s of mustNot) {
  if (html.includes(s)) throw new Error("should not contain: " + s);
}

console.log("OK: answer-flow-test passed");
