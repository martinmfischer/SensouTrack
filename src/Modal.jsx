import React,{useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export function Modal({title,onClose,children}){
  const ref=useRef(null);
  useEffect(()=>{const el=ref.current,previous=document.activeElement;el.showModal();return()=>{el.close();previous?.focus();};},[]);
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={event=>{if(event.target===ref.current)onClose();}}><div className="modal-head"><span className="eyebrow">SENSOU / BUSHIDO</span><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} aria-hidden="true"/></button></div><h2>{title}</h2>{children}</dialog>;
}
