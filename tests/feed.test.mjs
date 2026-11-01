import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed} from '../lib/feed.mjs';
import {makeDraft} from '../lib/reminders.mjs';
import {validateRecord} from '../lib/core.mjs';
const xml=(link='https://fiu.campuslabs.com/engage/event/42',start='2026-10-29T17:00:00.0000000-04:00')=>`<rss><channel><item><title>Workshop</title><link>${link}</link><description><![CDATA[<time class="dt-start dtstart" datetime="${start}">x</time><time class="dt-end dtend" datetime="2026-10-29T18:00:00-04:00">x</time><span class="p-location location">GC 100</span>]]></description></item></channel></rss>`;
test('public feed updates known IDs and preserves verified credit mapping',()=>{
  const result=parseFeed(xml(),[{id:'42',title:'Workshop',itemIds:['a'],category:0,summary:'中文简介',deadline:null}],[]);
  assert.equal(result.length,1);assert.equal(result[0].location,'GC 100');assert.equal(result[0].start,'2026-10-29T21:00:00.000Z');assert.equal(result[0].summary,'中文简介');assert.deepEqual(result[0].itemIds,['a']);
  assert.ok(result[0].description.includes('GC 100'));
});
test('feed rejects foreign URLs, malformed dates and oversized input',()=>{
  assert.deepEqual(parseFeed(xml('https://evil.example/engage/event/42'),[],[]),[]);
  assert.deepEqual(parseFeed(xml(undefined,'invalid'),[{id:'42'}],[]),[]);
  assert.throws(()=>parseFeed('x'.repeat(3_000_001),[],[]));
});
test('title-only matches remain unverified and do not enter email recommendations',()=>{
  const matches=parseFeed(xml(),[],[{id:'a',title:'Workshop',category:0,summary:'说明',mode:'event'}]);
  assert.equal(matches[0].creditVerified,false);
  assert.equal(makeDraft(matches,[{id:'a',category:0}],[],{email:'owner@example.com'},new Date('2026-10-23T20:00:00Z')).eventIds.length,0);
});
test('email excludes completed categories and labels start reminders independently of deadlines',()=>{
  const items=[{id:'a',category:0},{id:'b',category:0},{id:'c',category:1}];
  const events=[{id:'42',title:'A',itemIds:['a'],category:0,start:'2026-10-29T17:00:00-04:00',location:'GC'},{id:'43',title:'B',itemIds:['c'],category:1,start:'2026-10-29T17:00:00-04:00',location:'GC'}];
  const records=[{itemId:'a',status:'attended'},{itemId:'b',status:'accepted'}];
  const draft=makeDraft(events,items,records,{email:'owner@example.com',eventFallback:true},new Date('2026-10-24T14:00:00Z'),'deadline');
  assert.deepEqual(draft.eventIds,['43']);assert.match(draft.body,/这不是报名截止提醒/);assert.match(draft.body,/官方未公布/);
});
test('a cross-category event recommends its remaining eligible credit option',()=>{
  const items=[{id:'a',category:0,canonical:'lecture'},{id:'b',category:1,canonical:'career'}];
  const event={id:'e',title:'UK info',itemIds:['a','b'],category:0,start:'2026-10-29T17:00:00-04:00',location:'DM'};
  const draft=makeDraft([event],items,[{itemId:'a',eventKey:'item:lecture',status:'attended'}],{email:'owner@example.com'},new Date('2026-10-23T20:00:00Z'));
  assert.match(draft.body,/分类：职业发展/);assert.doesNotMatch(draft.body,/分类：学术与研究/);
});
test('events hosted by FIU Honors College are kept without a catalog match, stay unverified and may be attributed to any option',()=>{
  const hosted=xml().replace('<title>Workshop</title>','<title>Honors Career Essentials: Interviewing</title><host xmlns="events">FIU Honors College</host>').replace('<![CDATA[','<![CDATA[<div class="p-name summary">Honors Career Essentials: Interviewing</div><p>Interviews can be nerve-wracking&mdash;but we&rsquo;ll help &#8220;you&#8221;</p>');
  const items=[{id:'a',title:'Other',category:1,summary:'说明',mode:'event'}];
  const result=parseFeed(hosted,[],items);
  assert.equal(result.length,1);assert.deepEqual(result[0].itemIds,[]);assert.equal(result[0].category,null);assert.equal(result[0].creditVerified,false);assert.equal(result[0].host,'FIU Honors College');assert.match(result[0].sourceNote,/Paths/);assert.equal(result[0].summary,'Interviews can be nerve-wracking\u2014but we\u2019ll help \u201cyou\u201d x x GC 100');
  assert.deepEqual(parseFeed(xml().replace('<title>Workshop</title>','<title>Yoga</title><host xmlns="events">Rec Center</host>'),[],items),[]);
  assert.equal(makeDraft(result,items,[],{email:'owner@example.com'},new Date('2026-10-23T20:00:00Z')).eventIds.length,0);
  assert.equal(validateRecord({itemId:'a',eventKey:'event:42',status:'planned'},items,result).itemId,'a');
});
