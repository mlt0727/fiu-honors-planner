import {test} from 'node:test';
import assert from 'node:assert/strict';
import {progress, recommend, dueReminder, localDay, validateRecord, normalizeTitle,sameOrigin,eligible,quickPlanStatus,validateBackup,newYorkTimestamp,formatTime} from '../lib/core.mjs';

test('displayed dates include the weekday in New York, including the previous UTC day',()=>{
  assert.match(formatTime('2026-10-27T19:30:00Z'),/10月27日.*周二.*15:30/);
  assert.match(formatTime('2026-10-27T00:30:00Z'),/10月26日.*周一.*20:30/);
  assert.match(formatTime('2026-10-27T19:30:00Z','en'),/Tue.*Oct.*27.*15:30/);
});

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
test('canonical item completion and item dismissal suppress linked events across aliases',()=>{
  const catalog=[{id:'a',canonical:'lecture',category:0},{id:'alias',canonical:'lecture',category:0}];
  const event={id:'e',itemIds:['alias'],category:0,start:'2026-10-29T17:00:00-04:00'};
  const now=new Date('2026-10-23T20:00:00Z');
  assert.equal(eligible(event,catalog,[{itemId:'a',eventKey:'item:lecture',status:'dismissed'}],now),false);
  assert.equal(eligible(catalog[1],catalog,[{itemId:'a',eventKey:'event:another',status:'attended'}],now),false);
  assert.equal(eligible(event,catalog,[{itemId:'a',eventKey:'event:another',status:'dismissed'}],now),true);
  assert.equal(eligible({...event,start:'2026-09-01T10:00:00-04:00'},catalog,[],now),false);
});
test('quick plan toggle preserves completed and dismissed records',()=>{
  assert.equal(quickPlanStatus('none'),'planned');assert.equal(quickPlanStatus('planned'),'none');
  for(const status of ['attended','accepted','dismissed'])assert.equal(quickPlanStatus(status),status);
});
test('record attribution must match canonical item key or a real allowed event',()=>{
  const catalog=[{id:'a',category:0,canonical:'lecture'},{id:'b',category:1,canonical:'career'}];
  const events=[{id:'e',itemIds:['a']}];
  assert.throws(()=>validateRecord({itemId:'b',eventKey:'event:e',status:'attended'},catalog,events));
  assert.throws(()=>validateRecord({itemId:'a',eventKey:'item:career',status:'attended'},catalog,events));
  assert.throws(()=>validateRecord({itemId:'a',date:'2026-02-30',status:'attended'},catalog,events));
  assert.equal(validateRecord({itemId:'a',eventKey:'event:e',status:'attended'},catalog,events).eventKey,'event:e');
});
test('backup restore rejects malformed or duplicate records and uses current revision',()=>{
  const catalog=[{id:'a',category:0,canonical:'lecture'}];
  const r={itemId:'a',eventKey:'item:lecture',status:'accepted',revision:999};
  assert.throws(()=>validateBackup({version:2,records:[]},catalog,[],[]));
  assert.throws(()=>validateBackup({version:1,records:[r,r]},catalog,[],[]));
  assert.equal(validateBackup({version:1,records:[r]},catalog,[],[{eventKey:'item:lecture',revision:3}])[0].expectedRevision,3);
});
test('manually entered deadlines use New York wall time across daylight saving',()=>{
  assert.equal(newYorkTimestamp('2026-10-29T17:00'),'2026-10-29T21:00:00.000Z');
  assert.equal(newYorkTimestamp('2026-11-03T10:00'),'2026-11-03T15:00:00.000Z');
  assert.throws(()=>newYorkTimestamp('2027-03-14T02:30'));
  assert.throws(()=>validateRecord({itemId:'a',status:'planned',deadline:'not-a-date'},items));
});
