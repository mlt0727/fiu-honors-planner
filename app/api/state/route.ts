import {NextRequest,NextResponse} from 'next/server';
import {userSession} from '@/lib/auth';
import {loadState,loadEvents,sql,defaults} from '@/lib/db';
import {upsertRecord,saveUserPreferences} from '@/lib/store.mjs';
import items from '@/data/items.json';
import {validateRecord,sameOrigin} from '@/lib/core.mjs';

export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  try{
    const user=await userSession();
    if(!user)return NextResponse.json({records:[],preferences:defaults,drafts:[],session:null},{headers:{'Cache-Control':'no-store'}});
    const language=req.nextUrl.searchParams.get('language')==='en'?'en':'zh';
    await sql()`insert into honors_planner.preferences(user_id,data) values(${user.id},${JSON.stringify({...defaults,email:user.email,language})}) on conflict(user_id) do nothing`;
    const state=await loadState(user.id);
    const sync=await sql()`select last_success as "lastSuccess",last_attempt as "lastAttempt",error from honors_planner.sync_log where id=true`;
    return NextResponse.json({...state,preferences:{...state.preferences,email:state.preferences.email||user.email},session:{email:user.email,verified:true},sync:sync[0]||{lastSuccess:null,lastAttempt:null,error:null}},{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'无法读取云端数据，请稍后重试。'},{status:503});}
}
export async function POST(req:NextRequest){
  try{
    if(!sameOrigin(req.headers))return NextResponse.json({error:'无效来源'},{status:403});
    const user=await userSession();
    if(!user)return NextResponse.json({error:'请先通过邮箱验证码登录。'},{status:401});
    if(Number(req.headers.get('content-length'))>15000)return NextResponse.json({error:'请求过大'},{status:413});
    const body=await req.json();
    if(body.accountEmail!==user.email)return NextResponse.json({error:'账号已更改，请刷新后重试。'},{status:409});
    if(body.type==='record'){
      const r=validateRecord(body.record,items,body.record?.eventKey?.startsWith('event:')?await loadEvents():[]);
      const saved=await upsertRecord(sql(),user,r,defaults);
      if(!saved)return NextResponse.json({error:'另一台设备已经修改这条记录。请刷新后重试。'},{status:409});
      return NextResponse.json(saved);
    }
    if(body.type==='preferences'){
      const p=body.preferences;
      const saved=await saveUserPreferences(sql(),user,p);
      if(!saved)return NextResponse.json({error:'设置已在另一台设备更改，请刷新。'},{status:409});
      return NextResponse.json(saved);
    }
    throw Error('未知操作');
  }catch(e){return NextResponse.json({error:e instanceof Error&&/无效|最多|未知/.test(e.message)?e.message:'保存失败，你的更改仍保留在当前页面，请重试。'},{status:400});}
}
