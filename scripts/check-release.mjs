import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const workflow = read(".github/workflows/publish-demo.yml");
const config = read("vite.config.js");
const html = read("index.html");
assert.match(workflow, /npm install --no-audit --no-fund/);
assert.match(workflow, /npm test/);
assert.match(workflow, /npm run build/);
assert.ok(
  workflow.indexOf("Build production demo for browser testing") <
    workflow.indexOf("Test production demo on desktop and mobile"),
);
assert.ok(
  workflow.indexOf("Test production demo on desktop and mobile") <
    workflow.indexOf("Build GitHub Pages release"),
);
const playwright = read("playwright.config.js");
assert.match(playwright, /npm run preview/);
assert.doesNotMatch(playwright, /npm run dev/);
assert.match(workflow, /VITE_SUPABASE_URL: ''/);
assert.match(workflow, /VITE_SUPABASE_ANON_KEY: ''/);
assert.match(config, /VITE_BASE_PATH/);
assert.match(html, /<div id="root"><\/div>/);
assert.ok(existsSync(new URL("../src/App.jsx", import.meta.url)));
console.log(
  "Release configuration checks passed. This does NOT verify browser behavior or a successful deployment.",
);
