import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
const inter=Inter({subsets:['latin'],display:'swap',variable:'--font-inter'});
export const metadata:Metadata={title:'FIU Honors Planner',description:'FIU Honors activities, personal progress and reminder previews',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={inter.variable}><body>{children}</body></html>;}
