import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const bankCode = fs.readFileSync(path.join(root, "question-bank.js"), "utf8");
const ctx = { QUESTION_BANK: [], CATEGORY_CATALOG: [] };
vm.runInContext(bankCode, vm.createContext(ctx));
const { QUESTION_BANK, CATEGORY_CATALOG } = ctx;

function questionsForCategories(categoryIds) {
  const allowed = new Set(categoryIds);
  return QUESTION_BANK.filter((q) => q.active && allowed.has(q.categoryId));
}

function createEngine(categoryIds) {
  let usedQuestionIds = new Set();
  const pickAndRegister = () => {
    const pool = questionsForCategories(categoryIds).filter((q) => !usedQuestionIds.has(q.id));
    if (!pool.length) return null;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    if (usedQuestionIds.has(chosen.id)) return "duplicate_guard";
    usedQuestionIds.add(chosen.id);
    return chosen.id;
  };
  return {
    reset: () => {
      usedQuestionIds = new Set();
    },
    pickAndRegister,
    unusedCount: () =>
      questionsForCategories(categoryIds).filter((q) => !usedQuestionIds.has(q.id)).length,
  };
}

const eight = ["dieren", "eten", "beroepen", "plaatsen", "film", "gek", "sport", "voorwerpen"];
const engineA = createEngine(eight);
const seen = new Set();
for (let i = 0; i < 80; i++) {
  const id = engineA.pickAndRegister();
  if (!id || id === "duplicate_guard") {
    console.error("FAIL: unexpected pick at", i, id);
    process.exit(1);
  }
  if (seen.has(id)) {
    console.error("FAIL: duplicate id within session", id);
    process.exit(1);
  }
  seen.add(id);
}
console.log("OK: no duplicate question ids in multi-category session");

engineA.reset();
if (engineA.pickAndRegister() === null) {
  console.error("FAIL: pick after reset");
  process.exit(1);
}
console.log("OK: reset on new game");

const one = createEngine(["dieren"]);
for (let i = 0; i < 150; i++) {
  if (one.pickAndRegister() === null && i < 149) {
    console.error("FAIL: early exhaustion dieren at", i);
    process.exit(1);
  }
}
if (one.pickAndRegister() !== null) {
  console.error("FAIL: should be exhausted after 150");
  process.exit(1);
}
console.log("OK: exhaustion without repeat");

console.log("OK: anti-duplicate-test passed");
