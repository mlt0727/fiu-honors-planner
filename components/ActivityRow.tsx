import {useI18n} from './Locale';
import Icon from './Icon';
import {summaryFor,sourceNoteFor,locationFor} from '@/lib/i18n.mjs';
import {formatTime,ZONE} from '@/lib/core.mjs';
import type {Item,Event,RecordEntry} from '@/lib/types';
export type Selection={item?:Item;event?:Event};
export default function ActivityRow({selection,record,onOpen,onPlan}:{selection:Selection;record?:RecordEntry;onOpen:()=>void;onPlan:()=>void}){
  const {t,language,categories:CATEGORIES}=useI18n();
  const data=selection.event||selection.item!;
  const start=selection.event?.start;
  const date=start?new Date(start):null;
  const status={planned:t("计划参加"),attended:t("已参加"),accepted:t("学校已认可"),dismissed:t("不感兴趣"),none:''}[record?.status||'none'];
  return <article className={`activity-row ${record?.status==='dismissed'?'dimmed':''}`}>
    <div className="date-block">{date?<><strong>{new Intl.DateTimeFormat('en-US',{timeZone:ZONE,day:'2-digit'}).format(date)}</strong><span>{new Intl.DateTimeFormat('en-US',{timeZone:ZONE,month:'short'}).format(date).toUpperCase()}</span><small>{new Intl.DateTimeFormat(language==='en'?'en-US':'zh-CN',{timeZone:ZONE,weekday:'short'}).format(date)}</small></>:<><Icon name="calendar" size={34}/><small>{selection.item?.mode==='experience'?t("自行安排"):t("日期待公布")}</small></>}</div>
    <div className="row-copy"><div className="row-labels"><span className={`category cat-${data.category}`}>{CATEGORIES[data.category]}</span>{status&&<span className="record-status">{status}</span>}</div><h3>{data.title}</h3><p>{summaryFor(data,language)}</p><div className="row-meta"><span><Icon name="clock" size={16}/>{start?`${formatTime(start,language)}${selection.event?.end?' – '+new Intl.DateTimeFormat(language==='en'?'en-US':'zh-CN',{timeZone:ZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(selection.event.end)):''}`:selection.item?.semester==='spring'?t("春季学期"):selection.item?.semester==='fall'?t("Summer B / 秋季学期"):t("以官方安排为准")}</span>{selection.event&&<span><Icon name="pin" size={16}/>{locationFor(selection.event.location,language)}</span>}</div><small className="deadline">{selection.event?.deadline?t("报名截止：")+formatTime(selection.event.deadline,language):t("报名截止：官方未公布")}</small></div>
    <div className="row-actions"><button className={`icon-button ${record?.status==='planned'?'saved':''}`} disabled={!!record&&['attended','accepted','dismissed'].includes(record.status)} aria-label={record?.status==='planned'?t("取消计划：{0}",{"0":data.title}):t("计划参加：{0}",{"0":data.title})} title={record&&['attended','accepted','dismissed'].includes(record.status)?t("请在详情中修改参与状态"):t("加入计划")} onClick={onPlan}><Icon name={record?.status==='planned'?'check':'bookmark'}/></button><button className="button outline" onClick={onOpen}>{t("查看详情")}</button></div>
  </article>;
}
