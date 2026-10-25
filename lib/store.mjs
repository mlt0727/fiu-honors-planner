import {validatePreferences} from './accounts.mjs';
export async function loadUserState(sql,userId,defaults){
  const [records,prefs,drafts]=await Promise.all([
    sql`select item_id as "itemId",event_key as "eventKey",category,status,note,completed_date as date,revision,deadline from honors_planner.records where user_id=${userId}`,
    sql`select data,revision from honors_planner.preferences where user_id=${userId}`,
    sql`select data from honors_planner.drafts where user_id=${userId} order by created_at desc limit 30`
  ]);
  return {records,preferences:{...defaults,...prefs[0]?.data,revision:prefs[0]?.revision||0},drafts:drafts.map(r=>r.data)};
}
export async function saveUserPreferences(sql,user,p){
  const data=validatePreferences(p,user.email);
  const saved=await sql`insert into honors_planner.preferences(user_id,data) values(${user.id},${JSON.stringify(data)}) on conflict(user_id) do update set data=excluded.data,revision=honors_planner.preferences.revision+1 where honors_planner.preferences.revision=${p.revision} returning revision`;
  return saved[0]||null;
}
export async function upsertRecord(sql,user,r,defaults){
  const saved=await sql`insert into honors_planner.records(user_id,event_key,item_id,category,status,note,completed_date,deadline) values(${user.id},${r.eventKey},${r.itemId},${r.category},${r.status},${r.note},${r.date},${r.deadline||''}) on conflict(user_id,event_key) do update set item_id=excluded.item_id,category=excluded.category,status=excluded.status,note=excluded.note,completed_date=excluded.completed_date,deadline=excluded.deadline,revision=honors_planner.records.revision+1,updated_at=now() where honors_planner.records.revision=${r.expectedRevision} returning revision`;
  if(!saved.length)return null;
  const prefs=await sql`insert into honors_planner.preferences(user_id,data) values(${user.id},${JSON.stringify({...defaults,email:user.email})}) on conflict(user_id) do update set user_id=excluded.user_id returning data,revision`;
  return {revision:saved[0].revision,preferences:{...defaults,...prefs[0].data,revision:prefs[0].revision}};
}
