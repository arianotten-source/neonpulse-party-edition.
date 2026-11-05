/**
 * Preview correction: instant winner picks, no confirm buttons, auto advance.
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

/** Each distinct pick awards pending points once (matches pickPlayerAsWinner). */
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

if (computePendingPoints(8) !== 15) throw new Error("points calc");
const multi = awardFromPicks(15, [0, 2, 0]);
if (multi[0] !== 15 || multi[2] !== 15 || multi[1] !== 0) {
  throw new Error("multi pick award failed");
}
if (awardFromPicks(0, [1]).every((s) => s === 0) === false) {
  throw new Error("zero pending should not award");
}

const mustHave = [
  ">ANTWOORD<",
  "pickPlayerAsWinner",
  "pickNobody",
  "completeRoundAfterPicks",
  "scheduleCompleteRoundAfterPicks",
  "winnerCelebrationPlayedThisGame",
  "scheduleResultsReveal",
  "revealFinalResults",
  "startWinnerCelebration",
  "confettiLayer",
  "playApplauseOnce",
];

for (const s of mustHave) {
  if (!html.includes(s)) throw new Error("missing: " + s);
}

const mustNot = [
  "BEVESTIG WINNAARS",
  "confirmWinners",
  "winnerContinue",
  "BEKIJK DE EINDSTAND",
  "ANTWOORD GEWETEN!",
];
for (const s of mustNot) {
  if (html.includes(s)) throw new Error("should not contain: " + s);
}

console.log("OK: preview-flow-test passed");
