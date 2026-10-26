import {useRef} from 'react';
import {useI18n} from './Locale';
import {gsap,useGSAP,reduced} from '@/lib/motion';
import {progress} from '@/lib/core.mjs';
import type {Item,RecordEntry} from '@/lib/types';
export default function Progress({items,records,onCategory}:{items:Item[];records:RecordEntry[];onCategory:(category:number)=>void}){
  const {t,language,categories:CATEGORIES}=useI18n();
  const p=progress(items,records);
  const band=useRef<HTMLElement>(null),prev=useRef<number[]>([]);
  const values=[...p.attended,p.total];
  useGSAP(()=>{
    band.current!.querySelectorAll<HTMLElement>('.num').forEach((el,i)=>{
      const from=prev.current[i]??0,to=values[i];
      if(from===to||reduced())return;
      gsap.fromTo(el,{textContent:from},{textContent:to,snap:{textContent:1},duration:.9,ease:'power2.out'});
      const cell=el.closest('.progress-cell');
      if(cell&&prev.current.length)gsap.fromTo(cell,{backgroundColor:'#f6ecd6'},{backgroundColor:'#ffffff',duration:1.2,clearProps:'backgroundColor'});
    });
    prev.current=values;
  },{dependencies:[values.join()],scope:band});
  return <section ref={band} className="progress-band" aria-label={t("四类参与进度")}>{CATEGORIES.map((name:string,i:number)=><button key={name} className="progress-cell" onClick={()=>onCategory(i)}><b>{name}</b><span><em className="num">{p.attended[i]}</em> / 2</span><div className="track"><i style={{'--w':p.attended[i]/2} as React.CSSProperties}/></div><small>{t("学校已认可 ")}{p.accepted[i]} / 2</small></button>)}<div className="progress-total"><strong><em className="num">{p.total}</em> / 8</strong><span>{t("已参加")}</span></div></section>;
}
