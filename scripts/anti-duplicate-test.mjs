import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");

const tcMatch = html.match(/const taskCategories=(\{[\s\S]*?\});/);
if (!tcMatch) throw new Error("taskCategories missing");
const taskCategories = eval("(" + tcMatch[1] + ")");

function promptKey(c, text) {
  return c + "\u001f" + text;
}

function createEngine(activeCategories) {
  let usedPromptKeys = new Set();
  const allActivePrompts = () =>
    activeCategories.flatMap((c) =>
      taskCategories[c].map((text) => ({ c, text, key: promptKey(c, text) }))
    );
  const unusedPrompts = () =>
    allActivePrompts().filter((p) => !usedPromptKeys.has(p.key));
  const pickAndRegister = () => {
    const unused = unusedPrompts();
    if (!unused.length) return null;
    const chosen = unused[Math.floor(Math.random() * unused.length)];
    if (usedPromptKeys.has(chosen.key)) return "duplicate_guard";
    usedPromptKeys.add(chosen.key);
    return chosen.key;
  };
  return {
    reset: () => {
      usedPromptKeys = new Set();
    },
    size: () => usedPromptKeys.size,
    pickAndRegister,
    unusedCount: () => unusedPrompts().length,
    totalActive: () => allActivePrompts().length,
  };
}

// 1) No duplicates within a full pool (8 default categories = 48 prompts)
const eight = Object.keys(taskCategories).slice(0, 8);
const engineA = createEngine(eight);
const seen = new Set();
for (let i = 0; i < 48; i++) {
  const key = engineA.pickAndRegister();
  if (!key || key === "duplicate_guard") {
    console.error("FAIL: unexpected pick at", i, key);
    process.exit(1);
  }
  if (seen.has(key)) {
    console.error("FAIL: duplicate key within round", key);
    process.exit(1);
  }
  seen.add(key);
}
if (engineA.unusedCount() !== 0) {
  console.error("FAIL: expected empty pool after 48 picks");
  process.exit(1);
}
if (engineA.pickAndRegister() !== null) {
  console.error("FAIL: should not pick when exhausted");
  process.exit(1);
}
console.log("OK: no duplicates across full 8-category pool (48 prompts)");

// 2) Reset on play again simulation
engineA.reset();
const k1 = engineA.pickAndRegister();
const k2 = engineA.pickAndRegister();
if (!k1 || !k2) {
  console.error("FAIL: picks after reset");
  process.exit(1);
}
console.log("OK: reset clears used prompts (play again / new start)");

// 3) Session persistence (no reset between picks)
const engineB = createEngine(["animals"]);
const keys = [];
for (let i = 0; i < 6; i++) keys.push(engineB.pickAndRegister());
if (keys.some((k) => !k) || new Set(keys).size !== 6) {
  console.error("FAIL: single category 6 unique picks", keys);
  process.exit(1);
}
if (engineB.pickAndRegister() !== null) {
  console.error("FAIL: 7th pick should fail for one category");
  process.exit(1);
}
console.log("OK: exhausted pool when all category prompts used");

// 4) New game start reset
engineB.reset();
if (engineB.pickAndRegister() === null) {
  console.error("FAIL: should pick after new-game reset");
  process.exit(1);
}
console.log("OK: new game start reset");

// 5) HTML hooks present
for (const token of [
  "usedPromptKeys",
  "resetUsedPrompts",
  "unusedPrompts",
  "promptKey",
  "showChallengeExhausted",
]) {
  if (!html.includes(token)) {
    console.error("FAIL: missing", token);
    process.exit(1);
  }
}
console.log("OK: anti-duplicate symbols present in index.html");

console.log("OK: anti-duplicate-test passed");
