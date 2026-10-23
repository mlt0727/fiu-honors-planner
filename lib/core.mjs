export const CATEGORIES=['学术与研究','职业发展','身心与社交','Honors College Week'];
export const ZONE='America/New_York';
export const normalizeTitle=t=>t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function localDay(date){return new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function progress(items,records){
  const attended=[0,0,0,0],accepted=[0,0,0,0];
  for(const [target,states] of [[attended,['attended','accepted']],[accepted,['accepted']]]){
    const seenItems=new Set(),seenEvents=new Set();
    for(const r of [...records].sort((a,b)=>(a.status==='accepted'?-1:0)-(b.status==='accepted'?-1:0))){
      const item=items.find(i=>i.id===r.itemId); if(!item||!states.includes(r.status))continue;
      const key=item.canonical||item.id, event=r.eventKey||`item:${key}`;
      if(seenItems.has(key)||seenEvents.has(event))continue;
      seenItems.add(key);seenEvents.add(event); target[item.category]=Math.min(2,target[item.category]+1);
    }
  }
  return {attended,accepted,total:attended.reduce((a,b)=>a+b,0),official:accepted.reduce((a,b)=>a+b,0)};
}
export function recommend(items,allItems,records,now=new Date()){
  const month=Number(localDay(now).slice(5,7));
  return items.filter(i=>eligible(i,allItems.length?allItems:items,records,now)&&!(i.semester==='spring'&&month>=5)&&!(i.semester==='fall'&&month<5));
}
export function dueReminder(event,now=new Date(),fallback=false){
  const value=event.deadline||(fallback?event.start:null); if(!value||!Number.isFinite(Date.parse(value)))return null;
  const target=localDay(new Date(value)),today=localDay(now);
  const days=(Date.parse(target+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000;
  return days===5?{kind:event.deadline?'deadline':'event',date:target}:null;
}
export function validateRecord(input,items,events=[]){
  const item=items.find(i=>i.id===input?.itemId);
  if(!item||!['planned','attended','accepted','dismissed','none'].includes(input.status))throw new Error('无效的活动或状态');
  if(typeof(input.note??'')!=='string'||(input.note??'').length>2000)throw new Error('备注最多 2000 字');
  if(input.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date+'T12:00:00Z'))||new Date(input.date+'T12:00:00Z').toISOString().slice(0,10)!==input.date))throw new Error('无效的完成日期');
  const eventKey=input.eventKey||`item:${item.canonical||item.id}`;
  if(typeof eventKey!=='string'||eventKey.length>160||!eventKey.startsWith('event:')&&!eventKey.startsWith('item:'))throw new Error('无效的记录标识');
  if(eventKey.startsWith('item:')&&eventKey!==`item:${item.canonical||item.id}`)throw new Error('无效的选项归属');
  if(eventKey.startsWith('event:')&&!events.some(e=>`event:${e.id}`===eventKey&&e.itemIds.includes(item.id)))throw new Error('无效的活动归属');
  if(input.deadline&&(typeof input.deadline!=='string'||input.deadline.length>40||!/^\d{4}-\d{2}-\d{2}T/.test(input.deadline)||!Number.isFinite(Date.parse(input.deadline))))throw new Error('无效的报名截止时间');
  return {itemId:item.id,eventKey,category:item.category,status:input.status,note:input.note||'',date:input.date||'',deadline:input.deadline||'',expectedRevision:Number.isInteger(input.expectedRevision)?input.expectedRevision:0};
}
export function formatTime(value){return new Intl.DateTimeFormat('zh-CN',{timeZone:ZONE,month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
export function sameOrigin(headers){try{const origin=new URL(headers.get('origin'));return ['http:','https:'].includes(origin.protocol)&&origin.host===headers.get('host');}catch{return false;}}
export function quickPlanStatus(status='none'){return status==='none'?'planned':status==='planned'?'none':status;}
export function eligible(target,items,records,now=new Date(),historical=false){
  if(target.creditVerified===false)return false;
  if(!historical&&target.start&&new Date(target.end||target.start)<=now)return false;
  if(!historical&&target.deadline&&new Date(target.deadline)<=now)return false;
  if(records.some(r=>r.eventKey===`event:${target.id}`&&['dismissed','attended','accepted'].includes(r.status)))return false;
  const counts=progress(items,records).attended;
  return (target.itemIds||[target.id]).some(id=>{
    const item=items.find(i=>i.id===id)||target;
    if(counts[item.category]>=2)return false;
    return !records.some(r=>{
      const recorded=items.find(i=>i.id===r.itemId);
      const same=recorded&&(recorded.canonical||recorded.id)===(item.canonical||item.id);
      return same&&(['attended','accepted'].includes(r.status)||r.status==='dismissed'&&(!r.eventKey||r.eventKey.startsWith('item:')));
    });
  });
}
export function validateBackup(input,items,events,current){
  if(input?.version!==1||!Array.isArray(input.records)||input.records.length>1000)throw new Error('无效的备份格式');
  const seen=new Set();
  return input.records.map(r=>{const record=validateRecord({...r,expectedRevision:current.find(v=>v.eventKey===r.eventKey)?.revision||0},items,events);if(seen.has(record.eventKey))throw new Error('备份含重复记录');seen.add(record.eventKey);return record;});
}
export function newYorkWall(value){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function newYorkTimestamp(value){
  if(!value)return '';
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'Z')))throw Error('无效的纽约时间');
  const target=Date.parse(value+'Z');let result=target;
  for(let i=0;i<3;i++)result+=target-Date.parse(newYorkWall(new Date(result))+'Z');
  if(newYorkWall(new Date(result))!==value)throw Error('该纽约当地时间不存在，请检查夏令时切换日期。');
  return new Date(result).toISOString();
}
export function withPersonalDeadlines(events,records){return events.map(e=>{const r=records.find(r=>r.eventKey===`event:${e.id}`&&r.deadline);return r?{...e,deadline:r.deadline,deadlineSource:'personal'}:e;});}
/** @param {number|null} category */
export function recommendedItem(target,items,records,now=new Date(),category=null){return (target.itemIds||[target.id]).map(id=>items.find(i=>i.id===id)).find(i=>i&&(category===null||i.category===category)&&eligible(i,items,records,now));}
