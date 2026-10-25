import {neon} from '@neondatabase/serverless';
import seed from '@/data/events.json';
import type {Event,Preferences} from './types';
import {loadUserState} from './store.mjs';

export const sql=()=>neon(process.env.DATABASE_URL!);
export const defaults:Preferences={hours:0,weekly:true,deadlineReminders:true,eventFallback:false,email:'',revision:0,language:'zh'};
export async function loadEvents():Promise<Event[]>{
  const cached=await sql()`select data from honors_planner.events`;
  const map=new Map(seed.map(e=>[e.id,e as Event]));
  for(const row of cached)map.set(row.data.id,{...seed.find(e=>e.id===row.data.id),...row.data,title:seed.find(e=>e.id===row.data.id)?.title||row.data.title});
  return [...map.values()];
}
export async function loadState(userId:string){
  return loadUserState(sql(),userId,defaults);
}
