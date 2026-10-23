import Icon from './Icon';
import {CATEGORIES,formatTime,ZONE} from '@/lib/core.mjs';
import type {Item,Event,RecordEntry} from '@/lib/types';
export type Selection={item?:Item;event?:Event};
export default function ActivityRow({selection,record,onOpen,onPlan}:{selection:Selection;record?:RecordEntry;onOpen:()=>void;onPlan:()=>void}){
  const data=selection.event||selection.item!;
  const start=selection.event?.start;
  const date=start?new Date(start):null;
  const status={planned:'计划参加',attended:'已参加',accepted:'学校已认可',dismissed:'不感兴趣',none:''}[record?.status||'none'];
  return <article className={`activity-row ${record?.status==='dismissed'?'dimmed':''}`}>
    <div className="date-block">{date?<><strong>{new Intl.DateTimeFormat('en-US',{timeZone:ZONE,day:'2-digit'}).format(date)}</strong><span>{new Intl.DateTimeFormat('en-US',{timeZone:ZONE,month:'short'}).format(date).toUpperCase()}</span><small>{new Intl.DateTimeFormat('zh-CN',{timeZone:ZONE,weekday:'short'}).format(date)}</small></>:<><Icon name="calendar" size={34}/><small>{selection.item?.mode==='experience'?'自行安排':'日期待公布'}</small></>}</div>
    <div className="row-copy"><div className="row-labels"><span className={`category cat-${data.category}`}>{CATEGORIES[data.category]}</span>{status&&<span className="record-status">{status}</span>}</div><h3>{data.title}</h3><p>{data.summary}</p><div className="row-meta"><span><Icon name="clock" size={16}/>{start?`${formatTime(start)}${selection.event?.end?' – '+new Intl.DateTimeFormat('zh-CN',{timeZone:ZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(selection.event.end)):''}`:selection.item?.semester==='spring'?'春季学期':selection.item?.semester==='fall'?'Summer B / 秋季学期':'以官方安排为准'}</span>{selection.event&&<span><Icon name="pin" size={16}/>{selection.event.location}</span>}</div><small className="deadline">{selection.event?.deadline?'报名截止：'+formatTime(selection.event.deadline):'报名截止：官方未公布'}</small></div>
    <div className="row-actions"><button className={`icon-button ${record?.status==='planned'?'saved':''}`} aria-label={record?.status==='planned'?`取消计划：${data.title}`:`计划参加：${data.title}`} title="加入计划" onClick={onPlan}><Icon name={record?.status==='planned'?'check':'bookmark'}/></button><button className="button outline" onClick={onOpen}>查看详情</button></div>
  </article>;
}
