import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
import {upsertRecord} from '../lib/store.mjs';
const first=neon(process.env.DATABASE_URL),second=neon(process.env.DATABASE_URL);
const id='qa-disposable:'+randomUUID(),user={id,email:'qa@invalid.example'};
const defaults={hours:0,weekly:true,deadlineReminders:true,eventFallback:false};
const record={itemId:'96742',eventKey:'item:qa-disposable',category:0,status:'planned',note:'Disposable integration check',date:'',expectedRevision:0};
try{
  const saved=await upsertRecord(first,user,record,defaults);
  assert.equal(saved.preferences.revision,1);
  const read=await second`select status,revision from honors_planner.records where user_id=${id} and event_key=${record.eventKey}`;
  assert.equal(read[0].status,'planned');assert.equal(read[0].revision,1);
  const prefs=await second`update honors_planner.preferences set data=${JSON.stringify({...defaults,hours:3})},revision=revision+1 where user_id=${id} and revision=${saved.preferences.revision} returning revision`;
  assert.equal(prefs[0].revision,2);
  const results=await Promise.all([upsertRecord(first,user,{...record,status:'attended',expectedRevision:1},defaults),upsertRecord(second,user,{...record,status:'accepted',expectedRevision:1},defaults)]);
  assert.equal(results.filter(Boolean).length,1);assert.equal(results.find(Boolean).preferences.hours,3);assert.equal(results.find(Boolean).preferences.revision,2);
  const isolated=await second`select count(*)::int as count from honors_planner.records where user_id=${id+'other'}`;
  assert.equal(isolated[0].count,0);
  console.log('PASS: independent connections read saved data; first-save preferences stay editable; stale writes conflict; existing preferences survive record saves; user scope remains isolated.');
}finally{
  await first`delete from honors_planner.records where user_id=${id}`;
  await first`delete from honors_planner.preferences where user_id=${id}`;
  console.log('Disposable integration records removed.');
}
