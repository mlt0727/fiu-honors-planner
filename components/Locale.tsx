'use client';
import {createContext,useContext} from 'react';
import {text,categoryNames} from '@/lib/i18n.mjs';
import type {Language} from '@/lib/types';
export const LocaleContext=createContext<Language>('zh');
export function useI18n(){
  const language=useContext(LocaleContext);
  return {language,t:(key:string,values:Record<string,unknown>={})=>text(key,language,values),categories:categoryNames(language)};
}
