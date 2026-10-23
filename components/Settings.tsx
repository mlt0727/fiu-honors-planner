'use client';
import {useEffect,useRef,useState} from 'react';
import {createAuthClient,isAuthError} from '@neondatabase/auth/next';
import type {PlannerState,Preferences} from '@/lib/types';
import Icon from './Icon';
const authClient=createAuthClient();
export default function Settings({state,onClose,onSave,onRefresh,onExport,onImport}:{state:PlannerState;onClose:()=>void;onSave:(p:Preferences)=>Promise<boolean>;onRefresh:()=>void;onExport:()=>void;onImport:(text:string)=>Promise<boolean>}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [prefs,setPrefs]=useState(state.preferences);
  const [signup,setSignup]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const [verifying,setVerifying]=useState(false),[otp,setOtp]=useState('');
  const [backup,setBackup]=useState(''),[backupCount,setBackupCount]=useState(0),[importMessage,setImportMessage]=useState('');
  useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
  function authFailure(err:unknown){
    if(isAuthError(err)&&err.code==='email_not_confirmed'){
      setVerifying(true);setPassword('');setMessage('邮箱尚未验证。请输入邮件中的六位验证码；过期后可点击重新发送验证码。');
    }else setMessage(isAuthError(err)?err.message:'登录服务暂时不可用，请稍后重试。');
  }
  async function login(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
    const result=signup?await authClient.signUp.email({email,password,name:'Honors planner owner'}):await authClient.signIn.email({email,password});
    if(result.error)setMessage(result.error.message||'登录失败，请检查邮箱或密码。');
    else if(signup){setVerifying(true);setPassword('');setMessage('账号已创建。请输入验证邮件中的六位验证码，邮件中没有验证链接。');}
    else {const session=await authClient.getSession();if(!session.data?.user.emailVerified){setVerifying(true);setPassword('');setMessage('请输入邮件中的六位验证码，完成邮箱验证。');}else {onRefresh();onClose();}}
  }catch(err){authFailure(err);}finally{setBusy(false);}}
  async function verifyEmail(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
    const result=await authClient.emailOtp.verifyEmail({email,otp});
    if(result.error){setMessage(result.error.message||'验证码不正确或已过期，请重新获取。');return;}
    const session=await authClient.getSession({query:{disableCookieCache:true}});
    setOtp('');setPassword('');
    if(session.data?.user.emailVerified){onRefresh();onClose();}
    else {setVerifying(false);setSignup(false);setMessage('邮箱验证成功，请使用网站专用密码登录。');}
  }catch(err){authFailure(err);}finally{setBusy(false);}}
  async function resendOtp(){
    if(!email.trim()){setMessage('请先填写你的邮箱。');return;}
    setBusy(true);setMessage('');try{
      const result=await authClient.emailOtp.sendVerificationOtp({email,type:'email-verification'});
      if(result.error)setMessage(result.error.message||'验证码发送失败，请稍后重试。');
      else {setOtp('');setMessage('新的验证码已发送，请使用最新邮件中的六位验证码。');}
    }catch(err){authFailure(err);}finally{setBusy(false);}
  }
  return <dialog ref={dialog} className="settings-dialog" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="dialog-content"><div className="dialog-top"><h2>同步与设置</h2><button className="icon-button" aria-label="关闭设置" onClick={onClose}><Icon name="close"/></button></div>{state.session?<><p className="account-line"><Icon name="check" size={18}/>已登录：{state.session.email}</p><p className="muted">Neon 云端保存 · 在其他设备登录同一账号即可继续。</p><button className="text-button" onClick={async()=>{await authClient.signOut();onRefresh();onClose();}}>退出登录</button></>:<form className="auth-form" onSubmit={verifying?verifyEmail:login}>
    <h3>{verifying?'验证你的邮箱':signup?'首次设置私人账号':'登录以同步进度'}</h3>
    <p className="muted">{verifying?'请输入验证邮件中的六位数字。验证码有效期以邮件为准；过期后可重新发送。':'仅网站所有者的邮箱可以使用。密码由你自己输入；不使用 FIU 登录密码。'}</p>
    <label>你的邮箱<input type="email" autoComplete="email" required disabled={busy} value={email} onChange={e=>{setEmail(e.target.value);setOtp('');}}/></label>
    {verifying?<label>六位验证码<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required disabled={busy} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}/></label>:<label>网站专用密码<input type="password" autoComplete={signup?'new-password':'current-password'} minLength={8} required disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
    {message&&<p role="status" className="notice">{message}</p>}
    <button className="button primary" disabled={busy}>{busy?'请稍候…':verifying?'验证邮箱':signup?'创建私人账号':'登录'}</button>
    {verifying?<><button type="button" className="text-button" disabled={busy} onClick={()=>void resendOtp()}>重新发送验证码</button><button type="button" className="text-button" disabled={busy} onClick={()=>{setVerifying(false);setSignup(false);setOtp('');setMessage('');}}>返回登录</button></>:<><button type="button" className="text-button" disabled={busy} onClick={()=>{setSignup(!signup);setMessage('');}}>{signup?'已有账号，返回登录':'第一次使用？设置账号'}</button><button type="button" className="text-button" disabled={busy} onClick={()=>{setVerifying(true);setPassword('');setMessage('输入已收到的验证码；只有点击重新发送才会请求新邮件。');}}>已有验证码？验证邮箱</button></>}
    </form>}
    <section className="settings-section"><h3>提醒偏好</h3><label className="check-label"><input type="checkbox" checked={prefs.weekly} onChange={e=>setPrefs({...prefs,weekly:e.target.checked})}/>每周一准备未来 7 天活动清单</label><label className="check-label"><input type="checkbox" checked={prefs.deadlineReminders} onChange={e=>setPrefs({...prefs,deadlineReminders:e.target.checked})}/>在已知报名截止前 5 个日历日准备提醒</label><label className="check-label"><input type="checkbox" checked={prefs.eventFallback} onChange={e=>setPrefs({...prefs,eventFallback:e.target.checked})}/>没有报名截止时，在活动开始前 5 天提醒</label><p className="muted">当前仅准备草稿，不自动发送。完成分类会自动停止推荐。</p><button className="button primary" disabled={!state.session||busy} onClick={async()=>{setBusy(true);if(await onSave(prefs))onClose();setBusy(false);}}>保存提醒设置</button></section><section className="settings-section"><h3>数据与来源</h3><p className="muted">128 个选项来自 2026 年 10 月 23 日的授权浏览器读取。公开活动源每日刷新；需要登录的路径目录需重新授权读取后更新。</p><button className="button" onClick={onExport}><Icon name="download" size={17}/>导出个人记录</button><label className="backup-import">从备份恢复<input type="file" accept="application/json,.json" disabled={!state.session||busy} onChange={async e=>{try{setBackup('');const file=e.target.files?.[0];if(!file)return;if(file.size>1000000)throw Error('备份文件不能超过 1 MB。');const text=await file.text();const data=JSON.parse(text.replace(/^\uFEFF/,''));if(data.version!==1||!Array.isArray(data.records)||data.records.length>1000)throw Error('这不是支持的备份文件。');setBackup(text);setBackupCount(data.records.length);setImportMessage('');}catch(err){setImportMessage(err instanceof Error?err.message:'文件无法读取。');}}}/></label>{backup&&<div className="notice"><p>将恢复 {backupCount} 条活动记录及备份中的设置，可能更新现有记录。系统会验证活动归属，并在版本冲突时停止。</p><button className="button outline" disabled={busy} onClick={async()=>{setBusy(true);const ok=await onImport(backup);setBusy(false);if(ok)onClose();else setImportMessage('未完成导入，请查看页面提示并刷新后重试。');}}>确认恢复这份备份</button></div>}{importMessage&&<p role="status" className="notice">{importMessage}</p>}<p className="muted">官方年度截止：2027 年 4 月 9 日 23:59（原文标注 EST）。志愿服务另外要求每年 20 小时，需在 GivePulse 记录。</p></section></div></dialog>;
}
