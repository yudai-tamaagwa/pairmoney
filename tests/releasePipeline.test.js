import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/publish-demo.yml',import.meta.url),'utf8');
const config=readFileSync(new URL('../playwright.config.js',import.meta.url),'utf8');
test('production build precedes browser tests',()=>{
  assert.ok(workflow.indexOf('Build production demo for browser testing') < workflow.indexOf('Test production demo on desktop and mobile'));
});
test('browser tests run against built preview, not development server',()=>{
  assert.match(config,/npm run preview/);
  assert.doesNotMatch(config,/npm run dev/);
});
test('pages release is built after successful browser tests',()=>{
  assert.ok(workflow.indexOf('Test production demo on desktop and mobile') < workflow.indexOf('Build GitHub Pages release'));
  assert.ok(workflow.indexOf('Build GitHub Pages release') < workflow.indexOf('upload-pages-artifact'));
});
