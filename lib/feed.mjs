import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {normalizeTitle} from './core.mjs';
const entities={amp:'&',nbsp:' ',lt:'<',gt:'>',quot:'"',apos:"'",mdash:'\u2014',ndash:'\u2013',rsquo:'\u2019',lsquo:'\u2018',rdquo:'\u201d',ldquo:'\u201c',hellip:'\u2026'};
const plain=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(all,code)=>code[0]==='#'?String.fromCodePoint(parseInt(code.slice(1).replace(/^x/i,''),/^#x/i.test(code)?16:10))||all:entities[code.toLowerCase()]??all).replace(/\s+/g,' ').trim();
export function parseFeed(xml,existing,items){
  if(xml.length>3_000_000||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw Error('官方活动源格式异常');
  const parsed=new XMLParser({ignoreAttributes:false,processEntities:false}).parse(xml);
  let entries=parsed.rss?.channel?.item||[];if(!Array.isArray(entries))entries=[entries];
  const results=[];
  for(const entry of entries){
    const url=String(entry.link||'');if(!/^https:\/\/fiu\.campuslabs\.com\/engage\/event\/\d+$/.test(url))continue;
    const id=url.split('/').at(-1),title=plain(entry.title),known=existing.find(e=>e.id===id);
    const matched=items.filter(i=>i.mode==='event'&&normalizeTitle(i.title)===normalizeTitle(title));
    if(!known&&!matched.length)continue;
    const html=String(entry.description||'').replace(/<div class="p-name summary">[\s\S]*?<\/div>/i,'');
    const start=html.match(/<time[^>]*class="[^"]*dt-start[^>]*datetime="([^"]+)"/i)?.[1];
    const end=html.match(/<time[^>]*class="[^"]*dt-end[^>]*datetime="([^"]+)"/i)?.[1];
    if(!start||!Number.isFinite(Date.parse(start)))continue;
    const text=plain(html),brief=text.length>240?text.slice(0,237)+'\u2026':text;
    const location=plain(html.match(/<span[^>]*class="[^"]*p-location[^>]*>([\s\S]*?)<\/span>/i)?.[1]);
    results.push({...known,id,title:known?.title||title,itemIds:known?.itemIds||matched.map(i=>i.id),category:known?.category??matched[0].category,summary:known?.summary||matched[0].summary,summaryEn:known?.summaryEn||(known?undefined:brief),description:text,start:new Date(start).toISOString(),end:end&&Number.isFinite(Date.parse(end))?new Date(end).toISOString():null,location:location||known?.location||'地点待确认',deadline:known?.deadline||null,sourceUrl:url,sourceCheckedAt:new Date().toISOString(),creditVerified:known?known.creditVerified!==false:false,sourceNote:known?.sourceNote||(!known?'仅按官方活动标题匹配，Honors 认可仍需在路径页面核实。':undefined)});
  }
  return results;
}
