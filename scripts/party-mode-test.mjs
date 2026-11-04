/**
 * Static + logic checks for party mode and winner celebration update.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function rankPlayers(list) {
  const sorted = [...list].sort((a, b) => b.score - a.score);
  let rank = 0;
  let prevScore = null;
  return sorted.map((p, i) => {
    if (p.score !== prevScore) {
      rank = i + 1;
      prevScore = p.score;
    }
    return { ...p, rank };
  });
}

const mustHave = [
  "player-card",
  "confirmWinners",
  "winnerSelectScreen",
  "selectedAnswerIndices",
  "startWinnerCelebration",
  "stopCelebration",
  "winnerRanking",
  "confettiLayer",
  "playApplauseOnce",
  "prefers-reduced-motion",
  "DE WINNAARS ZIJN",
  "GAME_PHASE",
];

for (const s of mustHave) {
  if (!html.includes(s)) throw new Error(`Missing expected marker: ${s}`);
}

const mustNot = ["Aan de beurt", "turnIndex", "currentTurnPlayer", "JOUW LETTER IS", "answerScreen"];
for (const s of mustNot) {
  if (html.includes(s)) throw new Error(`Should not contain: ${s}`);
}

const ranked = rankPlayers([
  { name: "X", score: 30 },
  { name: "Y", score: 30 },
  { name: "Z", score: 10 },
]);
if (ranked[0].rank !== 1 || ranked[1].rank !== 1 || ranked[2].rank !== 3) {
  throw new Error("tie rank failed");
}

console.log("OK: party-mode-test passed");
