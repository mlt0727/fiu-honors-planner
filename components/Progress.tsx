import {useI18n} from './Locale';
import {progress} from '@/lib/core.mjs';
import type {Item,RecordEntry} from '@/lib/types';
export default function Progress({items,records,onCategory}:{items:Item[];records:RecordEntry[];onCategory:(category:number)=>void}){
  const {t,language,categories:CATEGORIES}=useI18n();
  const p=progress(items,records);
  return <section className="progress-band" aria-label={t("四类参与进度")}>{CATEGORIES.map((name:string,i:number)=><button key={name} className="progress-cell" onClick={()=>onCategory(i)}><b>{name}</b><span>{p.attended[i]} / 2</span><div className="track"><i style={{width:`${p.attended[i]*50}%`}}/></div><small>{t("学校已认可 ")}{p.accepted[i]} / 2</small></button>)}<div className="progress-total"><strong>{p.total} / 8</strong><span>{t("已参加")}</span></div></section>;
}
