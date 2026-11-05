/**
 * Winnaars blijven geselecteerd tot WINNAARS BEVESTIGEN.
 * Geen tijdslimiet; punten één keer, pas bij bevestigen.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const html = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.html"),
  "utf8"
);

const mustHave = [
  'id="confirmWinners"',
  "WINNAARS BEVESTIGEN",
  "function confirmWinners()",
  "function awardSelectedWinnersOnce()",
  "function pickNobody()",
];
for (const s of mustHave) {
  if (!html.includes(s)) throw new Error("missing: " + s);
}

const mustNot = ["WINNER_PICK_FINISH_MS", "scheduleCompleteRoundAfterPicks", "completeRoundAfterPicks"];
for (const s of mustNot) {
  if (html.includes(s)) throw new Error("timer path still present: " + s);
}

const pickFn = html.match(/function pickPlayerAsWinner\(idx\)\{[^}]+\}/);
if (!pickFn) throw new Error("pickPlayerAsWinner missing");
if (pickFn[0].includes("score+=")) throw new Error("pick awards points before confirm");
if (pickFn[0].includes("setTimeout")) throw new Error("pick still schedules a finish");

function createGame(totalRounds) {
  const state = {
    phase: "QUESTION_ACTIVE",
    settled: false,
    finishing: false,
    pending: 0,
    scores: [0, 0, 0],
    awarded: new Set(),
    questionCount: 0,
    screen: "question",
    totalRounds,
    gameOver: false,
  };
  function finish() {
    if (state.settled || state.gameOver) return;
    if (state.phase !== "WINNER_SELECTION" && state.phase !== "NO_WINNER") return;
    state.settled = true;
    state.finishing = true;
    state.questionCount++;
    state.pending = 0;
    state.awarded = new Set();
    if (state.questionCount >= state.totalRounds) {
      state.phase = "GAME_FINISHED";
      state.screen = "results";
      state.gameOver = true;
    } else {
      state.phase = "NEXT_QUESTION";
      state.screen = "wheel";
      state.settled = false;
    }
    state.finishing = false;
  }
  return {
    state,
    answer(left) {
      if (state.gameOver || state.phase !== "QUESTION_ACTIVE") return;
      state.pending = left > 5 ? 15 : left > 0 ? 10 : 0;
      state.phase = "WINNER_SELECTION";
      state.screen = "winners";
      state.finishing = false;
      state.settled = false;
    },
    pick(i) {
      if (state.finishing || state.settled || state.phase !== "WINNER_SELECTION") return false;
      if (state.awarded.has(i)) return false;
      state.awarded.add(i);
      return true;
    },
    confirm() {
      if (state.finishing || state.settled || state.gameOver || state.phase !== "WINNER_SELECTION") return false;
      state.finishing = true;
      if (state.pending > 0) {
        for (const i of state.awarded) state.scores[i] += state.pending;
      }
      finish();
      return true;
    },
    nobody() {
      if (state.finishing || state.settled || state.gameOver || state.phase !== "WINNER_SELECTION") return false;
      state.awarded = new Set();
      finish();
      return true;
    },
  };
}

const sequential = createGame(3);
sequential.answer(8);
if (!sequential.pick(0) || !sequential.pick(1)) throw new Error("sequential picks rejected");
if (sequential.state.scores[0] !== 0 || sequential.state.scores[1] !== 0) {
  throw new Error("scores changed before confirm");
}
if (sequential.state.screen !== "winners") throw new Error("round closed before confirm");
sequential.confirm();
if (sequential.state.scores[0] !== 15 || sequential.state.scores[1] !== 15 || sequential.state.scores[2] !== 0) {
  throw new Error("two sequential winners");
}
if (sequential.state.screen !== "wheel" || sequential.state.questionCount !== 1) {
  throw new Error("confirm did not continue the round");
}

const late = createGame(3);
late.answer(8);
late.pick(0);
if (late.state.phase !== "WINNER_SELECTION") throw new Error("first pick closed the round");
const waitedMs = 480 + 1;
if (waitedMs <= 480) throw new Error("delay fixture");
if (!late.pick(2)) throw new Error("second winner after 480ms rejected");
late.confirm();
if (late.state.scores[0] !== 15 || late.state.scores[2] !== 15) {
  throw new Error("late second winner missing");
}
if (late.pick(1)) throw new Error("pick accepted after confirm");

const once = createGame(3);
once.answer(6);
once.pick(0);
once.pick(0);
once.confirm();
once.confirm();
if (once.state.scores[0] !== 15) throw new Error("confirm awarded more than once");
if (once.state.questionCount !== 1) throw new Error("double confirm advanced two rounds");

const single = createGame(2);
single.answer(4);
single.pick(1);
single.confirm();
if (single.state.scores[1] !== 10 || single.state.scores[0] !== 0) throw new Error("single winner");
if (single.state.screen !== "wheel") throw new Error("single winner did not continue");

const nobody = createGame(2);
nobody.answer(9);
if (nobody.pick(0) !== true) throw new Error("selection before nobody");
nobody.nobody();
if (nobody.state.scores.some((n) => n !== 0)) throw new Error("nobody awarded points");
if (nobody.state.screen !== "wheel" || nobody.state.questionCount !== 1) {
  throw new Error("nobody did not continue");
}

const empty = createGame(2);
empty.answer(9);
empty.confirm();
if (empty.state.scores.some((n) => n !== 0) || empty.state.screen !== "wheel") {
  throw new Error("confirm without winners");
}

const last = createGame(1);
last.answer(8);
last.pick(0);
last.pick(2);
last.confirm();
if (last.state.screen !== "results" || last.state.scores[0] !== 15 || last.state.scores[2] !== 15) {
  throw new Error("last round confirm");
}

console.log("OK: winner-confirm-test passed");
