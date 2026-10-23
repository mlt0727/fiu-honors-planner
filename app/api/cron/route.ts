import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';
import {sql,loadEvents,loadState} from '@/lib/db';
import {refreshPublicEvents} from '@/lib/refresh';
import {makeDraft} from '@/lib/reminders.mjs';
import {localDay} from '@/lib/core.mjs';
import items from '@/data/items.json';
export const maxDuration=60;
export async function GET(req:NextRequest){
  const supplied=Buffer.from(req.headers.get('authorization')||''),expected=Buffer.from(`Bearer ${process.env.CRON_SECRET||''}`);
  if(!process.env.CRON_SECRET||supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    let refreshResult:{updated?:number;error?:string};
    try{refreshResult=await refreshPublicEvents();}catch{refreshResult={error:'Source refresh failed; existing verified snapshot retained.'};}
    const users=await sql()`select user_id from honors_planner.preferences`;
    const events=await loadEvents(),now=new Date(),monday=new Date(localDay(now)+'T12:00:00Z').getUTCDay()===1;
    let prepared=0;
    for(const {user_id} of users){
      const state=await loadState(user_id);
      for(const kind of ['weekly','deadline']){
        if(kind==='weekly'&&(!monday||!state.preferences.weekly)||kind==='deadline'&&!state.preferences.deadlineReminders)continue;
        const draft=makeDraft(events,items,state.records,state.preferences,now,kind);
        if(!draft.eventIds.length)continue;
        const saved=await sql()`insert into honors_planner.drafts(user_id,key,data) values(${user_id},${draft.key},${JSON.stringify(draft)}) on conflict(user_id,key) do nothing returning key`;
        prepared+=saved.length;
      }
    }
    return NextResponse.json({refresh:refreshResult,draftsPrepared:prepared,emailsSent:0,mode:'review-required'});
  }catch{return NextResponse.json({error:'定时任务未完成，请检查数据库连接。'},{status:503});}
}
