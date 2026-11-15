import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTestNotes,makeTestReport} from '../src/tester.js';
test('unknown task notes and nonstring values are ignored',()=>{
 assert.deepEqual(normalizeTestNotes({csv:'列が不明',unknown:'secret',goal:42}),{csv:'列が不明'});
});
test('notes are limited to 500 characters',()=>{
 assert.equal(normalizeTestNotes({csv:'x'.repeat(700)}).csv.length,500);
});
test('report includes notes only for known tasks',()=>{
 const report=makeTestReport({},'','',{csv:'failed'},{csv:'列が不明',other:'secret'});
 assert.match(report,/メモ: 列が不明/);
 assert.doesNotMatch(report,/secret/);
});
test('blank notes are omitted from report',()=>{
 const report=makeTestReport({},'','',{}, {csv:'   '});
 assert.doesNotMatch(report,/メモ:/);
});
