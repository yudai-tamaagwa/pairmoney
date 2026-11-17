/** Helpers for safe handling of cloud synchronization errors. */
export function classifySyncError(error) {
  const message = String(error?.message || error || "Unknown error");
  if (/version conflict/i.test(message)) return "conflict";
  if (/network|fetch|offline|timeout|failed to fetch/i.test(message))
    return "network";
  if (/not authorized|permission|jwt|authentication/i.test(message))
    return "permission";
  return "unknown";
}

/** Never merge concurrent whole-document writes automatically. */
export function canReloadRemote({ pending, writing, blocked }) {
  return !pending && !writing && !blocked;
}

export function syncLabel(status) {
  return (
    {
      saved: "保存済み",
      saving: "保存中",
      pending: "未保存の変更あり",
      error: "同期停止",
      loading: "読み込み中",
    }[status] || "状態不明"
  );
}
