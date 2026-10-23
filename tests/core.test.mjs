import {test} from 'node:test';
import assert from 'node:assert/strict';
import {progress, recommend, dueReminder, localDay, validateRecord, normalizeTitle,sameOrigin} from '../lib/core.mjs';

const items=[{id:'a',category:0,canonical:'advisor'},{id:'b',category:0,canonical:'research'},{id:'c',category:0,canonical:'advisor'},{id:'d',category:1,canonical:'career'}];
const record=(itemId,eventKey,status='attended')=>({itemId,eventKey,status,category:items.find(i=>i.id===itemId).category});
test('two distinct experiences fill a category; duplicate options and events do not',()=>{
  assert.deepEqual(progress(items,[record('a','same'),record('b','same')]).attended,[1,0,0,0]);
  assert.deepEqual(progress(items,[record('a','e1'),record('c','e2')]).attended,[1,0,0,0]);
  const p=progress(items,[record('a','e1'),record('b','e2','accepted'),record('c','e3','planned')]);
  assert.deepEqual(p.attended,[2,0,0,0]); assert.deepEqual(p.accepted,[1,0,0,0]);
  assert.deepEqual(recommend(items,[],[record('a','e1'),record('b','e2')],new Date()).map(i=>i.id),['d']);
});
test('recommendations reject past, dismissed and ineligible spring-only opportunities',()=>{
  const opportunities=[{id:'old',category:1,start:'2026-10-01T10:00:00-04:00'},{id:'new',category:1,start:'2026-10-30T10:00:00-04:00'},{id:'spring',category:1,semester:'spring'}];
  assert.deepEqual(recommend(opportunities,[],[{itemId:'new',status:'dismissed'}],new Date('2026-10-23T12:00:00Z')).map(i=>i.id),[]);
});
test('five calendar days before registration deadline, never confuse unknown deadline with start',()=>{
  assert.equal(dueReminder({deadline:'2026-10-29T17:00:00-04:00'},new Date('2026-10-24T13:00:00Z'))?.kind,'deadline');
  assert.equal(dueReminder({start:'2026-10-29T17:00:00-04:00'},new Date('2026-10-24T13:00:00Z')),null);
  assert.equal(dueReminder({start:'2026-11-03T10:00:00-05:00'},new Date('2026-10-29T13:00:00Z'),true)?.kind,'event');
  assert.equal(dueReminder({deadline:'2026-10-28T17:00:00-04:00'},new Date('2026-10-24T13:00:00Z')),null);
});
test('New York calendar dates survive DST changes and midnight UTC',()=>{
  assert.equal(localDay(new Date('2026-11-01T03:30:00Z')),'2026-10-31');
  assert.equal(localDay(new Date('2026-11-01T06:30:00Z')),'2026-11-01');
});
test('trust boundary rejects unknown items, invalid statuses, oversized notes and nonfinite hours',()=>{
  assert.throws(()=>validateRecord({itemId:'unknown',status:'attended'},items));
  assert.throws(()=>validateRecord({itemId:'a',status:'administrator'},items));
  assert.throws(()=>validateRecord({itemId:'a',status:'attended',note:'a'.repeat(2001)},items));
  assert.equal(validateRecord({itemId:'a',status:'attended'},items).category,0);
});
test('duplicate title normalization tolerates whitespace and punctuation without losing semester',()=>{
  assert.equal(normalizeTitle('Honors Hours: A,R &S'),'honors hours a r s');
  assert.notEqual(normalizeTitle('Advisor (Spring)'),normalizeTitle('Advisor (Fall)'));
});
test('origin validation uses the external host, including a development port',()=>{
  assert.equal(sameOrigin(new Headers({origin:'http://127.0.0.1:3000',host:'127.0.0.1:3000'})),true);
  assert.equal(sameOrigin(new Headers({origin:'https://planner.vercel.app',host:'planner.vercel.app'})),true);
  assert.equal(sameOrigin(new Headers({origin:'https://evil.example',host:'planner.vercel.app'})),false);
  assert.equal(sameOrigin(new Headers({host:'planner.vercel.app'})),false);
});
