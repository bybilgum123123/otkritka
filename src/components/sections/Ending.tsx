'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Heart, ArrowUp } from 'lucide-react';
import { useLoveContent } from '@/components/ContentProvider';
import Button from '../ui/Button';
export function Surprise({ secret }: { secret: (s: string) => void }) {
 const c = useLoveContent();
 const [clicks, setClicks] = useState(0); const reduce = useReducedMotion(); const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
 const clear = () => { if (hold.current) clearTimeout(hold.current); };
 useEffect(() => () => { if (hold.current) clearTimeout(hold.current); }, []);
 return <section className="surprise"><p>{c.surprise.lead}</p><div className="surprise-stage"><AnimatePresence mode="wait">{clicks < 3 ? <motion.div key="button" className="surprise-button-wrap" animate={{ x: reduce ? 0 : clicks === 1 ? 24 : clicks === 2 ? -22 : 0, y: reduce ? 0 : clicks === 1 ? -8 : clicks === 2 ? 12 : 0 }} transition={{ type: 'spring', stiffness: 190, damping: 16 }}><Button tone="primary" className="outline-button" onPointerDown={() => { clear(); hold.current = setTimeout(() => secret(c.secrets.hold), 900); }} onPointerUp={clear} onPointerLeave={clear} onPointerCancel={clear} onClick={() => setClicks(n => n + 1)}>{c.surprise.button}<Heart size={16}/></Button><span className="tease" aria-live="polite">{clicks ? c.surprise.teasing[clicks - 1] : ''}</span></motion.div> : <motion.div key="love" initial={{ opacity: 0, scale: reduce ? 1 : .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7 }}><span className="handwritten">{c.surprise.surrender}</span><h2>{c.surprise.title}</h2><p>{c.surprise.note}</p>{!reduce && Array.from({ length: 8 }, (_, i) => <motion.span className="love-spark" key={i} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(i * Math.PI / 4) * 120, y: Math.sin(i * Math.PI / 4) * 130, opacity: 0 }} transition={{ duration: 1.6, delay: .1 }}>✧</motion.span>)}</motion.div>}</AnimatePresence></div></section>;
}
export function FinalMessage({ restart, secret }: { restart: () => void; secret: (s: string) => void }) {
 const c = useLoveContent();
 const count = useRef(0);
 return <footer className="final"><span className="final-note">{c.ui.loveMark}</span><h2>{c.final.title}</h2><p>{c.final.subtitle}</p><span className="signature">{c.final.signature}</span><Button tone="icon" className="final-heart" aria-label={c.ui.seal} onClick={() => { count.current++; if (count.current >= 3) secret(c.secrets.heart); }}><Heart size={28} strokeWidth={1}/></Button><Button className="restart" onClick={restart}>{c.final.restart}<ArrowUp size={15}/></Button></footer>;
}
