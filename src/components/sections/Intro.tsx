'use client';
import { motion, useReducedMotion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useLoveContent } from '@/components/ContentProvider';
import Photo from '../ui/Photo';
import Button from '../ui/Button';
export default function Intro({ open, onOpen, secret }: { open: boolean; onOpen: () => void; secret: (s: string) => void }) {
 const c = useLoveContent();
 const reduce = useReducedMotion();
 return <section className={`intro ${open ? 'is-open' : ''}`} aria-label="Открытка для Лапули">
  <div className="intro-top"><span>{c.intro.corner}</span><Button tone="icon" className="tiny-heart" aria-label={c.ui.seal} onClick={() => secret(c.secrets.stamp)}><Heart size={17} strokeWidth={1.5}/></Button></div>
  <motion.div className="intro-photo intro-photo-left" initial={{ opacity: 0, rotate: -14, y: 35 }} animate={{ opacity: open ? 0 : 1, rotate: -11, y: 0 }} transition={{ duration: reduce ? 0 : 1.3, delay: .25 }}><div className="tape"/><div className="intro-photo-image"><Photo index={1} priority/></div><span>{c.photos[1].caption}</span></motion.div>
  <motion.div className="intro-photo intro-photo-right" initial={{ opacity: 0, rotate: 15, y: 35 }} animate={{ opacity: open ? 0 : 1, rotate: 9, y: 0 }} transition={{ duration: reduce ? 0 : 1.3, delay: .4 }}><div className="tape"/><div className="intro-photo-image"><Photo index={0} priority/></div><span>{c.photos[0].caption}</span></motion.div>
  <motion.div className="intro-center" animate={open ? { opacity: 0, y: -30, filter: reduce ? 'none' : 'blur(12px)' } : { opacity: 1 }} transition={{ duration: .65 }}>
   <motion.p className="intro-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>{c.intro.note}</motion.p>
   <h1 aria-label={c.intro.title}>{c.intro.title.split('\n').map((line, i) => <motion.span key={line} initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: .4 + i * .18, duration: 1 }}>{line}</motion.span>)}</h1>
   <p className="intro-subtitle">{c.intro.subtitle}</p>
   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 1 }}><Button tone="primary" className="open-button" onClick={onOpen} disabled={open}>{c.intro.open}<svg width="21" height="19" viewBox="0 0 24 20" fill="none" aria-hidden="true"><rect x="1" y="2" width="22" height="16" rx="2" stroke="currentColor"/><path d="m2 3 10 8L22 3" stroke="currentColor"/></svg></Button></motion.div>
  </motion.div>
  <svg className="intro-doodle" width="110" height="80" viewBox="0 0 110 80" fill="none" aria-hidden="true"><path d="M6 65C40 58 67 26 50 21C31 15 30 61 74 57M63 48l12 10-13 8M81 20c-15-24-35 0 0 17 30-18 15-37 0-17Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
  <div className="intro-bottom"><span>{c.intro.footer}</span><span className="handwritten">{c.ui.loveMark} ♡</span></div>
  {open && <motion.div className="opening-glow" initial={{ opacity: 0 }} animate={{ opacity: [0, .8, 0] }} transition={{ duration: 1.2 }}/>}
 </section>;
}


