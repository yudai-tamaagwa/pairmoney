import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDelimited,
  detectMapping,
  guessHeader,
  normalizeDate,
  normalizeAmount,
  convertRows,
  selectNewTransactions,
} from "../src/csvImport.js";

test("quoted CSV cells including comma and newline", () => {
  const rows = parseDelimited(
    '利用日,利用店名,利用金額\n2026/11/01,"店,舗",1,200\n',
  );
  assert.equal(rows[1][1], "店,舗");
  // Unquoted commas in amounts are ambiguous; quoted amounts are supported.
  assert.equal(parseDelimited('a,b\n"line\nline",2')[1][0], "line\nline");
});
test("header detection with introductory lines", () => {
  const rows = parseDelimited(
    "ご利用明細\n利用年月日,利用店名,利用金額\n2026/11/01,スーパー,1200",
  );
  assert.equal(guessHeader(rows), 1);
  assert.deepEqual(
    [
      detectMapping(rows[1]).date,
      detectMapping(rows[1]).merchant,
      detectMapping(rows[1]).amount,
    ],
    [0, 1, 2],
  );
});
test("dates and invalid dates", () => {
  assert.equal(normalizeDate("2026年11月2日"), "2026-11-02");
  assert.equal(normalizeDate("20261102"), "2026-11-02");
  assert.equal(normalizeDate("2026/02/30"), null);
});
test("amounts", () => {
  assert.equal(normalizeAmount("¥1,200"), 1200);
  assert.equal(normalizeAmount("(1,200)"), 1200);
  assert.equal(normalizeAmount("未定"), null);
});
test("unknown merchants fall back to その他 and bad rows skipped", () => {
  const rows = parseDelimited(
    '日付,店名,金額\n2026/11/01,スーパー,"1,200"\n2026/11/02,未知の店,300\n2026/02/30,店,400',
  );
  const { result, errors } = convertRows(
    rows,
    0,
    detectMapping(rows[0]),
    "自分",
    [{ keyword: "スーパー", category: "食費" }],
  );
  assert.deepEqual(
    result.map((x) => x.category),
    ["食費", "その他"],
  );
  assert.deepEqual(errors, [4]);
});
test("preserves repeated identical purchases, prevents repeat imports", () => {
  const t = {
    date: "2026-11-01",
    merchant: "スーパー",
    amount: 500,
    payer: "自分",
    type: "expense",
  };
  const first = selectNewTransactions([], [t, t]);
  assert.equal(first.length, 2);
  assert.equal(selectNewTransactions(first, [t, t]).length, 0);
  assert.equal(selectNewTransactions(first, [t, t, t]).length, 1);
});

test("空のキーワードは分類に使わない", () => {
  const rows = [
    ["利用日", "利用店名", "利用金額"],
    ["2026/11/12", "未登録の店舗", "1500"],
  ];
  const mapping = { date: 0, merchant: 1, amount: 2, payer: -1, type: -1 };
  const { result } = convertRows(rows, 0, mapping, "自分", [
    { keyword: "  ", category: "食費" },
  ]);
  assert.equal(result[0].category, "その他");
});
