'use client';
import {useState} from 'react';
import {makeDraft} from '@/lib/reminders.mjs';
import type {Item,Event,RecordEntry,Preferences,Draft} from '@/lib/types';
import Icon from './Icon';
function base64(text:string){return btoa(Array.from(new TextEncoder().encode(text),c=>String.fromCharCode(c)).join(''));}
export default function MailPreview({items,events,records,preferences,drafts,onSettings}:{items:Item[];events:Event[];records:RecordEntry[];preferences:Preferences;drafts:Draft[];onSettings:()=>void}){
  const [kind,setKind]=useState('weekly');
  const [saved,setSaved]=useState<Draft|null>(null);
  const draft=saved||makeDraft(events,items,records,preferences,new Date(),kind);
  function download(){
    const content=`To: ${draft.to}\r\nSubject: =?UTF-8?B?${base64(draft.subject)}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\nX-Unsent: 1\r\n\r\n${base64(draft.body).match(/.{1,76}/g)?.join('\r\n')}\r\n`;
    const url=URL.createObjectURL(new Blob([content],{type:'message/rfc822'}));const a=document.createElement('a');a.href=url;a.download='fiu-honors-draft.eml';a.click();URL.revokeObjectURL(url);
  }
  return <section className="mail-page"><div className="section-heading"><div><h2>邮件预览</h2><p className="muted">每周活动与提前 5 天的提醒，在这里先看完整内容。</p></div><button className="button" onClick={onSettings}><Icon name="settings" size={17}/>提醒设置</button></div><div className="notice">当前采用审核模式：每天生成草稿，邮件尚未自动发送。按照你的偏好，每封邮件都需先确认收件人、主题和正文，再明确确认发送。</div><div className="mail-tabs"><button className={`button ${!saved&&kind==='weekly'?'selected':''}`} onClick={()=>{setKind('weekly');setSaved(null);}}>未来 7 天清单</button><button className={`button ${!saved&&kind==='deadline'?'selected':''}`} onClick={()=>{setKind('deadline');setSaved(null);}}>5 天提醒</button></div><article className="mail-paper"><div className="mail-field"><span>收件人</span><strong>{draft.to||'登录后使用你的邮箱'}</strong></div><div className="mail-field"><span>抄送 / 密送</span><strong>无</strong></div><div className="mail-field"><span>主题</span><strong>{draft.subject}</strong></div><div className="mail-field"><span>附件 / 链接</span><strong>无附件；官方活动链接已列在正文中</strong></div><pre>{draft.body}</pre><button className="button outline" onClick={download} disabled={!draft.to}><Icon name="download" size={17}/>下载邮件草稿 .eml</button></article>{drafts.length>0&&<section className="saved-drafts"><h3>已准备的草稿</h3>{drafts.map(d=><button className="draft-row" key={d.key} onClick={()=>setSaved(d)}><span>{d.subject}</span><small>{new Date(d.createdAt).toLocaleDateString('zh-CN')}</small></button>)}</section>}</section>;
}
