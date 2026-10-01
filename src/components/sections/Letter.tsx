'use client';
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoveContent } from '@/components/ContentProvider';
import Button from '../ui/Button';

export default function Letter() {
 const c = useLoveContent();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const toggle = () => setOpen(value => !value);
  return <section className={`letter-section ${open ? 'letter-is-open' : ''}`}>
    <h2>{c.letter.title}</h2><p className="handwritten">{c.letter.hint}</p>
    <div className="envelope-scene">
      <motion.div className="letter-reveal" initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0, marginBottom: open ? -24 : 0 }} transition={{ duration: reduce ? 0 : .7, ease: [.22, 1, .36, 1] }}>
        <motion.article id="personal-letter" className="paper-letter" aria-hidden={!open} inert={!open} initial={false} animate={{ y: open ? 0 : 24 }} transition={{ duration: reduce ? 0 : .7 }}>
          <span className="letter-mark">{c.ui.letterMark}</span><h3>{c.letter.greeting}</h3>
          {c.letter.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <span className="signature">{c.letter.signature} ♡</span>
        </motion.article>
      </motion.div>
      <div className="envelope-pocket">
        <div className="envelope-back"/>
        <motion.div className="envelope-flap" aria-hidden="true" initial={false} animate={{ rotateX: open && !reduce ? 180 : 0, opacity: open && reduce ? 0 : 1 }} transition={{ duration: reduce ? 0 : .5 }} style={{ zIndex: open ? 0 : 4 }}/>
        <div className="envelope-front"><span>{c.letter.recipient}</span></div>
        <Button tone="icon" className="wax-seal" aria-label={open ? c.letter.close : c.letter.open} aria-expanded={open} aria-controls="personal-letter" onClick={toggle}><Heart size={22} strokeWidth={1.5}/></Button>
      </div>
    </div>
    <Button className="letter-button" aria-expanded={open} aria-controls="personal-letter" onClick={toggle}>{open ? c.letter.close : c.letter.open}{open ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</Button>
  </section>;
}

