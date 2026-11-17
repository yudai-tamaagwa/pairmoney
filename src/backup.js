// Portable backup validation. Never import untrusted JSON without validating its shape.
export const BACKUP_FORMAT = "futari-kakei-backup";
export function makeBackup(data) {
  validateHousehold(data);
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );
}
export function validateHousehold(data) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw Error("家計データの形式が不正です");
  if (
    !Array.isArray(data.members) ||
    data.members.length !== 2 ||
    !data.members.every(
      (x) => typeof x === "string" && x.length > 0 && x.length <= 100,
    )
  )
    throw Error("メンバー情報が不正です");
  for (const key of ["transactions", "goals", "rules"])
    if (!Array.isArray(data[key]) || data[key].length > 50000)
      throw Error(`${key}の形式が不正です`);
  if (
    !data.settings ||
    typeof data.settings !== "object" ||
    Array.isArray(data.settings)
  )
    throw Error("設定情報が不正です");
  if (
    data.transactions.some(
      (t) =>
        !t ||
        typeof t.id !== "string" ||
        typeof t.date !== "string" ||
        typeof t.merchant !== "string" ||
        !Number.isFinite(Number(t.amount)) ||
        Number(t.amount) < 0 ||
        !["income", "expense"].includes(t.type),
    )
  )
    throw Error("明細に不正なデータがあります");
  if (
    data.goals.some(
      (g) =>
        !g ||
        typeof g.id !== "string" ||
        typeof g.name !== "string" ||
        !Number.isFinite(Number(g.price)) ||
        Number(g.price) < 0,
    )
  )
    throw Error("貯金目標に不正なデータがあります");
  if (
    data.rules.some(
      (r) =>
        !r || typeof r.keyword !== "string" || typeof r.category !== "string",
    )
  )
    throw Error("分類ルールに不正なデータがあります");
  return data;
}
export function parseBackup(raw) {
  if (typeof raw !== "string" || raw.length > 5_000_000)
    throw Error("バックアップが大きすぎます（上限5MB）");
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw Error("JSONファイルを読み取れません");
  }
  if (payload?.format !== BACKUP_FORMAT || payload.version !== 1)
    throw Error("対応していないバックアップ形式です");
  return validateHousehold(payload.data);
}
