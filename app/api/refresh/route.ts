import {NextRequest,NextResponse} from 'next/server';
import {userSession} from '@/lib/auth';
import {refreshPublicEvents} from '@/lib/refresh';
import {sameOrigin} from '@/lib/core.mjs';
export async function POST(req:NextRequest){
  if(!sameOrigin(req.headers))return NextResponse.json({error:'无效来源'},{status:403});
  if(!await userSession())return NextResponse.json({error:'请先登录。'},{status:401});
  try{return NextResponse.json(await refreshPublicEvents());}catch{return NextResponse.json({error:'官方公开活动源刷新失败，已保留快照。'},{status:502});}
}
