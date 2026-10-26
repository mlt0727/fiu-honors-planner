'use client';
import {useI18n} from './Locale';
import {useRef,useState} from 'react';
import {useDialogMotion} from '@/lib/motion';
import {formatTime,localDay,newYorkTimestamp,newYorkWall,recommendedItem} from '@/lib/core.mjs';
import Icon from './Icon';
import {summaryFor,sourceNoteFor,locationFor} from '@/lib/i18n.mjs';
import type {Selection} from './ActivityRow';
import type {Item,Event,RecordEntry,Status} from '@/lib/types';

export default function Details({selection,items,events,records,onClose,onSave,onSelect}:{selection:Selection;items:Item[];events:Event[];records:RecordEntry[];onClose:()=>void;onSave:(record:RecordEntry)=>Promise<boolean>;onSelect:(s:Selection)=>void}){
  const {t,language,categories:CATEGORIES}=useI18n();
  const dialog=useRef<HTMLDialogElement>(null);
  const data=selection.event||selection.item!;
  const ids=selection.event?.itemIds||[selection.item!.id];
  const eventKey=selection.event?`event:${selection.event.id}`:`item:${selection.item!.canonical}`;
  const existing=records.find(r=>r.eventKey===eventKey);
  const [itemId,setItemId]=useState(existing?.itemId||recommendedItem(selection.event||selection.item,items,records,new Date(),data.category)?.id||ids[0]);
  const [status,setStatus]=useState<Status>(existing?.status||'none');
  const [date,setDate]=useState(existing?.date||localDay(new Date()));
  const [note,setNote]=useState(existing?.note||'');
  const [busy,setBusy]=useState(false);
  const [deadline,setDeadline]=useState(existing?.deadline?newYorkWall(existing.deadline):''),[error,setError]=useState('');
  const close=useDialogMotion(dialog,onClose);
  async function save(){setBusy(true);setError('');try{const ok=await onSave({itemId,eventKey,status,note,date,deadline:newYorkTimestamp(deadline),category:items.find(i=>i.id===itemId)!.category,revision:existing?.revision||0});setBusy(false);if(ok)close();else setError(t("未能保存，请检查登录或页面提示；你的编辑仍在。"));}catch(e){setError(e instanceof Error?e.message:t("报名截止时间无效。"));setBusy(false);}}
  const item=items.find(i=>i.id===itemId)!;
  const linked=selection.item?events.filter(e=>e.itemIds.includes(selection.item!.id)):[];
  return <dialog ref={dialog} className="detail-dialog" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}><div className="dialog-content"><div className="dialog-top"><span className={`category cat-${data.category}`}>{CATEGORIES[data.category]}</span><button className="icon-button" aria-label={t("关闭详情")} onClick={close}><Icon name="close"/></button></div><h2>{data.title}</h2><p className="detail-summary">{summaryFor(data,language)}</p>
    <dl className="facts"><div><dt>{t("活动时间（纽约）")}</dt><dd>{selection.event?t("{0}{1}",{"0":formatTime(selection.event.start,language),"1":selection.event.end?t(" 至 ")+formatTime(selection.event.end,language):t("（结束时间未读取）")}):item.mode==='experience'?t("自行预约或完成经历"):t("官方尚未公布新日程")}</dd></div><div><dt>{t("报名截止")}</dt><dd>{selection.event?.deadline?formatTime(selection.event.deadline,language):t("官方未公布；请先查看报名页面")}</dd></div>{selection.event&&<div><dt>{t("地点")}</dt><dd>{locationFor(selection.event.location,language)}</dd></div>}<div><dt>{t("认可方式")}</dt><dd>{item.mode==='experience'?t("在 Panther Connect 上报经历，等待学校审核"):t("参加官方关联活动，按原页面方式记录出席")}</dd></div></dl>
    {item.sourceIssue&&<p className="notice">{sourceNoteFor(item.sourceIssue,language)}</p>}{selection.event?.sourceNote&&<p className="notice">{sourceNoteFor(selection.event.sourceNote,language)}</p>}
    {linked.length>0&&<section className="linked-events"><h3>{t("关联的具体活动")}</h3>{linked.map(e=><button key={e.id} onClick={()=>onSelect({event:e})}><span>{e.title}</span><small>{formatTime(e.start,language)}{new Date(e.end||e.start)<new Date()?t(" · 已结束"):''}</small><Icon name="arrow" size={16}/></button>)}</section>}
    <a className="source-link" href={data.sourceUrl} target="_blank" rel="noreferrer">{t("查看官方说明与报名 ")}<Icon name="external" size={15}/></a>
    <div className="record-form"><h3>{t("我的记录")}</h3><p className="muted">{t("这里保存你的个人进度。向学校上报需在 Panther Connect 完成。")}</p>{ids.length>1&&<label>{t("计入哪个选项")}<select value={itemId} onChange={e=>setItemId(e.target.value)}>{ids.map(id=><option key={id} value={id}>{CATEGORIES[items.find(i=>i.id===id)!.category]} · {items.find(i=>i.id===id)!.title}</option>)}</select></label>}<div className="form-grid"><label>{t("状态")}<select value={status} onChange={e=>setStatus(e.target.value as Status)}><option value="none">{t("尚未参与")}</option><option value="planned">{t("计划参加")}</option><option value="attended">{t("已参加，待学校认可")}</option><option value="accepted">{t("学校已认可")}</option><option value="dismissed">{t("不感兴趣")}</option></select></label><label>{t("参加日期")}<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div>{selection.event&&<label>{t("已核实的报名截止（可选，纽约时间）")}<input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)}/><small className="muted">{t("从官方页面确认后再填写；留空时不会猜测截止日期。")}</small></label>}<label>{t("备注（可选）")}<textarea value={note} maxLength={2000} rows={3} placeholder={t("记录需要补交的材料或下一步安排")} onChange={e=>setNote(e.target.value)}/></label>{error&&<p role="alert" className="notice">{error}</p>}<div className="dialog-footer"><button className="button" onClick={close}>{t("取消")}</button><button className="button primary" disabled={busy} onClick={save}>{busy?t("正在保存…"):t("保存并同步")}</button></div></div>{item.description&&<details className="original"><summary>{t("查看官方英文说明")}</summary><p>{item.description}</p></details>}</div></dialog>;
}
