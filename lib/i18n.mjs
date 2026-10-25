import en from '../data/ui.en.json' with {type:'json'};
export const categoryNames=(language='zh')=>language==='en'?['Academic & Research','Career Development','Personal & Social Wellness','Honors College Week']:['学术与研究','职业发展','身心与社交','Honors College Week'];
export function text(key,language='zh',values={}){
  const value=String(key||'');
  const translated=language==='en'?(en[value.trim()]||value.trim()):value.trim();
  return (value.match(/^\s*/)?.[0]||'')+translated.replace(/\{([^}]+)\}/g,(all,name)=>values[name]===undefined?all:String(values[name]))+(value.match(/\s*$/)?.[0]||'');
}
export function summaryFor(item,language='zh'){
  if(language!=='en')return item.summary;
  if(item.sourceIssue)return 'Use the service named in the title. The official description appears inconsistent; confirm credit with Honors College.';
  const original=item.summaryEn||item.description||'See the official page for the activity description and participation requirements.';
  return original.length>420?original.slice(0,417)+'…':original;
}
export function sourceNoteFor(note,language='zh'){
  if(!note||language!=='en'||!/[\u3400-\u9fff]/.test(note))return note;
  return 'Check eligibility, category attribution and any conflicting details on the official Honors pathway page. One event counts only once.';
}
export function locationFor(value,language='zh'){
  if(language!=='en'||!/[\u3400-\u9fff]/.test(value||''))return value;
  if(value?.includes('DM 353'))return 'DM 353 / DM 363 — confirm the room on the official page';
  return 'Location to be confirmed on the official page';
}
