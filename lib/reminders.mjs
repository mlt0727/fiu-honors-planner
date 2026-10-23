import {CATEGORIES,progress,dueReminder,localDay,formatTime,eligible,withPersonalDeadlines} from './core.mjs';

export function makeDraft(events,items,records,prefs,now=new Date(),kind='weekly'){
  const counts=progress(items,records).attended;
  const selected=withPersonalDeadlines(events,records).filter(e=>eligible(e,items,records,now)).filter(e=>kind==='weekly'?new Date(e.start)<=new Date(now.getTime()+7*86400000):dueReminder(e,now,prefs.eventFallback));
  const today=localDay(now);
  const subject=kind==='weekly'?`FIU Honors · ${today} 起未来 7 天的活动`:`FIU Honors · 5 天后的报名截止 / 活动提醒`;
  const lines=selected.map(e=>{
    const category=e.itemIds.map(id=>items.find(i=>i.id===id)?.category).find(c=>c!==undefined&&counts[c]<2)??e.category;
    const reminder=kind==='deadline'?dueReminder(e,now,prefs.eventFallback):null;
    return [`${e.title}`,`分类：${CATEGORIES[category]}`,e.summary,`活动：${formatTime(e.start)}${e.end?' 至 '+formatTime(e.end):'（结束时间未读取）'}（America/New_York）`,`地点：${e.location}`,e.deadline?`报名截止${e.deadlineSource==='personal'?'（你填写）':''}：${formatTime(e.deadline)}`:'报名截止：官方未公布，请先打开原页面确认。',reminder?reminder.kind==='deadline'?'提醒原因：距已记录报名截止还有 5 个日历日。':'提醒原因：距活动开始还有 5 个日历日；这不是报名截止提醒。':'',`详情与报名：${e.sourceUrl}`].filter(Boolean).join('\n');
  });
  return {key:`${kind}:${today}`,to:prefs.email||'',subject,body:[`你的 FIU Honors 活动清单`, `以下只推荐尚未完成 2 项的分类。所有时间为纽约当地时间。`,...lines,selected.length?'请在报名前重新核实主办方页面，活动可能调整。':'当前没有符合你进度和时间范围的活动。',`个人进度不等于学校认可记录；完成后请在 Panther Connect 上报。`].join('\n\n'),reason:kind==='weekly'?'每周清单':'截止 / 活动前 5 天',createdAt:now.toISOString(),eventIds:selected.map(e=>e.id)};
}
