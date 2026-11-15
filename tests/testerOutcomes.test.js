import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTestOutcomes,testSummary,makeTestReport,TEST_TASKS} from '../src/tester.js';
test('valid outcomes only',()=>assert.deepEqual(normalizeTestOutcomes({overview:'passed',manual:'failed',csv:'skipped',unknown:'passed',goal:'invalid'}),{overview:'passed',manual:'failed',csv:'skipped'}));
test('invalid progress values cannot become results',()=>assert.deepEqual(normalizeTestOutcomes({overview:true,manual:null}),{}));
test('summary includes untested tasks',()=>assert.deepEqual(testSummary({overview:'passed',manual:'failed',csv:'skipped'}),{passed:1,failed:1,skipped:1,untested:TEST_TASKS.length-3}));
test('report distinguishes failed and skipped',()=>{const s=makeTestReport({},'CSV error','Safari',{overview:'passed',csv:'failed',goal:'skipped'});assert.match(s,/問題あり: 1/);assert.match(s,/\[問題あり\] CSVを取り込む/);assert.match(s,/\[実施できず\] ほしい物を追加する/);assert.match(s,/CSV error/)});
test('report does not include arbitrary unknown outcome keys',()=>assert.doesNotMatch(makeTestReport({},'', '',{unknown:'failed'}),/unknown/));
