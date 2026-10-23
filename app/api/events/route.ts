import {loadEvents} from '@/lib/db';
import seed from '@/data/events.json';
import {NextResponse} from 'next/server';
export async function GET(){try{return NextResponse.json({events:await loadEvents()});}catch{return NextResponse.json({events:seed,warning:'实时数据读取失败，当前显示已核实的保存快照。'},{status:200});}}
