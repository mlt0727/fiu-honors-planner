'use client';
import {useCallback,useRef,type RefObject} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {SplitText} from 'gsap/SplitText';
import {Flip} from 'gsap/Flip';

gsap.registerPlugin(useGSAP,SplitText,Flip);
gsap.defaults({ease:'power3.out',duration:.5});
if(process.env.NODE_ENV!=='production'&&typeof window!=='undefined')(window as unknown as {gsap:typeof gsap}).gsap=gsap;

export {gsap,useGSAP,SplitText,Flip};
export const reduced=()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Opens a <dialog> with a staged entrance and returns a close() that reverses it before unmounting. */
export function useDialogMotion(dialog:RefObject<HTMLDialogElement|null>,onClose:()=>void){
  const tl=useRef<ReturnType<typeof gsap.timeline>|null>(null);
  useGSAP(()=>{
    const d=dialog.current;if(!d)return;
    d.showModal();
    // A close the browser performed itself (e.g. Escape when preventDefault is refused) must still unmount; closes from our own cleanup leave `open` true after a remount and are ignored.
    const nativeClose=()=>{if(!d.open)onClose();};
    d.addEventListener('close',nativeClose);
    if(!reduced())tl.current=gsap.timeline().from(d,{y:28,scale:.97,autoAlpha:0,duration:.45}).from(d.querySelectorAll('.dialog-content > *'),{y:14,autoAlpha:0,duration:.4,stagger:.045},'-=.25');
    return()=>{d.removeEventListener('close',nativeClose);d.close();};
  },{scope:dialog});
  return useCallback(()=>{
    const d=dialog.current;
    if(!d||reduced()){onClose();return;}
    tl.current?.kill();
    gsap.to(d,{y:14,scale:.98,autoAlpha:0,duration:.22,ease:'power2.in',overwrite:true,onComplete:onClose});
  },[dialog,onClose]);
}
