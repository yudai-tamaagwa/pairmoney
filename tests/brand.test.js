import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
const file = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
test("pairmoney title and favicon are configured", () => {
  assert.match(file("index.html"), /pairmoney（ペアマニ）/);
  assert.match(file("index.html"), /pairmoney-logo\.png/);
});
test("mobile branding exists in React app", () => {
  assert.match(file("src/App.jsx"), /mobile-brand/);
  assert.match(file("src/App.jsx"), /pairmoney-icon-192\.png/);
});
test("brand colors include navy and orange", () => {
  assert.match(file("src/style.css"), /#092d69/i);
  assert.match(file("src/style.css"), /#f77c00/i);
});
test("brand image assets exist", () => {
  assert.ok(
    statSync(new URL("../public/pairmoney-logo.png", import.meta.url)).size >
      1000,
  );
  assert.ok(
    statSync(new URL("../public/pairmoney-icon-192.png", import.meta.url))
      .size > 1000,
  );
});
