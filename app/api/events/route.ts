import {loadEvents,sql} from '@/lib/db';
import seed from '@/data/events.json';
import {NextResponse} from 'next/server';
export async function GET(){try{const [events,sync]=await Promise.all([loadEvents(),sql()`select last_success as "lastSuccess",last_attempt as "lastAttempt",error from honors_planner.sync_log where id=true`]);return NextResponse.json({events,sync:sync[0]||{lastSuccess:null,lastAttempt:null,error:null}});}catch{return NextResponse.json({events:seed,warning:'实时数据读取失败，当前显示已核实的保存快照。'},{status:200});}}
