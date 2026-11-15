import test from 'node:test';
import assert from 'node:assert/strict';
import {deleteWithUndo,restoreDeleted,recordChange} from '../src/history.js';
const transaction = {id:'t1',date:'2026-11-01',merchant:'店舗',amount:100,type:'expense'};
const base = {transactions:[transaction],trash:[],activity:[]};
test('delete moves entry to trash',()=>{const d=deleteWithUndo(base,'t1');assert.equal(d.transactions.length,0);assert.equal(d.trash.length,1);assert.equal(d.activity[0].action,'deleted')});
test('restore recovers entry without deletion metadata',()=>{const d=restoreDeleted(deleteWithUndo(base,'t1'),'t1');assert.equal(d.transactions.length,1);assert.equal(d.transactions[0].deletedAt,undefined);assert.equal(d.trash.length,0)});
test('restoring missing item is no-op',()=>assert.equal(restoreDeleted(base,'absent'),base));
test('activity is bounded',()=>{let d=base;for(let i=0;i<210;i++)d=recordChange(d,'edit',transaction);assert.equal(d.activity.length,200)});
