import {sql,loadEvents} from './db';
import {parseFeed} from './feed.mjs';
import items from '@/data/items.json';
export async function refreshPublicEvents(){
  try{
    const response=await fetch('https://fiu.campuslabs.com/engage/events.rss',{cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error('官方源暂时无法读取');
    const content=await response.text();
    const events=parseFeed(content,await loadEvents(),items);
    for(const event of events)await sql()`insert into honors_planner.events(id,data) values(${event.id},${JSON.stringify(event)}) on conflict(id) do update set data=excluded.data`;
    await sql()`insert into honors_planner.sync_log(id,last_success,last_attempt,error) values(true,now(),now(),null) on conflict(id) do update set last_success=now(),last_attempt=now(),error=null`;
    return {updated:events.length};
  }catch{
    await sql()`insert into honors_planner.sync_log(id,last_attempt,error) values(true,now(),'公开活动源刷新失败；保留最后一次已核实数据。') on conflict(id) do update set last_attempt=now(),error=excluded.error`;
    throw Error('公开活动源刷新失败，仍保留最后一次已核实的数据。');
  }
}
