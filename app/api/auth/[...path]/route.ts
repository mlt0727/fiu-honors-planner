import {auth} from '@/lib/auth';
import {NextRequest,NextResponse} from 'next/server';
import {sameOrigin} from '@/lib/core.mjs';
import {validateOtpRequest} from '@/lib/accounts.mjs';
const handlers=auth.handler();
export const GET=handlers.GET;
export async function POST(req:NextRequest,context:{params:Promise<{path:string[]}>}){
  if(!sameOrigin(req.headers))return NextResponse.json({message:'Invalid origin'},{status:403});
  const path=(await context.params).path.join('/');
  if(path==='sign-out')return handlers.POST(req,context);
  if(!['email-otp/send-verification-otp','sign-in/email-otp'].includes(path))return NextResponse.json({message:'Use email code sign-in.'},{status:405});
  if(Number(req.headers.get('content-length'))>2048)return NextResponse.json({message:'Request too large.'},{status:413});
  try{
    const input=await req.text();
    if(input.length>2048)return NextResponse.json({message:'Request too large.'},{status:413});
    const body=validateOtpRequest(JSON.parse(input),path==='sign-in/email-otp');
    const headers=new Headers(req.headers);headers.delete('content-length');
    return handlers.POST(new NextRequest(req.url,{method:'POST',headers,body:JSON.stringify(body)}),context);
  }catch{return NextResponse.json({message:'Enter a valid email address and six-digit code.',code:'INVALID_INPUT'},{status:400});}
}
