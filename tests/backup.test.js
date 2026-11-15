import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBackup,parseBackup} from '../src/backup.js';
const sample={members:['A','B'],transactions:[{id:'1',date:'2026-11-12',merchant:'スーパー',amount:1000,type:'expense'}],goals:[],rules:[],settings:{shareRatio:50}};
test('backup roundtrip',()=>assert.deepEqual(parseBackup(makeBackup(sample)),sample));
test('reject arbitrary JSON',()=>assert.throws(()=>parseBackup('{"hello":1}')));
test('reject invalid transactions',()=>assert.throws(()=>makeBackup({...sample,transactions:[{id:'x',amount:-1}]})));
test('reject oversized backups',()=>assert.throws(()=>parseBackup('x'.repeat(5_000_001))));
