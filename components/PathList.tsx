import {useI18n} from './Locale';
import {ZONE} from '@/lib/core.mjs';
import type {Item,Event,RecordEntry,Status} from '@/lib/types';
const RANK:Record<Status,number>={accepted:4,attended:3,planned:2,dismissed:1,none:0};
/** The Paths directory as Panther Connect shows it: four categories, every option in source order, scheduled sessions under each. */
export default function PathList({items,events,records,attended,query,category,onOpenItem,onOpenEvent}:{items:Item[];events:Event[];records:RecordEntry[];attended:number[];query:string;category:string;onOpenItem:(item:Item)=>void;onOpenEvent:(event:Event)=>void}){
  const {t,language,categories:CATEGORIES}=useI18n();
  const now=new Date(),locale=language==='en'?'en-US':'zh-CN';
  const day=(v:string)=>new Intl.DateTimeFormat('en-US',{timeZone:ZONE,month:'short',day:'2-digit'}).format(new Date(v)).toUpperCase();
  const when=(e:Event)=>new Intl.DateTimeFormat(locale,{timeZone:ZONE,weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(e.start));
  const label={planned:t("计划参加"),attended:t("已参加"),accepted:t("学校已认可"),dismissed:t("不感兴趣"),none:''};
  const groups=CATEGORIES.map((name:string,c:number)=>({name,c,items:items.filter(i=>i.category===c&&(category==='all'||Number(category)===c)&&(!query||i.title.toLowerCase().includes(query.toLowerCase())))})).filter(g=>g.items.length);
  if(!groups.length)return null;
  return <>{groups.map(g=><section className="path-group" key={g.c}><div className="path-group-head"><h3>{g.name}</h3><span>{t("已参加")} {attended[g.c]} / 2</span></div><div className="path-list">{g.items.map(item=>{
    const status=records.filter(r=>r.itemId===item.id).reduce<Status>((best,r)=>RANK[r.status]>RANK[best]?r.status:best,'none');
    const sessions=events.filter(e=>e.itemIds.includes(item.id)&&new Date(e.end||e.start)>=now).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
    return <article className="path-item" key={item.id} data-flip-id={item.id}>
      <button className="path-main" onClick={()=>onOpenItem(item)}><span className={`path-mark ${status}`} aria-hidden="true"/><h3>{item.title}</h3><small>{label[status]||(sessions.length?'':item.mode==='experience'?t("自行安排"):t("日期待公布"))}</small></button>
      {sessions.length>0&&<div className="path-sessions">{sessions.map(e=><button className="path-session" key={e.id} onClick={()=>onOpenEvent(e)}><strong>{day(e.start)}</strong><span>{when(e)} · {e.title}</span></button>)}</div>}
    </article>;})}</div></section>)}</>;
}
