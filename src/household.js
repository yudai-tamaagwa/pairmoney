// Pure calculation helpers. Old transactions without a scope are treated as shared.
export const scopeOf = t => t.scope === 'personal' ? 'personal' : 'shared';
export function sharedSummary(transactions, members, shareRatio=50) {
  const shared = transactions.filter(t=>t.type==='expense' && scopeOf(t)==='shared');
  const spent = Object.fromEntries(members.map(m=>[m,shared.filter(t=>t.payer===m).reduce((n,t)=>n+Number(t.amount||0),0)]));
  const total = shared.reduce((n,t)=>n+Number(t.amount||0),0);
  const targetFirst = Math.round(total * Number(shareRatio)/100);
  const difference = (spent[members[0]]||0)-targetFirst;
  return {spent,total,difference,from:difference>0?members[1]:members[0],to:difference>0?members[0]:members[1],amount:Math.abs(difference)};
}
export function settlementStatus(summary, record) {
  return record && record.signature===`${summary.total}:${summary.difference}:${summary.from}:${summary.to}` ? 'settled' : 'unsettled';
}
export function settlementSignature(s) {return `${s.total}:${s.difference}:${s.from}:${s.to}`;}
export function purchaseImpact(goals, selectedId) {
  const selected=goals.find(g=>g.id===selectedId);
  if(!selected)return [];
  const needed=Math.max(0,Number(selected.price)-Number(selected.saved));
  return goals.filter(g=>g.id!==selectedId).map(g=>({id:g.id,name:g.name,additionalMonths:Number(g.monthly)>0?Math.ceil(needed/Number(g.monthly)):null}));
}
