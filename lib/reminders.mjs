import {CATEGORIES,dueReminder,localDay,formatTime,eligible,withPersonalDeadlines,recommendedItem} from './core.mjs';
import {categoryNames,summaryFor,locationFor} from './i18n.mjs';

export function makeDraft(events,items,records,prefs,now=new Date(),kind='weekly'){
  const language=prefs.language==='en'?'en':'zh',english=language==='en';
  const time=value=>formatTime(value,language);
  const selected=withPersonalDeadlines(events,records).filter(e=>eligible(e,items,records,now)).filter(e=>kind==='weekly'?new Date(e.start)<=new Date(now.getTime()+7*86400000):dueReminder(e,now,prefs.eventFallback));
  const today=localDay(now);
  const subject=english?(kind==='weekly'?`FIU Honors · Activities for the next 7 days from ${today}`:'FIU Honors · Registration deadline / event in 5 days'):(kind==='weekly'?`FIU Honors · ${today} 起未来 7 天的活动`:`FIU Honors · 5 天后的报名截止 / 活动提醒`);
  const lines=selected.map(e=>{
    const category=recommendedItem(e,items,records,now)?.category??e.category;
    const reminder=kind==='deadline'?dueReminder(e,now,prefs.eventFallback):null;
    if(english)return [e.title,`Category: ${categoryNames(language)[category]}`,summaryFor(e,language),`Event: ${time(e.start)}${e.end?' to '+time(e.end):' (end time not available)'} (America/New_York)`,`Location: ${locationFor(e.location,language)}`,e.deadline?`Registration deadline${e.deadlineSource==='personal'?' (entered by you)':''}: ${time(e.deadline)}`:'Registration deadline: not published; check the official page.',reminder?(reminder.kind==='deadline'?'Reminder: the recorded registration deadline is in 5 calendar days.':'Reminder: the event starts in 5 calendar days. This is not a registration deadline reminder.'):'',`Details and registration: ${e.sourceUrl}`].filter(Boolean).join('\n');
    return [`${e.title}`,`分类：${CATEGORIES[category]}`,e.summary,`活动：${formatTime(e.start)}${e.end?' 至 '+formatTime(e.end):'（结束时间未读取）'}（America/New_York）`,`地点：${e.location}`,e.deadline?`报名截止${e.deadlineSource==='personal'?'（你填写）':''}：${formatTime(e.deadline)}`:'报名截止：官方未公布，请先打开原页面确认。',reminder?reminder.kind==='deadline'?'提醒原因：距已记录报名截止还有 5 个日历日。':'提醒原因：距活动开始还有 5 个日历日；这不是报名截止提醒。':'',`详情与报名：${e.sourceUrl}`].filter(Boolean).join('\n');
  });
  const body=english?['Your FIU Honors activity digest','Only categories where you still need experiences are recommended. All times are local to New York.',...lines,selected.length?'Recheck the official page before registering. Event details may change.':'No activities currently match your progress and date range.','Personal attendance does not mean official acceptance. Report completed experiences in Panther Connect.']:['你的 FIU Honors 活动清单','以下只推荐尚未完成 2 项的分类。所有时间为纽约当地时间。',...lines,selected.length?'请在报名前重新核实主办方页面，活动可能调整。':'当前没有符合你进度和时间范围的活动。','个人进度不等于学校认可记录；完成后请在 Panther Connect 上报。'];
  return {key:`${kind}:${today}`,language,to:prefs.email||'',subject,body:body.join('\n\n'),reason:english?(kind==='weekly'?'Weekly digest':'5-day deadline / event reminder'):(kind==='weekly'?'每周清单':'截止 / 活动前 5 天'),createdAt:now.toISOString(),eventIds:selected.map(e=>e.id)};
}
