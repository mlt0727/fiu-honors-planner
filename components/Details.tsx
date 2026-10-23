'use client';
import {useEffect,useRef,useState} from 'react';
import {CATEGORIES,formatTime,localDay} from '@/lib/core.mjs';
import Icon from './Icon';
import type {Selection} from './ActivityRow';
import type {Item,Event,RecordEntry,Status} from '@/lib/types';

export default function Details({selection,items,events,records,onClose,onSave,onSelect}:{selection:Selection;items:Item[];events:Event[];records:RecordEntry[];onClose:()=>void;onSave:(record:RecordEntry)=>Promise<boolean>;onSelect:(s:Selection)=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const data=selection.event||selection.item!;
  const ids=selection.event?.itemIds||[selection.item!.id];
  const eventKey=selection.event?`event:${selection.event.id}`:`item:${selection.item!.canonical}`;
  const existing=records.find(r=>r.eventKey===eventKey);
  const [itemId,setItemId]=useState(existing?.itemId||ids[0]);
  const [status,setStatus]=useState<Status>(existing?.status||'none');
  const [date,setDate]=useState(existing?.date||localDay(new Date()));
  const [note,setNote]=useState(existing?.note||'');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{const d=dialog.current;d?.showModal();return()=>d?.close();},[]);
  async function save(){setBusy(true);const ok=await onSave({itemId,eventKey,status,note,date,category:items.find(i=>i.id===itemId)!.category,revision:existing?.revision||0});setBusy(false);if(ok)onClose();}
  const item=items.find(i=>i.id===itemId)!;
  const linked=selection.item?events.filter(e=>e.itemIds.includes(selection.item!.id)):[];
  return <dialog ref={dialog} className="detail-dialog" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="dialog-content"><div className="dialog-top"><span className={`category cat-${data.category}`}>{CATEGORIES[data.category]}</span><button className="icon-button" aria-label="关闭详情" onClick={onClose}><Icon name="close"/></button></div><h2>{data.title}</h2><p className="detail-summary">{data.summary}</p>
    <dl className="facts"><div><dt>活动时间（纽约）</dt><dd>{selection.event?`${formatTime(selection.event.start)}${selection.event.end?' 至 '+formatTime(selection.event.end):'（结束时间未读取）'}`:item.mode==='experience'?'自行预约或完成经历':'官方尚未公布新日程'}</dd></div><div><dt>报名截止</dt><dd>{selection.event?.deadline?formatTime(selection.event.deadline):'官方未公布；请先查看报名页面'}</dd></div>{selection.event&&<div><dt>地点</dt><dd>{selection.event.location}</dd></div>}<div><dt>认可方式</dt><dd>{item.mode==='experience'?'在 Panther Connect 上报经历，等待学校审核':'参加官方关联活动，按原页面方式记录出席'}</dd></div></dl>
    {item.sourceIssue&&<p className="notice">{item.sourceIssue}</p>}{selection.event?.sourceNote&&<p className="notice">{selection.event.sourceNote}</p>}
    {linked.length>0&&<section className="linked-events"><h3>关联的具体活动</h3>{linked.map(e=><button key={e.id} onClick={()=>onSelect({event:e})}><span>{e.title}</span><small>{formatTime(e.start)}{new Date(e.end||e.start)<new Date()?' · 已结束':''}</small><Icon name="arrow" size={16}/></button>)}</section>}
    <a className="source-link" href={data.sourceUrl} target="_blank" rel="noreferrer">查看官方说明与报名 <Icon name="external" size={15}/></a>
    <div className="record-form"><h3>我的记录</h3><p className="muted">这里保存你的个人进度。向学校上报需在 Panther Connect 完成。</p>{ids.length>1&&<label>计入哪个选项<select value={itemId} onChange={e=>setItemId(e.target.value)}>{ids.map(id=><option key={id} value={id}>{CATEGORIES[items.find(i=>i.id===id)!.category]} · {items.find(i=>i.id===id)!.title}</option>)}</select></label>}<div className="form-grid"><label>状态<select value={status} onChange={e=>setStatus(e.target.value as Status)}><option value="none">尚未参与</option><option value="planned">计划参加</option><option value="attended">已参加，待学校认可</option><option value="accepted">学校已认可</option><option value="dismissed">不感兴趣</option></select></label><label>参加日期<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><label>备注（可选）<textarea value={note} maxLength={2000} rows={3} placeholder="记录需要补交的材料或下一步安排" onChange={e=>setNote(e.target.value)}/></label><div className="dialog-footer"><button className="button" onClick={onClose}>取消</button><button className="button primary" disabled={busy} onClick={save}>{busy?'正在保存…':'保存并同步'}</button></div></div>{item.description&&<details className="original"><summary>查看官方英文说明</summary><p>{item.description}</p></details>}</div></dialog>;
}
