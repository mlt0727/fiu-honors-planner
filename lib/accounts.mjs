export function verifiedUser(session){
  const user=session?.user;
  return user?.id&&user.email&&user.emailVerified===true?user:null;
}
export function validatePreferences(p,email){
  if(!p||!Number.isFinite(p.hours)||p.hours<0||p.hours>10000||typeof p.weekly!=='boolean'||typeof p.deadlineReminders!=='boolean'||typeof p.eventFallback!=='boolean'||!Number.isInteger(p.revision)||p.language!==undefined&&!['zh','en'].includes(p.language))throw Error('无效的设置');
  return {hours:p.hours,weekly:p.weekly,deadlineReminders:p.deadlineReminders,eventFallback:p.eventFallback,language:p.language||'zh',email};
}
export function validateOtpRequest(body,verify){
  const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw Error('Invalid email address.');
  if(verify){if(typeof body.otp!=='string'||!/^\d{6}$/.test(body.otp))throw Error('Enter a six-digit code.');return {email,otp:body.otp};}
  if(body.type!=='sign-in')throw Error('Only sign-in codes are supported.');
  return {email,type:'sign-in'};
}
