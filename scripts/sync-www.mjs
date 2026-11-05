/**
 * Kopieert web-entrybestanden naar www/ voor Capacitor (webDir).
 * Bron blijft in projectroot; productiewebsite gebruikt de root-bestanden.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const www = path.join(root, "www");

const files = ["index.html", "question-bank.js", "assets/branding/pim-pam-pet-logo.png"];

fs.mkdirSync(www, { recursive: true });

for (const name of files) {
  const src = path.join(root, name);
  const dest = path.join(www, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(src)) {
    console.error(`FAIL: bron ontbreekt: ${name}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  console.log(`OK: ${name} -> www/${name}`);
}
