// Guided testing stores only self-reported outcomes, never household financial data.
export const TEST_TASKS = [
  {id:'overview',tab:'home',title:'ホームの数字を見る',instruction:'今月の収入・支出・残りの金額を確認してください。'},
  {id:'manual',tab:'transactions',title:'支出を1件追加する',instruction:'「明細」から架空の支出を1件登録し、一覧に表示されるか確認してください。'},
  {id:'csv',tab:'transactions',title:'CSVを取り込む',instruction:'上の「サンプルCSV」を保存し、「明細」のCSV取込から読み込んでください。'},
  {id:'category',tab:'transactions',title:'カテゴリーを変更する',instruction:'明細のカテゴリーを別の種類に変更してください。'},
  {id:'goal',tab:'goals',title:'ほしい物を追加する',instruction:'架空のほしい物を追加し、目標金額が表示されるか確認してください。'},
  {id:'settlement',tab:'settlement',title:'精算金額を確認する',instruction:'共通費の精算画面を開き、どちらがいくら負担するか確認してください。'},
  {id:'backup',tab:'settings',title:'バックアップを書き出す',instruction:'設定からJSONバックアップを書き出してください。'}
];
export const TEST_OUTCOMES = ['passed','failed','skipped'];
export function normalizeTestProgress(value){
  if(!value || typeof value!=='object'||Array.isArray(value))return {};
  return Object.fromEntries(TEST_TASKS.filter(t=>value[t.id]===true).map(t=>[t.id,true]));
}
export function normalizeTestOutcomes(value){
  if(!value || typeof value!=='object'||Array.isArray(value))return {};
  return Object.fromEntries(TEST_TASKS.filter(t=>TEST_OUTCOMES.includes(value[t.id])).map(t=>[t.id,value[t.id]]));
}
export function normalizeTestNotes(value){
  if(!value || typeof value!=='object' || Array.isArray(value))return {};
  return Object.fromEntries(TEST_TASKS.filter(t=>typeof value[t.id]==='string' && value[t.id].trim()).map(t=>[t.id,value[t.id].slice(0,500)]));
}
export function testSummary(outcomes){
  const safe=normalizeTestOutcomes(outcomes);
  const result={passed:0,failed:0,skipped:0,untested:0};
  for(const task of TEST_TASKS)result[safe[task.id]||'untested']++;
  return result;
}
export function makeTestReport(progress,feedback='',environment='',outcomes=null,notes={}){
  const checked=normalizeTestProgress(progress);
  const statuses=outcomes===null?Object.fromEntries(Object.keys(checked).map(k=>[k,'passed'])):normalizeTestOutcomes(outcomes);
  const summary=testSummary(statuses);
  const safeNotes=normalizeTestNotes(notes);
  const labels={passed:'成功',failed:'問題あり',skipped:'実施できず',untested:'未実施'};
  return [
    'pairmoney（ペアマニ） — おためし操作テスト結果',
    `完了: ${summary.passed}/${TEST_TASKS.length}` ,
    `成功: ${summary.passed}/${TEST_TASKS.length} / 問題あり: ${summary.failed} / 実施できず: ${summary.skipped} / 未実施: ${summary.untested}`,
    ...TEST_TASKS.flatMap(t=>[`[${labels[statuses[t.id]||'untested']}] ${t.title}`,...(safeNotes[t.id]?[`  メモ: ${safeNotes[t.id]}`]:[])]),
    `利用環境: ${String(environment).slice(0,200) || '未記入'}`,
    '気づいたこと・不具合:',
    String(feedback).slice(0,3000)||'（未記入）',
    '',
    '※ 家計の金額・氏名・カード明細などの個人データは含みません（自動収集しません）。入力欄には個人情報を書かないでください。'
  ].join('\n');
}
