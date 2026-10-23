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
  const counts=progress(allItems.length?allItems:items,records).attended;
  const month=Number(localDay(now).slice(5,7));
  return items.filter(i=>counts[i.category]<2 && (!i.start||new Date(i.end||i.start)>now) && !(i.deadline&&new Date(i.deadline)<now) && !(i.semester==='spring'&&month>=5) && !(i.semester==='fall'&&month<5) && !records.some(r=>(r.itemId===i.id||r.eventKey===`event:${i.id}`)&&['dismissed','attended','accepted'].includes(r.status)));
}
export function dueReminder(event,now=new Date(),fallback=false){
  const value=event.deadline||(fallback?event.start:null); if(!value||!Number.isFinite(Date.parse(value)))return null;
  const target=localDay(new Date(value)),today=localDay(now);
  const days=(Date.parse(target+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000;
  return days===5?{kind:event.deadline?'deadline':'event',date:target}:null;
}
export function validateRecord(input,items){
  const item=items.find(i=>i.id===input?.itemId);
  if(!item||!['planned','attended','accepted','dismissed','none'].includes(input.status))throw new Error('无效的活动或状态');
  if(typeof(input.note??'')!=='string'||(input.note??'').length>2000)throw new Error('备注最多 2000 字');
  if(input.date&&!/^\d{4}-\d{2}-\d{2}$/.test(input.date))throw new Error('无效的完成日期');
  const eventKey=input.eventKey||`item:${item.canonical||item.id}`;
  if(typeof eventKey!=='string'||eventKey.length>160||!eventKey.startsWith('event:')&&!eventKey.startsWith('item:'))throw new Error('无效的记录标识');
  return {itemId:item.id,eventKey,category:item.category,status:input.status,note:input.note||'',date:input.date||'',expectedRevision:Number.isInteger(input.expectedRevision)?input.expectedRevision:0};
}
export function formatTime(value){return new Intl.DateTimeFormat('zh-CN',{timeZone:ZONE,month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
export function sameOrigin(headers){try{const origin=new URL(headers.get('origin'));return ['http:','https:'].includes(origin.protocol)&&origin.host===headers.get('host');}catch{return false;}}
