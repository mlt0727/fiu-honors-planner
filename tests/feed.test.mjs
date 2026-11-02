import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed,matchOptions} from '../lib/feed.mjs';
import {makeDraft} from '../lib/reminders.mjs';
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
test('an event titled exactly like a Paths option is verified and enters email recommendations',()=>{
  const matches=parseFeed(xml(),[],[{id:'a',title:'Workshop',category:0,summary:'说明',mode:'event'}]);
  assert.equal(matches[0].creditVerified,true);assert.equal(matches[0].sourceNote,'活动标题与 Paths 选项完全一致。');
  assert.equal(makeDraft(matches,[{id:'a',category:0}],[],{email:'owner@example.com'},new Date('2026-10-23T20:00:00Z')).eventIds.length,1);
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
test('feed text decodes entities, drops the repeated title block, and events hosted by Honors College without a catalog match are not kept',()=>{
  const body=xml().replace('<![CDATA[','<![CDATA[<div class="p-name summary">Workshop</div><p>Nerve-wracking&mdash;but we&rsquo;ll help &#8220;you&#8221;</p>');
  const [match]=parseFeed(body,[],[{id:'a',title:'Workshop',category:0,summary:'说明',mode:'event'}]);
  assert.equal(match.summaryEn,'Nerve-wracking\u2014but we\u2019ll help \u201cyou\u201d x x GC 100');assert.ok(!match.description.startsWith('Workshop'));
  const hosted=xml().replace('<title>Workshop</title>','<title>Spring 2027 Course Showcase</title><host xmlns="events">FIU Honors College</host>');
  assert.deepEqual(parseFeed(hosted,[],[{id:'a',title:'Other',category:0,summary:'说明',mode:'event'}]),[]);
});
test('an option\'s own rule (host organization or Honors series) attributes feed events and marks them verified with a note',()=>{
  const items=[{id:'su',title:'StartUP FIU Events',category:1,summary:'创业',mode:'event'},{id:'cls',title:'Center for Leadership & Service Events',category:1,summary:'领导力',mode:'event'},{id:'ra',title:'Parkview RA Events (Personal & Social Wellness Topics)',category:2,summary:'RA',mode:'event'},{id:'hh',title:'Honors Hours: A,R &S',category:0,summary:'HH',mode:'event'},{id:'sa',title:'Honors Study Abroad - Instagram Lives',category:2,summary:'SA',mode:'event'},{id:'x',title:'Utilize Center for Excellence in Writing',category:0,summary:'写作',mode:'experience'}];
  const ids=(title,host)=>matchOptions(items,title,host).matched.map(i=>i.id);
  assert.deepEqual(ids('Pitch Night','StartUP FIU'),['su']);
  assert.deepEqual(ids('Service Day','Center for Leadership and Service (CLS) Programs'),['cls']);
  assert.deepEqual(ids('Game Night','Parkview RA'),['ra']);
  assert.deepEqual(ids('Honors Hours \u2014 HWCOM MPAS Session','FIU Honors College'),['hh']);
  assert.deepEqual(ids('Honors College Study Abroad Instagram Live - Italy Q&A','FIU Honors College'),['sa']);
  assert.deepEqual(ids('Honors Hours \u2014 Something','Some Other Club'),[]);
  assert.deepEqual(ids('Spring 2027 Course Showcase 1','FIU Honors College'),[]);
  const hosted=xml().replace('<title>Workshop</title>','<title>Pitch Night</title><host xmlns="events">StartUP FIU</host>');
  const [event]=parseFeed(hosted,[],items);
  assert.deepEqual(event.itemIds,['su']);assert.equal(event.category,1);assert.equal(event.creditVerified,true);assert.equal(event.host,'StartUP FIU');assert.match(event.sourceNote,/StartUP FIU Events/);
  assert.equal(makeDraft([event],items,[],{email:'owner@example.com'},new Date('2026-10-23T20:00:00Z')).eventIds.length,1);
});
test('an entry with several hosts keeps every host name and still matches an exact pathway title',()=>{
  const items=[{id:'stem',title:'STEM Faculty Panel & Brunch',category:0,summary:'座谈',mode:'event'},{id:'su',title:'StartUP FIU Events',category:1,summary:'创业',mode:'event'}];
  const body=xml().replace('<title>Workshop</title>','<title>STEM Faculty Panel &amp; Brunch</title><host xmlns="events">Phage Research Club</host><host xmlns="events">Undergraduate Research Society</host>');
  const [event]=parseFeed(body,[],items);
  assert.deepEqual(event.itemIds,['stem']);assert.equal(event.host,'Phage Research Club · Undergraduate Research Society');assert.equal(event.creditVerified,true);
  const byOrg=xml().replace('<title>Workshop</title>','<title>Pitch Night</title><host xmlns="events">Some Club</host><host xmlns="events">StartUP FIU</host>');
  assert.deepEqual(parseFeed(byOrg,[],items)[0].itemIds,['su']);
});
