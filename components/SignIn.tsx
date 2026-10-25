'use client';
import {useEffect,useState} from 'react';
import {isAuthError} from '@neondatabase/auth/next';
import {authClient} from '@/lib/auth-client';
import {useI18n} from './Locale';
export default function SignIn({onAuthenticated,onClose}:{onAuthenticated:()=>Promise<void>;onClose:()=>void}){
  const {t}=useI18n();
  const [email,setEmail]=useState(''),[otp,setOtp]=useState(''),[step,setStep]=useState('email'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[cooldown,setCooldown]=useState(0);
  useEffect(()=>{if(cooldown<=0)return;const timer=setTimeout(()=>setCooldown(cooldown-1),1000);return()=>clearTimeout(timer);},[cooldown]);
  function failed(error:unknown){setMessage(isAuthError(error)?t(error.message):error instanceof Error?t(error.message):t('登录服务暂时不可用，请稍后重试。'));}
  async function send(){
    setBusy(true);setMessage('');
    try{const result=await authClient.emailOtp.sendVerificationOtp({email:email.trim().toLowerCase(),type:'sign-in'});if(result.error)throw Error(result.error.message);setStep('code');setOtp('');setCooldown(60);setMessage(t('验证码已发送，请查看邮箱并输入最新的六位数字。'));}
    catch(error){failed(error);}finally{setBusy(false);}
  }
  async function submit(event:React.FormEvent){
    event.preventDefault();if(step==='email'){await send();return;}
    setBusy(true);setMessage('');
    try{
      const result=await authClient.signIn.emailOtp({email:email.trim().toLowerCase(),otp});
      if(result.error)throw Error(result.error.message);
      const response=await fetch('/api/auth/get-session?disableCookieCache=true',{cache:'no-store'});
      const session=await response.json();
      if(!response.ok||!session?.user?.emailVerified||session.user.email?.toLowerCase()!==email.trim().toLowerCase())throw Error(t("登录未完成，请重试。"));
      setOtp('');await onAuthenticated();onClose();
    }catch(error){failed(error);}finally{setBusy(false);}
  }
  return <form className="auth-form" onSubmit={submit}>
    <h3>{t(step==='email'?t("邮箱验证码登录"):t("输入登录验证码"))}</h3>
    <p className="muted">{t('无需密码。首次登录会自动创建账号，每个账号独立保存四类进度和语言偏好。')}</p>
    <label>{t('你的邮箱')}<input type="email" autoComplete="email" required disabled={busy} readOnly={step==='code'} value={email} onChange={e=>setEmail(e.target.value)}/></label>
    {step==='code'&&<label>{t('六位验证码')}<input type="text" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} disabled={busy} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}/></label>}
    {message&&<p role="status" className="notice">{message}</p>}
    <button className="button primary" disabled={busy}>{t(busy?t("请稍候…"):step==='email'?t("发送登录验证码"):t("验证并登录"))}</button>
    {step==='code'&&<><button type="button" className="text-button" disabled={busy||cooldown>0} onClick={()=>void send()}>{cooldown>0?t('{seconds} 秒后可重发',{seconds:cooldown}):t('重新发送验证码')}</button><button type="button" className="text-button" disabled={busy} onClick={()=>{setStep('email');setOtp('');setMessage('');}}>{t('更换邮箱')}</button></>}
  </form>;
}
