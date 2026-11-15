// Bounded, non-sensitive audit metadata for transaction edits.
export function recordChange(data, action, transaction, detail = '', actor = 'この端末') {
  const entry = { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), action, transactionId: transaction.id, merchant: transaction.merchant, detail, actor };
  return { ...data, activity: [entry, ...(data.activity || [])].slice(0, 200) };
}
export function deleteWithUndo(data, id) {
  const transaction = data.transactions.find(t => t.id === id);
  if (!transaction) return data;
  const next = recordChange(data, 'deleted', transaction, '明細を削除');
  return { ...next, transactions: data.transactions.filter(t => t.id !== id), trash: [{ ...transaction, deletedAt: new Date().toISOString() }, ...(data.trash || []).filter(t => t.id !== id)].slice(0, 100) };
}
export function restoreDeleted(data, id) {
  const transaction = (data.trash || []).find(t => t.id === id);
  if (!transaction || data.transactions.some(t => t.id === id)) return data;
  const { deletedAt, ...restored } = transaction;
  const next = recordChange(data, 'restored', restored, '削除した明細を復元');
  return { ...next, transactions: [restored, ...data.transactions], trash: (data.trash || []).filter(t => t.id !== id) };
}
