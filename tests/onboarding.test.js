import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
test("first-time testers can start guided test from the actual Ledger", () => {
  assert.match(app, /pairmoneyへようこそ/);
  assert.match(app, /onClick=\{startGuidedTest\}/);
  assert.match(app, /setTestPanel\(true\)/);
  assert.match(app, /setTab\('home'\)/);
});
test("testers can choose guidance or free exploration", () => {
  assert.match(app, /使い方を先に見る/);
  assert.match(app, /自由に触ってみる/);
  assert.match(css, /\.first-visit/);
});
test("cloud sign-in page allows local demo without registration", () => {
  assert.match(app, /登録せずにおためし/);
  assert.match(app, /if\(demoMode\)return/);
  assert.match(app, /ログイン画面へ戻る/);
});
test("demo warns against using personal card statements", () => {
  assert.match(app, /実際のカード明細や個人情報は入力しないでください/);
});
