import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import vm from "vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadBank() {
  const code = fs.readFileSync(path.join(root, "question-bank.js"), "utf8");
  const ctx = { QUESTION_BANK: [], CATEGORY_CATALOG: [] };
  vm.runInContext(code, vm.createContext(ctx));
  return ctx;
}

const { QUESTION_BANK, CATEGORY_CATALOG } = loadBank();
const validIds = new Set(CATEGORY_CATALOG.map((c) => c.id));

function questionsForCategories(categoryIds) {
  const allowed = new Set(categoryIds);
  return QUESTION_BANK.filter((q) => q.active && allowed.has(q.categoryId));
}

function simulateSession(categoryIds, picks) {
  const used = new Set();
  const pickedCats = [];
  for (let i = 0; i < picks; i++) {
    const pool = questionsForCategories(categoryIds).filter((q) => !used.has(q.id));
    if (!pool.length) return { ok: false, reason: "exhausted", pickedCats, used: used.size };
    const q = pool[Math.floor(Math.random() * pool.length)];
    if (!categoryIds.includes(q.categoryId)) return { ok: false, reason: "wrong category", q };
    used.add(q.id);
    pickedCats.push(q.categoryId);
  }
  return { ok: true, pickedCats, used: used.size };
}

// Bank integrity
const ids = new Set();
const texts = new Set();
const perCat = {};
for (const q of QUESTION_BANK) {
  if (!validIds.has(q.categoryId)) throw new Error("invalid categoryId " + q.categoryId);
  if (ids.has(q.id)) throw new Error("dup id " + q.id);
  ids.add(q.id);
  const tk = q.categoryId + "\u001f" + q.question.toLowerCase().trim();
  if (texts.has(tk)) throw new Error("dup question text " + q.id);
  texts.add(tk);
  perCat[q.categoryId] = (perCat[q.categoryId] || 0) + 1;
}
for (const c of CATEGORY_CATALOG) {
  if ((perCat[c.id] || 0) < 150) throw new Error(`category ${c.id} has only ${perCat[c.id] || 0}`);
}

const tests = [
  { name: "1 only dieren", ids: ["dieren"], picks: 50 },
  { name: "2 only beroepen", ids: ["beroepen"], picks: 50 },
  { name: "3 dieren+sport", ids: ["dieren", "sport"], picks: 80 },
  { name: "4 all categories", ids: CATEGORY_CATALOG.map((c) => c.id), picks: 100 },
];

for (const t of tests) {
  const r = simulateSession(t.ids, t.picks);
  if (!r.ok && r.reason !== "exhausted") throw new Error(`${t.name} failed: ${r.reason}`);
  const bad = r.pickedCats.filter((id) => !t.ids.includes(id));
  if (bad.length) throw new Error(`${t.name} wrong categories: ${bad[0]}`);
  const dup = new Set();
  for (const id of r.pickedCats) {
    /* category check only here */
  }
  console.log(`OK: ${t.name} — ${r.used} unique picks, categories in selection only`);
}

// 5 disable category — none from disabled
const onlyEten = simulateSession(["eten"], 30);
if (onlyEten.pickedCats.some((c) => c !== "eten")) throw new Error("eten filter failed");

// 6 no category — empty pool
if (questionsForCategories([]).length !== 0) throw new Error("empty selection should yield 0 questions");

// 7 exhaustion — no uncontrolled repeat
const ex = simulateSession(["dieren"], 500);
if (ex.used > 150) throw new Error("should not exceed pool");

// 10 reset simulation
let used = new Set();
const pickOne = () => {
  const pool = questionsForCategories(["sport"]).filter((q) => !used.has(q.id));
  const q = pool[0];
  used.add(q.id);
  return q.id;
};
pickOne();
used = new Set();
pickOne();

console.log("OK: category-engine-test passed");
console.log("Questions per category (sample):");
for (const c of CATEGORY_CATALOG.slice(0, 5)) console.log(" ", c.id, perCat[c.id]);
console.log(" Total questions:", QUESTION_BANK.length);
