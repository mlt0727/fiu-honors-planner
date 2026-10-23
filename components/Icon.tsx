export default function Icon({name,size=20}:{name:string;size?:number}){
  const paths:Record<string,React.ReactNode>={
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
    chart:<><path d="M5 20V11M12 20V4M19 20V8"/></>,
    mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></>,
    settings:<><path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></>,
    search:<><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    pin:<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    bookmark:<path d="M6 3h12v19l-6-4-6 4Z"/>,
    list:<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
    close:<path d="m6 6 12 12M6 18 18 6"/>,
    check:<path d="m5 12 4 4L20 5"/>,
    arrow:<path d="m9 5 7 7-7 7"/>,
    refresh:<><path d="M20 8a9 9 0 1 0 1 7M20 3v5h-5"/></>,
    download:<><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
    external:<><path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.calendar}</svg>;
}
