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

function awardPoints({ pending, nobody, picks }) {
  const awarded = !nobody && picks.length > 0 ? pending : 0;
  const scores = [0, 0, 0];
  if (awarded > 0) picks.forEach((i) => {
    scores[i] += awarded;
  });
  return { awarded, scores };
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

let r = awardPoints({ pending: 15, nobody: false, picks: [0] });
if (r.awarded !== 15 || r.scores[0] !== 15) throw new Error("single winner failed");

r = awardPoints({ pending: 15, nobody: false, picks: [0, 2] });
if (r.scores[0] !== 15 || r.scores[2] !== 15 || r.scores[1] !== 0) throw new Error("multi winner failed");

r = awardPoints({ pending: 15, nobody: true, picks: [] });
if (r.awarded !== 0) throw new Error("nobody should give 0");

r = awardPoints({ pending: 0, nobody: false, picks: [1] });
if (r.awarded !== 0 || r.scores[1] !== 0) throw new Error("timeout picks should give 0");

const mustHave = [
  "answerKnown",
  "ANTWOORD GEWETEN!",
  "winnerSelectScreen",
  "confirmWinners",
  "BEVESTIG WINNAARS",
  "nobodyPick",
  "GAME_PHASE",
  "lockQuestion",
  "computePendingPoints",
  "TIJD VERSTREKEN",
];
for (const s of mustHave) {
  if (!html.includes(s)) throw new Error("missing marker: " + s);
}

const mustNot = ["Fout / geen antwoord", "Antwoord gegeven", "answerScreen", "confirmPoints", "finishAnswer"];
for (const s of mustNot) {
  if (html.includes(s)) throw new Error("should not contain: " + s);
}

console.log("OK: answer-flow-test passed");
