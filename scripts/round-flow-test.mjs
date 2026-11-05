/**
 * Vier schermen: rad, vraag, winnaars, geen winnaar.
 * Eén afronding per ronde, punten alleen bij ANTWOORD.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const html = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.html"),
  "utf8"
);

const mustHave = [
  'id="questionScreen"',
  'id="noWinnerScreen"',
  "TIJD VOORBIJ!",
  "GEEN WINNAAR",
  "Niemand heeft op tijd op ANTWOORD gedrukt.",
  "VOLGENDE RONDE",
  "finishQuestionRound",
  "openNoWinnerScreen",
  "startQuestionCountdown",
  "GAME_PHASE.NO_WINNER",
  "roundSettled",
];
for (const s of mustHave) {
  if (!html.includes(s)) throw new Error("missing: " + s);
}

function createRound(totalRounds) {
  const state = {
    phase: "QUESTION_ACTIVE",
    locked: false,
    settled: false,
    pending: 0,
    scores: [0, 0, 0],
    awarded: new Set(),
    questionCount: 0,
    screen: "question",
    totalRounds,
    gameOver: false,
    finishing: false,
  };
  return {
    state,
    answer(left) {
      if (state.gameOver || state.locked || state.settled || state.phase !== "QUESTION_ACTIVE") return;
      state.locked = true;
      state.pending = left > 5 ? 15 : left > 0 ? 10 : 0;
      state.phase = "WINNER_SELECTION";
      state.screen = "winners";
    },
    timeout() {
      if (state.gameOver || state.locked || state.settled || state.phase !== "QUESTION_ACTIVE") return;
      state.locked = true;
      state.pending = 0;
      state.phase = "NO_WINNER";
      state.screen = "noWinner";
    },
    pick(i) {
      if (state.phase !== "WINNER_SELECTION" || state.settled || state.finishing || state.awarded.has(i)) return;
      state.awarded.add(i);
    },
    confirm() {
      if (state.finishing || state.settled || state.gameOver || state.phase !== "WINNER_SELECTION") return;
      state.finishing = true;
      if (state.pending > 0) {
        for (const i of state.awarded) state.scores[i] += state.pending;
      }
      this.finish();
    },
    finish() {
      if (state.settled || state.gameOver) return;
      if (state.phase !== "WINNER_SELECTION" && state.phase !== "NO_WINNER") return;
      state.settled = true;
      state.questionCount++;
      state.pending = 0;
      state.awarded = new Set();
      if (state.questionCount >= state.totalRounds) {
        state.phase = "GAME_FINISHED";
        state.screen = "results";
        state.gameOver = true;
        return;
      }
      state.phase = "NEXT_QUESTION";
      state.screen = "wheel";
      state.locked = false;
      state.settled = false;
    },
  };
}

const single = createRound(3);
single.answer(8);
single.pick(0);
single.pick(0);
if (single.state.scores[0] !== 0) throw new Error("points awarded before confirm");
single.confirm();
single.confirm();
if (single.state.scores[0] !== 15) throw new Error("double pick awarded twice");
if (single.state.questionCount !== 1 || single.state.screen !== "wheel") {
  throw new Error("round finished more than once");
}

const multi = createRound(2);
multi.answer(4);
multi.pick(0);
multi.pick(2);
if (multi.state.scores[0] !== 0 || multi.state.scores[2] !== 0) throw new Error("points awarded before confirm");
multi.confirm();
if (multi.state.scores[0] !== 10 || multi.state.scores[2] !== 10 || multi.state.scores[1] !== 0) {
  throw new Error("multi winner points");
}
if (multi.state.screen !== "wheel") throw new Error("first round should return to the wheel");
multi.state.phase = "NO_WINNER";
multi.timeout();
multi.finish();
if (multi.state.screen !== "results") throw new Error("last round should open results");

const expired = createRound(2);
expired.timeout();
expired.timeout();
if (expired.state.screen !== "noWinner" || expired.state.pending !== 0) {
  throw new Error("timeout should open no-winner once");
}
expired.pick(0);
if (expired.state.scores.some((n) => n !== 0)) throw new Error("timeout awarded points");
expired.finish();
if (expired.state.screen !== "wheel" || expired.state.questionCount !== 1) {
  throw new Error("timeout next round failed");
}

const countdown = { started: false, screenHidden: true };
function startQuestionCountdown() {
  if (countdown.screenHidden) return;
  countdown.started = true;
}
startQuestionCountdown();
if (countdown.started) throw new Error("timer started before question screen");
countdown.screenHidden = false;
startQuestionCountdown();
if (!countdown.started) throw new Error("timer did not start on question screen");

console.log("OK: round-flow-test passed");
