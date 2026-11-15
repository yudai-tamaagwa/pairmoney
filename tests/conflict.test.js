import test from 'node:test';
import assert from 'node:assert/strict';
import {compareHouseholds,canDiscardLocal} from '../src/conflict.js';
const base=()=>({members:['自分','相手'],transactions:[{id:'1',date:'2026-11-01',merchant:'店',amount:100,type:'expense'}],goals:[],rules:[],settings:{shareRatio:50}});
test('差分がなければ件数はゼロ',()=>{const a=base();assert.deepEqual(compareHouseholds(a,structuredClone(a)).transactions,{onlyLocal:0,onlyRemote:0,changed:0})});
test('追加と変更を区別',()=>{const a=base(),b=base();a.transactions[0].amount=200;b.transactions.push({id:'2',date:'2026-11-02',merchant:'別',amount:100,type:'expense'});assert.deepEqual(compareHouseholds(a,b).transactions,{onlyLocal:0,onlyRemote:1,changed:1})});
test('設定変更を検出',()=>{const a=base(),b=base();b.settings.shareRatio=60;assert.equal(compareHouseholds(a,b).settingsChanged,true)});
test('バックアップなしで破棄不可',()=>{assert.equal(canDiscardLocal({blocked:true,writing:false,hasBackup:false}),false);assert.equal(canDiscardLocal({blocked:true,writing:false,hasBackup:true}),true);assert.equal(canDiscardLocal({blocked:true,writing:true,hasBackup:true}),false)});
test('不正データを比較しない',()=>assert.throws(()=>compareHouseholds({},base())));
