import test from "node:test";
import assert from "node:assert/strict";
import {
  scopeOf,
  sharedSummary,
  settlementSignature,
  settlementStatus,
  purchaseImpact,
} from "../src/household.js";
const members = ["A", "B"];
test("legacy expense is shared", () => assert.equal(scopeOf({}), "shared"));
test("personal expenses excluded from settlement", () => {
  const s = sharedSummary(
    [
      { type: "expense", amount: 1000, payer: "A", scope: "shared" },
      { type: "expense", amount: 9000, payer: "B", scope: "personal" },
    ],
    members,
  );
  assert.equal(s.total, 1000);
  assert.equal(s.amount, 500);
  assert.equal(s.from, "B");
});
test("share ratio adjusts transfer", () => {
  const s = sharedSummary(
    [{ type: "expense", amount: 10000, payer: "B" }],
    members,
    60,
  );
  assert.equal(s.from, "A");
  assert.equal(s.amount, 6000);
});
test("settlement invalidated when totals change", () => {
  const s = sharedSummary(
    [{ type: "expense", amount: 1000, payer: "A" }],
    members,
  );
  const record = { signature: settlementSignature(s) };
  assert.equal(settlementStatus(s, record), "settled");
  assert.equal(settlementStatus({ ...s, total: 2000 }, record), "unsettled");
});
test("purchase impact is labeled hypothetical", () => {
  const g = [
    { id: "a", price: 20000, saved: 5000 },
    { id: "b", name: "旅行", monthly: 5000 },
  ];
  assert.equal(purchaseImpact(g, "a")[0].additionalMonths, 3);
});
