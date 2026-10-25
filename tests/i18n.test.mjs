import {test} from 'node:test';
import assert from 'node:assert/strict';
import {categoryNames,summaryFor,text,sourceNoteFor} from '../lib/i18n.mjs';
import {makeDraft} from '../lib/reminders.mjs';
test('language changes labels, categories and original descriptions without changing the source',()=>{
  assert.equal(text('查看详情','en'),'View details');
  assert.equal(text('查看详情','zh'),'查看详情');
  assert.equal(text('{seconds} 秒后可重发','en',{seconds:12}),'Resend in 12s');
  assert.equal(categoryNames('en').length,4);
  const item={summary:'中文介绍',description:'Original official description.'};
  assert.equal(summaryFor(item,'en'),'Original official description.');assert.equal(summaryFor(item,'zh'),'中文介绍');
  assert.doesNotMatch(sourceNoteFor('标题匹配待核实','en'),/[\u3400-\u9fff]/);
});
test('each account receives its own language and progress filtered reminder',()=>{
  const items=[{id:'a',category:0},{id:'b',category:0}],events=[{id:'e',title:'Workshop',itemIds:['a'],category:0,summary:'中文简介',summaryEn:'Meet the advising team.',start:'2026-10-27T19:30:00Z',end:null,location:'Online',sourceUrl:'https://fiu.campuslabs.com/engage/event/42'}];
  const a=makeDraft(events,items,[{itemId:'a',eventKey:'one',status:'attended'},{itemId:'b',eventKey:'two',status:'accepted'}],{language:'zh',email:'a@example.com'},new Date('2026-10-25T16:00:00Z'));
  const b=makeDraft(events,items,[],{language:'en',email:'b@example.com'},new Date('2026-10-25T16:00:00Z'));
  assert.equal(a.eventIds.length,0);assert.equal(b.to,'b@example.com');assert.deepEqual(b.eventIds,['e']);
  assert.match(b.body,/Tue.*Oct.*27.*15:30/);assert.match(b.body,/Meet the advising team/);assert.doesNotMatch(b.body,/[\u3400-\u9fff]/);
});
