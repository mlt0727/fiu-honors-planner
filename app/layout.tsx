import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'FIU Honors Planner',description:'私人 Honors engagement 活动清单、进度与提醒预览',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
