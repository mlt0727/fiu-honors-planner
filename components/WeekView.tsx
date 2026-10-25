'use client';
import {useI18n} from './Locale';
import {useState} from 'react';
import {ZONE,localDay} from '@/lib/core.mjs';
import type {Event} from '@/lib/types';
import Icon from './Icon';
export default function WeekView({events,onOpen}:{events:Event[];onOpen:(event:Event)=>void}){
  const {t,language,categories:CATEGORIES}=useI18n();
  const [offset,setOffset]=useState(0);
  const today=localDay(new Date());
  const todayDate=new Date(today+'T12:00:00Z');
  const monday=new Date(todayDate);monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7)+offset*7);
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);});
  return <div className="week-view"><div className="week-toolbar"><button className="button" onClick={()=>setOffset(offset-1)}>{t("上一周")}</button><strong>{days[0]} — {days[6]}</strong><button className="button" onClick={()=>setOffset(offset+1)}>{t("下一周")}</button><button className="text-button" onClick={()=>setOffset(0)}>{t("本周")}</button></div><div className="week-grid">{days.map(day=><section className={`week-day ${day===today?'today':''}`} key={day}><h3>{new Intl.DateTimeFormat(language==='en'?'en-US':'zh-CN',{timeZone:'UTC',weekday:'short'}).format(new Date(day+'T12:00:00Z'))}<b>{Number(day.slice(-2))}</b></h3>{events.filter(e=>localDay(new Date(e.start))===day).map(e=><button className={`week-event cat-${e.category}`} key={e.id} onClick={()=>onOpen(e)}><strong>{new Intl.DateTimeFormat(language==='en'?'en-US':'zh-CN',{timeZone:ZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(e.start))}</strong><span>{e.title}</span><small>{CATEGORIES[e.category]}</small></button>)}{!events.some(e=>localDay(new Date(e.start))===day)&&<p className="muted">{t("暂无已公布活动")}</p>}</section>)}</div><p className="muted">{t("所有时间按 America/New_York 显示；没有固定日期的选项可以在列表视图查看。")}</p><button className="text-button" onClick={()=>setOffset(offset+1)}>{t("看看下一周 ")}<Icon name="arrow" size={15}/></button></div>;
}
