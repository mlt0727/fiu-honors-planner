import {neon} from '@neondatabase/serverless';
import seed from '@/data/events.json';
import type {Event,Preferences} from './types';

export const sql=()=>neon(process.env.DATABASE_URL!);
export const defaults:Preferences={hours:0,weekly:true,deadlineReminders:true,eventFallback:false,email:'',revision:0};
export async function loadEvents():Promise<Event[]>{
  const cached=await sql()`select data from honors_planner.events`;
  const map=new Map(seed.map(e=>[e.id,e as Event]));
  for(const row of cached)map.set(row.data.id,row.data);
  return [...map.values()];
}
export async function loadState(userId:string){
  const [records,prefs,drafts]=await Promise.all([
    sql()`select item_id as "itemId",event_key as "eventKey",category,status,note,completed_date as date,revision from honors_planner.records where user_id=${userId}`,
    sql()`select data,revision from honors_planner.preferences where user_id=${userId}`,
    sql()`select data from honors_planner.drafts where user_id=${userId} order by created_at desc limit 30`
  ]);
  return {records,preferences:{...defaults,...prefs[0]?.data,revision:prefs[0]?.revision||0},drafts:drafts.map(r=>r.data)};
}
