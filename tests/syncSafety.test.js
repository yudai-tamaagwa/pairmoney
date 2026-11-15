import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySyncError, canReloadRemote, syncLabel } from '../src/syncSafety.js';
test('version conflicts are never mistaken for a network error',()=>assert.equal(classifySyncError({message:'Version conflict: another device has newer changes'}),'conflict'));
test('network errors are distinguished',()=>assert.equal(classifySyncError(new Error('Failed to fetch')),'network'));
test('permission errors are distinguished',()=>assert.equal(classifySyncError(new Error('Not authorized')),'permission'));
test('remote reload requires clean idle state',()=>{
 assert.equal(canReloadRemote({pending:null,writing:false,blocked:false}),true);
 assert.equal(canReloadRemote({pending:{},writing:false,blocked:false}),false);
 assert.equal(canReloadRemote({pending:null,writing:true,blocked:false}),false);
 assert.equal(canReloadRemote({pending:null,writing:false,blocked:true}),false);
});
test('sync state has human readable label',()=>assert.equal(syncLabel('error'),'同期停止'));
