'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import ActivityRow,{type Selection} from './ActivityRow';
import Progress from './Progress';
import Details from './Details';
import Settings from './Settings';
import MailPreview from './MailPreview';
import WeekView from './WeekView';
import Icon from './Icon';
import {LocaleContext} from './Locale';
import {text,categoryNames,summaryFor} from '@/lib/i18n.mjs';
import {progress,formatTime,localDay,eligible,quickPlanStatus,validateBackup,withPersonalDeadlines,recommendedItem} from '@/lib/core.mjs';
import type {Item,Event,RecordEntry,PlannerState,Preferences,Language} from '@/lib/types';

const initial:PlannerState={records:[],preferences:{hours:0,weekly:true,deadlineReminders:true,eventFallback:false,email:'',revision:0,language:'en'},drafts:[],session:null,sync:{lastSuccess:null,lastAttempt:null,error:null}};
export default function Planner({items,seedEvents}:{items:Item[];seedEvents:Event[]}){
  const [language,setLanguage]=useState<Language>('en');
  const activeUser=useRef<string|null>(null),refreshId=useRef(0);
  const t=(key:string,values:Record<string,unknown>={})=>text(key,language,values);
  const CATEGORIES=categoryNames(language);
  const [state,setState]=useState(initial),[sourceEvents,setEvents]=useState(seedEvents),[page,setPage]=useState('activities'),[query,setQuery]=useState(''),[category,setCategory]=useState('all'),[time,setTime]=useState('upcoming'),[view,setView]=useState('list'),[recommendOnly,setRecommendOnly]=useState(true),[selection,setSelection]=useState<Selection|null>(null),[settings,setSettings]=useState(false),[notice,setNotice]=useState(''),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[hours,setHours]=useState('0');
  const events:Event[]=withPersonalDeadlines(sourceEvents,state.records);
  const refresh=useCallback(async(preferred?:Language)=>{
    const requestId=++refreshId.current;
    const hint=preferred||(localStorage.getItem('honors-language')==='en'?'en':'zh');
    setLoading(true);
    const [personal,publicEvents]=await Promise.allSettled([fetch('/api/state?language='+hint,{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);return d;}),fetch('/api/events',{cache:'no-store'}).then(r=>r.json())]);
    if(requestId!==refreshId.current)return;
    if(personal.status==='fulfilled'){activeUser.current=personal.value.session?.email||null;setLanguage(personal.value.session?(personal.value.preferences.language==='en'?'en':'zh'):'en');setState({...initial,...personal.value});setHours(String(personal.value.preferences.hours));}else setNotice(personal.reason?.message||t("个人数据读取失败，请重试。"));
    if(publicEvents.status==='fulfilled'){setEvents(publicEvents.value.events);if(publicEvents.value.sync)setState(current=>({...current,sync:publicEvents.value.sync}));if(publicEvents.value.warning)setNotice(publicEvents.value.warning);}setLoading(false);
  },[]);
  useEffect(()=>{void refresh('en');},[refresh]);
  useEffect(()=>{document.documentElement.lang=language==='en'?'en':'zh-CN';localStorage.setItem('honors-language',language);},[language]);
  function clearPrivate(){refreshId.current++;activeUser.current=null;setState(initial);setHours('0');setSelection(null);setNotice('');}
  async function authChanged(){clearPrivate();localStorage.setItem('honors-auth-change',JSON.stringify({nonce:crypto.randomUUID(),language}));await refresh(language);}
  useEffect(()=>{
    const changed=(event:StorageEvent)=>{if(event.key!=='honors-auth-change')return;let preferred:Language='zh';try{preferred=JSON.parse(event.newValue||'{}').language==='en'?'en':'zh';}catch{}clearPrivate();void refresh(preferred);};
    let checking=false,alive=true;
    const checkSession=async()=>{
      if(checking||document.visibilityState==='hidden')return;checking=true;
      const expected=activeUser.current;
      try{const response=await fetch('/api/auth/get-session?disableCookieCache=true',{cache:'no-store'});if(!response.ok)throw Error('Session check failed');const session=await response.json();if(alive&&expected===activeUser.current&&(session?.user?.emailVerified?session.user.email:null)!==expected){clearPrivate();await refresh();}}
      catch{if(alive&&expected===activeUser.current){clearPrivate();setNotice('登录服务暂时不可用，请稍后重试。');}}finally{checking=false;}
    };
    window.addEventListener('storage',changed);window.addEventListener('focus',checkSession);document.addEventListener('visibilitychange',checkSession);
    return()=>{alive=false;window.removeEventListener('storage',changed);window.removeEventListener('focus',checkSession);document.removeEventListener('visibilitychange',checkSession);};
  },[refresh]);
  async function changeLanguage(next:Language){const account=activeUser.current,before=language;setLanguage(next);localStorage.setItem('honors-language',next);if(state.session&&!await savePreferences({...state.preferences,language:next})&&account===activeUser.current)setLanguage(before);}
  const p=progress(items,state.records);
  function needLogin(){setNotice(t("请先登录以保存并同步私人记录。"));setSettings(true);}
  async function saveRecord(r:RecordEntry){
    if(!state.session){needLogin();return false;}
    if(activeUser.current!==state.session.email)return false;
    const account=activeUser.current;
    try{const response=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'record',accountEmail:account,record:{...r,expectedRevision:r.revision}})});const data=await response.json();if(!response.ok)throw Error(data.error);if(account!==activeUser.current)return false;setState(s=>({...s,preferences:data.preferences,records:[...s.records.filter(v=>v.eventKey!==r.eventKey),{...r,revision:data.revision}]}));setHours(String(data.preferences.hours));setNotice(t("记录已保存到 Neon，其他设备登录后可读取。"));return true;}catch(e){setNotice(e instanceof Error?e.message:t("保存失败，请重试。"));return false;}
  }
  async function savePreferences(preferences:Preferences){
    if(!state.session){needLogin();return false;}
    if(activeUser.current!==state.session.email)return false;
    const account=activeUser.current;
    try{const response=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'preferences',accountEmail:account,preferences})});const data=await response.json();if(!response.ok)throw Error(data.error);if(account!==activeUser.current)return false;setState(s=>({...s,preferences:{...preferences,email:s.session!.email,revision:data.revision}}));setNotice(t("设置已同步。"));return true;}catch(e){setNotice(e instanceof Error?e.message:t("设置保存失败。"));return false;}
  }
  function exportData(){const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),records:state.records,preferences:state.preferences},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='fiu-honors-progress.json';a.click();URL.revokeObjectURL(url);}
  async function importData(text:string){
    if(!state.session){needLogin();return false;}
    const importingAccount=state.session.email;
    const checkAccount=()=>{if(activeUser.current!==importingAccount)throw Error(t('账号已更改，请刷新后重试。'));};
    try{checkAccount();
      const backup=JSON.parse(text.replace(/^\uFEFF/,''));
      const records=validateBackup(backup,items,events,state.records);
      const prefs=backup.preferences;
      if(prefs&&(!Number.isFinite(prefs.hours)||prefs.hours<0||prefs.hours>10000||typeof prefs.weekly!=='boolean'||typeof prefs.deadlineReminders!=='boolean'||typeof prefs.eventFallback!=='boolean'))throw Error(t("备份的提醒或志愿小时设置无效。"));
      let saved=0;
      for(const r of records){checkAccount();if(!await saveRecord({...r,revision:r.expectedRevision} as RecordEntry)){setNotice(t("导入中断，前 {0} 条已保存，其余未保存。请刷新后重试。",{"0":saved}));return false;}checkAccount();saved++;}
      if(prefs){const response=await fetch('/api/state',{cache:'no-store'});if(!response.ok)throw Error(t("记录已导入，但读取最新设置失败，请刷新后重试。"));const latest=await response.json();checkAccount();if(!await savePreferences({...prefs,revision:latest.preferences.revision}))return false;}
      checkAccount();await refresh();checkAccount();setNotice(t("已从备份恢复 {0} 条记录{1}。",{"0":saved,"1":prefs?t("及提醒、志愿小时设置"):''}));return true;
    }catch(e){if(activeUser.current===importingAccount)setNotice(e instanceof Error?e.message:t("备份无法读取。"));return false;}
  }
  function recordFor(s:Selection){const key=s.event?`event:${s.event.id}`:`item:${s.item!.canonical}`;return state.records.find(r=>r.eventKey===key);}
  async function plan(s:Selection){const r=recordFor(s);const status=quickPlanStatus(r?.status) as RecordEntry['status'];if(status===r?.status)return;const item=s.item||recommendedItem(s.event!,items,state.records,new Date(),category==='all'?null:Number(category))||items.find(i=>i.id===s.event!.itemIds[0])!;await saveRecord({itemId:item.id,eventKey:s.event?`event:${s.event.id}`:`item:${item.canonical}`,status,category:item.category,date:r?.date||'',note:r?.note||'',deadline:r?.deadline||'',revision:r?.revision||0});}
  async function refreshSource(){if(!state.session){needLogin();return;}setRefreshing(true);try{const r=await fetch('/api/refresh',{method:'POST'});const d=await r.json();if(!r.ok)throw Error(d.error);await refresh();setNotice(t("已检查官方公开活动源，更新 {0} 场活动。需要登录的路径目录仍以保存快照为准。",{"0":d.updated}));}catch(e){setNotice(e instanceof Error?e.message:t("刷新失败，仍显示上次保存的数据。"));}setRefreshing(false);}
  const now=new Date();
  const filteredEvents=events.filter(e=>(category==='all'||e.itemIds.some(id=>items.find(i=>i.id===id)?.category===Number(category)))&&(!query||`${e.title} ${e.summary} ${summaryFor(e,language)}`.toLowerCase().includes(query.toLowerCase()))&&(!recommendOnly||eligible(e,items,state.records,now,time==='past')&&recommendedItem(e,items,state.records,now,category==='all'?null:Number(category)))&&(time==='past'?new Date(e.end||e.start)<now:new Date(e.end||e.start)>=now)).map(e=>({...e,category:recommendOnly?recommendedItem(e,items,state.records,now,category==='all'?null:Number(category))?.category??e.category:category==='all'?e.category:Number(category)}));
  const rows:Selection[]=time==='upcoming'||time==='past'?filteredEvents.sort((a,b)=>time==='past'?Date.parse(b.start)-Date.parse(a.start):Date.parse(a.start)-Date.parse(b.start)).map(event=>({event})):items.filter(i=>(category==='all'||i.category===Number(category))&&(!query||`${i.title} ${i.summary} ${summaryFor(i,language)}`.toLowerCase().includes(query.toLowerCase()))&&(time==='all'||time==='flexible'&&i.mode==='experience'||time==='undated'&&i.mode!=='experience'&&!events.some(e=>e.itemIds.includes(i.id)&&new Date(e.end||e.start)>=now))&&(!recommendOnly||eligible(i,items,state.records,now))).map(item=>({item}));
  const githubLink=<a className="github-link" href="https://github.com/mlt0727/fiu-honors-planner" target="_blank" rel="noopener noreferrer"><Icon name="github" size={19}/><span>{t("在 GitHub 上点星")}</span></a>;
  return <LocaleContext.Provider value={language}><div className="app-shell"><aside className="sidebar"><div className="brand"><strong>FIU</strong><span>Honors planner</span></div><nav aria-label={t("主导航")}>{[['activities','calendar',t("活动列表")],['progress','chart',t("我的进度")],['mail','mail',t("邮件预览")]].map(([id,icon,label])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon name={icon} size={24}/><span>{label}</span></button>)}</nav><div className="sidebar-footer"><span>2026 — 2027</span><small>Personal engagement planner</small>{githubLink}</div></aside><main className="main"><header className="page-header"><div><h1>{t("你的荣誉计划，一目了然。")}</h1><p>{t("四个分类，各完成 2 项。为有兴趣的活动留出时间。")}</p></div><div className="header-actions"><label className="language-picker"><span className="sr-only">{t('界面语言')}</span><select aria-label={t('界面语言')} value={language} onChange={e=>void changeLanguage(e.target.value as Language)}><option value="zh">{t("中文")}</option><option value="en">English</option></select></label><button className="button settings-button" onClick={()=>setSettings(true)}><Icon name="settings"/>{t("同步与设置")}</button></div></header><Progress items={items} records={state.records} onCategory={i=>{setPage('activities');setCategory(String(i));setTime('all');}}/>
    {notice&&<div className="status-message" role="status"><span>{t(notice)}</span><button aria-label={t("关闭提示")} className="icon-button" onClick={()=>setNotice('')}><Icon name="close" size={17}/></button></div>}
    {page==='activities'?<section className="activities"><div className="section-heading"><div><h2>{t("值得留意的活动")}</h2><p className="muted source-count">{t("128 个官方选项 · ")}{events.filter(e=>new Date(e.end||e.start)>=now).length}{t(" 场已核实的未来活动")}</p></div><div className="view-switch"><button className={`button ${view==='list'?'selected':''}`} onClick={()=>setView('list')}><Icon name="list" size={18}/>{t("列表视图")}</button><button className={`button ${view==='week'?'selected':''}`} onClick={()=>setView('week')}><Icon name="calendar" size={18}/>{t("周视图")}</button></div></div><div className="filters"><label className="search-field"><Icon name="search"/><input aria-label={t("搜索活动")} placeholder={t("搜索活动、主题或关键词")} value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label={t("分类")} value={category} onChange={e=>setCategory(e.target.value)}><option value="all">{t("所有分类")}</option>{CATEGORIES.map((name:string,i:number)=><option key={name} value={i}>{name}</option>)}</select><select aria-label={t("活动时间筛选")} value={time} onChange={e=>{setTime(e.target.value);setView('list');}}><option value="upcoming">{t("未来活动")}</option><option value="all">{t("全部 128 个选项")}</option><option value="flexible">{t("自行安排的经历")}</option><option value="undated">{t("日期尚未公布")}</option><option value="past">{t("已结束的活动")}</option></select></div><div className="filter-meta"><label className="check-label"><input type="checkbox" checked={recommendOnly} onChange={e=>setRecommendOnly(e.target.checked)}/>{t("只看尚需完成的分类与活动")}</label><span>{loading?t("读取记录中…"):state.session?t("私人进度已载入"):t("登录后同步个人进度")}</span></div>{view==='week'?<WeekView events={filteredEvents} onOpen={event=>setSelection({event})}/>:<div className="activity-list">{rows.map(s=><ActivityRow key={s.event?'event:'+s.event.id:s.item!.id} selection={s} record={recordFor(s)} onOpen={()=>setSelection(s)} onPlan={()=>void plan(s)}/>)}{!rows.length&&<div className="empty-state"><Icon name="calendar" size={36}/><h3>{t("这个筛选下暂无活动")}</h3><p>{t("试试全部选项、自行安排的经历，或查看下一周。")}</p><button className="button" onClick={()=>{setTime('all');setQuery('');setCategory('all');setRecommendOnly(false);}}>{t("查看全部 128 个选项")}</button></div>}</div>}</section>:page==='progress'?<section className="progress-page"><div className="section-heading"><div><h2>{t("我的进度")}</h2><p className="muted">{t("已参加 ")}{p.total}{t(" / 8 · 学校已认可 ")}{p.official} / 8</p></div><button className="button" onClick={exportData}><Icon name="download" size={17}/>{t("导出记录")}</button></div><div className="notice">{t("已参加的经历用于停止重复推荐；学校已认可由你按 Panther Connect 的审核结果标记。当前网站不会自动改动学校系统。")}</div><div className="service-hours"><div><h3>{t("志愿服务")}</h3><p className="muted">{t("每年另外完成 20 小时，并在 GivePulse 记录。")}</p></div><label>{t("已完成小时")}<input aria-label={t("志愿服务小时")} type="number" min="0" max="10000" step="0.5" value={hours} onChange={e=>setHours(e.target.value)}/></label><button className="button outline" onClick={()=>void savePreferences({...state.preferences,hours:Number(hours)})}>{t("保存小时")}</button><a href="https://fiu.givepulse.com" target="_blank" rel="noreferrer">{t("打开 GivePulse ")}<Icon name="external" size={14}/></a></div><div className="record-list">{state.records.filter(r=>r.status!=='none').map(r=>{const item=items.find(i=>i.id===r.itemId)!;const event=events.find(e=>`event:${e.id}`===r.eventKey);return <ActivityRow key={r.eventKey} selection={event?{event}:{item}} record={r} onOpen={()=>setSelection(event?{event}:{item})} onPlan={()=>void plan(event?{event}:{item})}/>;})}{!state.records.some(r=>r.status!=='none')&&<div className="empty-state"><h3>{t("从一场感兴趣的活动开始")}</h3><p>{t("在详情中保存计划、参加日期和学校认可状态。")}</p><button className="button outline" onClick={()=>setPage('activities')}>{t("浏览活动")}</button></div>}</div></section>:<MailPreview key={state.session?.email||'anonymous'} items={items} events={events} records={state.records} preferences={state.preferences} drafts={state.drafts} onSettings={()=>setSettings(true)}/>}
    <footer className="page-footer"><div><span>{t("来源：")}<a href="https://fiu.campuslabs.com/engage/involvement/paths#/4948/domain/18682" target="_blank" rel="noreferrer">Panther Connect</a>{t(" · 路径读取 2026.10.23")}</span><small>{state.sync?.lastSuccess?t("公开源刷新 {0}",{"0":formatTime(state.sync.lastSuccess,language)}):t("活动时间为已核实快照")}{state.sync?.error?t(" · 最近刷新失败"):''}</small></div>{githubLink}<button className="text-button" onClick={()=>void refreshSource()} disabled={refreshing}><Icon name="refresh" size={15}/>{refreshing?t("正在刷新…"):t("刷新公开活动")}</button><span>{t("个人记录与学校认定分别保存。")}</span></footer>
  </main>{selection&&<Details key={(state.session?.email||'anonymous')+(selection.event?'event:'+selection.event.id:'item:'+selection.item!.id)} selection={selection} items={items} events={events} records={state.records} onClose={()=>setSelection(null)} onSave={saveRecord} onSelect={setSelection}/>} {settings&&<Settings key={state.session?.email||'anonymous'} state={state} onClose={()=>setSettings(false)} onSave={savePreferences} onRefresh={authChanged} onExport={exportData} onImport={importData}/>}</div></LocaleContext.Provider>;
}
