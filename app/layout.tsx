import type {Metadata} from 'next';
import {Inter,Instrument_Serif} from 'next/font/google';
import './globals.css';
const inter=Inter({subsets:['latin'],display:'swap',variable:'--font-inter'});
const serif=Instrument_Serif({subsets:['latin'],weight:'400',style:['normal','italic'],display:'swap',variable:'--font-display'});
export const metadata:Metadata={title:'FIU Honors Planner',description:'FIU Honors activities, personal progress and reminder previews',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" className={`${inter.variable} ${serif.variable}`}><body>{children}</body></html>;}
