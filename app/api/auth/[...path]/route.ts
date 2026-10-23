import {auth} from '@/lib/auth';
import {NextRequest,NextResponse} from 'next/server';
const handlers=auth.handler();
export const GET=handlers.GET;
export async function POST(req:NextRequest,context:{params:Promise<{path:string[]}>}){
  if(['/sign-up/email','/email-otp/verify-email','/email-otp/send-verification-otp'].some(path=>req.nextUrl.pathname.endsWith(path))){
    const body=await req.clone().json().catch(()=>null);
    if(body?.email?.toLowerCase()!==process.env.OWNER_EMAIL?.toLowerCase())return NextResponse.json({message:'这是私人网站，仅限所有者邮箱使用。'},{status:403});
  }
  return handlers.POST(req,context);
}
