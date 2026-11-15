import test from 'node:test';
import assert from 'node:assert/strict';
import {TEST_TASKS,normalizeTestProgress,makeTestReport} from '../src/tester.js';
test('テスト項目は一意で画面が指定されている',()=>{assert.equal(new Set(TEST_TASKS.map(t=>t.id)).size,TEST_TASKS.length);assert.ok(TEST_TASKS.every(t=>t.tab&&t.instruction))});
test('未知の項目や偽値は除外する',()=>assert.deepEqual(normalizeTestProgress({overview:true,csv:false,unknown:true}),{overview:true}));
test('壊れた保存値を受け付けない',()=>{assert.deepEqual(normalizeTestProgress(null),{});assert.deepEqual(normalizeTestProgress([]),{})});
test('結果レポートに完了件数とコメントが含まれる',()=>{const r=makeTestReport({overview:true},'ボタンがわかりにくい','Safari');assert.match(r,/完了: 1\/7/);assert.match(r,/ボタンがわかりにくい/);assert.match(r,/Safari/)});
test('結果レポートに家計データを受け取る引数がない',()=>{const r=makeTestReport({},'','');assert.ok(!r.includes('スーパー青空'));assert.match(r,/個人データは含みません/)});
