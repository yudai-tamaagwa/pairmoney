// Card-provider-neutral CSV/TSV parser. No card credentials or raw files are uploaded.
export function parseDelimited(text, delimiter = ",") {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
export const fieldAliases = {
  date: [
    "利用日",
    "利用年月日",
    "ご利用日",
    "ご利用年月日",
    "取引日",
    "日付",
    "date",
    "transaction date",
  ],
  merchant: [
    "利用店名",
    "ご利用先",
    "ご利用店名",
    "利用店舗",
    "加盟店名",
    "店舗名",
    "店名",
    "摘要",
    "内容",
    "merchant",
    "description",
    "利用先",
  ],
  amount: [
    "利用金額",
    "ご利用金額",
    "お支払金額",
    "金額",
    "取引金額",
    "amount",
    "支払金額",
  ],
  payer: ["支払者", "payer"],
  type: ["種別", "type"],
};
const norm = (s) =>
  String(s || "")
    .normalize("NFKC")
    .replace(/[\s　_()（）]/g, "")
    .toLowerCase();
export function detectMapping(headers) {
  return Object.fromEntries(
    Object.entries(fieldAliases).map(([field, aliases]) => [
      field,
      headers.findIndex((h) => aliases.some((a) => norm(a) === norm(h))),
    ]),
  );
}
export function guessHeader(rows) {
  let best = 0,
    score = -1;
  rows.slice(0, Math.min(rows.length, 15)).forEach((r, i) => {
    const m = detectMapping(r);
    const s = ["date", "merchant", "amount"].filter((k) => m[k] >= 0).length;
    if (s > score) {
      score = s;
      best = i;
    }
  });
  return best;
}
export function normalizeDate(value) {
  const s = String(value || "")
    .trim()
    .normalize("NFKC");
  let m = s.match(/^(\d{4})[\/.年-](\d{1,2})[\/.月-](\d{1,2})日?$/);
  if (!m) m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const dt = new Date(Date.UTC(+y, +mo - 1, +d));
  return dt.getUTCFullYear() === +y &&
    dt.getUTCMonth() === +mo - 1 &&
    dt.getUTCDate() === +d
    ? `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
    : null;
}
export function normalizeAmount(value) {
  const s = String(value || "")
    .normalize("NFKC")
    .replace(/[¥￥円,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");
  if (!/^[+-]?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n !== 0 ? Math.abs(n) : null;
}
export async function readStatement(file, encoding = "auto") {
  const bytes = await file.arrayBuffer();
  let text;
  if (encoding === "auto") {
    const utf = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const sjis = new TextDecoder("shift_jis", { fatal: false }).decode(bytes);
    text =
      (utf.match(/\uFFFD/g) || []).length <=
      (sjis.match(/\uFFFD/g) || []).length
        ? utf
        : sjis;
  } else text = new TextDecoder(encoding).decode(bytes);
  text = text.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/).find(Boolean) || "";
  const delim = ["\t", ",", ";"].sort(
    (a, b) => first.split(b).length - first.split(a).length,
  )[0];
  return parseDelimited(text, delim);
}
export function convertRows(rows, headerIndex, mapping, payer, rules) {
  const result = [],
    errors = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const r = rows[i];
    const date = normalizeDate(r[mapping.date]);
    const merchant = String(r[mapping.merchant] || "").trim();
    const amount = normalizeAmount(r[mapping.amount]);
    if (!date || !merchant || amount === null) {
      errors.push(i + 1);
      continue;
    }
    const rawType =
      mapping.type >= 0 ? String(r[mapping.type] || "").trim() : "";
    const type = ["income", "収入"].includes(rawType) ? "income" : "expense";
    const category =
      type === "income"
        ? "収入"
        : rules.find(
            (rule) =>
              rule.keyword?.trim() &&
              merchant
                .toLocaleLowerCase()
                .includes(rule.keyword.trim().toLocaleLowerCase()),
          )?.category || "その他";
    result.push({
      date,
      merchant,
      amount,
      category,
      payer:
        mapping.payer >= 0 && String(r[mapping.payer] || "").trim()
          ? String(r[mapping.payer]).trim()
          : payer,
      type,
    });
  }
  return { result, errors };
}
export const transactionKey = (t) =>
  [
    t.date,
    t.merchant.trim().normalize("NFKC"),
    Number(t.amount),
    t.payer,
    t.type,
  ].join("|");

// Multiset comparison: two identical purchases in one statement remain two
// purchases, while importing that same statement again adds nothing.
// For ambiguous overlapping statements, review the preview before confirming.
export function selectNewTransactions(existing, incoming) {
  const counts = new Map();
  for (const tx of existing) {
    const key = transactionKey(tx);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const seen = new Map();
  const added = [];
  for (const tx of incoming) {
    const key = transactionKey(tx);
    const occurrence = (seen.get(key) || 0) + 1;
    seen.set(key, occurrence);
    if (occurrence > (counts.get(key) || 0)) added.push(tx);
  }
  return added;
}
