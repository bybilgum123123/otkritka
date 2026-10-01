'use client';
import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion, AnimatePresence } from 'motion/react';
import { useLoveContent } from '@/components/ContentProvider';
export function LoveMessage() {
 const c = useLoveContent();
 const reduce = useReducedMotion();
 return <section id="message" className="love-message" tabIndex={-1}><span className="small-mark">♡</span><motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: reduce ? 0 : 1 }}>{c.message.lead}</motion.h2><motion.div initial={{ opacity: 0, y: reduce ? 0 : 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .6 }} transition={{ duration: .9 }}><h3>{c.message.title}</h3><p>{c.message.body}</p></motion.div><span className="scroll-note">{c.message.next}</span></section>;
}
export function ThingsILove() {
 const c = useLoveContent();
 const ref = useRef<HTMLElement>(null); const reduce = useReducedMotion(); const [active, setActive] = useState(0); const activeRef = useRef(0);
 const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
 const rotation = useTransform(scrollYProgress, [0, 1], [-12, 12]);
 useMotionValueEvent(scrollYProgress, 'change', v => {
  const next = Math.max(0, Math.min(c.things.length - 1, Math.floor(v * c.things.length)));
  if (next !== activeRef.current) { activeRef.current = next; setActive(next); }
 });
 return <section ref={ref} className={`things ${reduce ? 'reduced' : ''}`}><div className="things-sticky"><p>{c.thingsTitle}</p><motion.div className="line-heart" style={reduce ? {} : { rotate: rotation }} aria-hidden="true">♡</motion.div>{reduce ? <div className="things-static">{c.things.map(t => <h3 key={t}>{t}</h3>)}</div> : <div className="phrase-stage"><AnimatePresence mode="wait"><motion.h3 key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .35 }}>{c.things[active]}</motion.h3></AnimatePresence></div>}<div className="phrase-dots" aria-hidden="true">{c.things.map((_, i) => <span key={i} className={i === active ? 'active' : ''}/>)}</div><span className="handwritten">{c.ui.scroll}</span></div></section>;
}


