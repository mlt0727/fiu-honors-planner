import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {neon} from '@neondatabase/serverless';
import {upsertRecord,loadUserState,saveUserPreferences} from '../lib/store.mjs';
const first=neon(process.env.DATABASE_URL),second=neon(process.env.DATABASE_URL);
const id='qa-disposable:'+randomUUID(),users=[{id,email:'qa-a@invalid.example'},{id:id+':b',email:'qa-b@invalid.example'}];
const defaults={hours:0,weekly:true,deadlineReminders:true,eventFallback:false,language:'zh'};
const record={itemId:'96742',eventKey:'item:qa-disposable',category:0,status:'planned',note:'Account A',date:'',expectedRevision:0};
try{
  const saved=await upsertRecord(first,users[0],record,defaults);
  assert.equal(saved.preferences.revision,1);
  await upsertRecord(second,users[1],{...record,status:'dismissed',note:'Account B'},defaults);
  await saveUserPreferences(first,users[0],{...defaults,language:'en',hours:3,email:users[1].email,revision:1});
  await saveUserPreferences(second,users[1],{...defaults,language:'zh',hours:7,revision:1});
  for(const [i,user] of users.entries())await first`insert into honors_planner.drafts(user_id,key,data) values(${user.id},'qa-same-key',${JSON.stringify({to:user.email,body:'Private draft '+i})})`;
  const [a,b]=await Promise.all(users.map(user=>loadUserState(second,user.id,defaults)));
  assert.equal(a.records[0].note,'Account A');assert.equal(b.records[0].note,'Account B');
  assert.equal(a.records[0].status,'planned');assert.equal(b.records[0].status,'dismissed');
  assert.equal(a.preferences.language,'en');assert.equal(b.preferences.language,'zh');
  assert.equal(a.preferences.hours,3);assert.equal(b.preferences.hours,7);
  assert.equal(a.preferences.email,users[0].email);assert.equal(b.preferences.email,users[1].email);
  assert.equal(a.drafts[0].to,users[0].email);assert.equal(b.drafts[0].to,users[1].email);
  const concurrent=await Promise.all([upsertRecord(first,users[0],{...record,status:'attended',expectedRevision:1},defaults),upsertRecord(second,users[0],{...record,status:'accepted',expectedRevision:1},defaults)]);
  assert.equal(concurrent.filter(Boolean).length,1);assert.equal(concurrent.find(Boolean).preferences.language,'en');assert.equal(concurrent.find(Boolean).preferences.hours,3);
  assert.equal(await saveUserPreferences(first,users[0],{...defaults,revision:1}),null);
  console.log('PASS: two independent users keep separate records, progress inputs, hours, language, recipients and drafts; independent connections restore them; stale writes conflict.');
}finally{
  for(const user of users){
    await first`delete from honors_planner.records where user_id=${user.id}`;
    await first`delete from honors_planner.preferences where user_id=${user.id}`;
    await first`delete from honors_planner.drafts where user_id=${user.id}`;
  }
  console.log('Disposable integration records removed.');
}
