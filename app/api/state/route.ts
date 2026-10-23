import {NextRequest,NextResponse} from 'next/server';
import {ownerSession} from '@/lib/auth';
import {loadState,sql,defaults} from '@/lib/db';
import items from '@/data/items.json';
import {validateRecord,sameOrigin} from '@/lib/core.mjs';

export const dynamic='force-dynamic';
export async function GET(){
  try{
    const user=await ownerSession();
    if(!user)return NextResponse.json({records:[],preferences:defaults,drafts:[],session:null});
    const state=await loadState(user.id);
    const sync=await sql()`select last_success as "lastSuccess",last_attempt as "lastAttempt",error from honors_planner.sync_log where id=true`;
    return NextResponse.json({...state,preferences:{...state.preferences,email:state.preferences.email||user.email},session:{email:user.email,verified:true},sync:sync[0]||{lastSuccess:null,lastAttempt:null,error:null}},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'无法读取云端数据，请稍后重试。'},{status:503});}
}
export async function POST(req:NextRequest){
  try{
    if(!sameOrigin(req.headers))return NextResponse.json({error:'无效来源'},{status:403});
    const user=await ownerSession();
    if(!user)return NextResponse.json({error:'请先使用所有者邮箱登录并完成邮箱验证。'},{status:401});
    if(Number(req.headers.get('content-length'))>15000)return NextResponse.json({error:'请求过大'},{status:413});
    const body=await req.json();
    if(body.type==='record'){
      const r=validateRecord(body.record,items);
      const saved=await sql()`insert into honors_planner.records(user_id,event_key,item_id,category,status,note,completed_date) values(${user.id},${r.eventKey},${r.itemId},${r.category},${r.status},${r.note},${r.date}) on conflict(user_id,event_key) do update set item_id=excluded.item_id,category=excluded.category,status=excluded.status,note=excluded.note,completed_date=excluded.completed_date,revision=honors_planner.records.revision+1,updated_at=now() where honors_planner.records.revision=${r.expectedRevision} returning revision`;
      if(!saved.length)return NextResponse.json({error:'另一台设备已经修改这条记录。请刷新后重试。'},{status:409});
      await sql()`insert into honors_planner.preferences(user_id,data) values(${user.id},${JSON.stringify({...defaults,email:user.email})}) on conflict(user_id) do nothing`;
      return NextResponse.json({revision:saved[0].revision});
    }
    if(body.type==='preferences'){
      const p=body.preferences;
      if(!p||!Number.isFinite(p.hours)||p.hours<0||p.hours>10000||typeof p.weekly!=='boolean'||typeof p.deadlineReminders!=='boolean'||typeof p.eventFallback!=='boolean'||!Number.isInteger(p.revision))throw Error('无效的设置');
      // Personal reminder recipients stay locked to the authenticated owner.
      const data={hours:p.hours,weekly:p.weekly,deadlineReminders:p.deadlineReminders,eventFallback:p.eventFallback,email:user.email};
      const saved=await sql()`insert into honors_planner.preferences(user_id,data) values(${user.id},${JSON.stringify(data)}) on conflict(user_id) do update set data=excluded.data,revision=honors_planner.preferences.revision+1 where honors_planner.preferences.revision=${p.revision} returning revision`;
      if(!saved.length)return NextResponse.json({error:'设置已在另一台设备更改，请刷新。'},{status:409});
      return NextResponse.json({revision:saved[0].revision});
    }
    throw Error('未知操作');
  }catch(e){return NextResponse.json({error:e instanceof Error&&/无效|最多|未知/.test(e.message)?e.message:'保存失败，你的更改仍保留在当前页面，请重试。'},{status:400});}
}
