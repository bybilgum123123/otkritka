'use client';
import { motion, useReducedMotion } from 'motion/react';
import { useLoveContent } from '@/components/ContentProvider';
import Photo from '../ui/Photo';
export default function PhotoStory({ select }: { select: (i: number) => void }) {
 const c = useLoveContent();
 const reduce = useReducedMotion();
 return <section className="photo-story"><div className="photo-heading"><h2>{c.photosTitle}</h2><p>{c.photosNote}</p><span className="handwritten">{c.photosHint}</span></div><div className="photo-album">{c.photos.map((photo, i) => <motion.button key={photo.src} className={`memory memory-${i}`} onClick={() => select(i)} aria-label={`${c.ui.viewPhoto} ${photo.caption}`} style={{ rotate: reduce ? 0 : [-6, 5, -3, 4, -5, 3][i] }} whileHover={reduce ? {} : { rotate: 0, y: -9, scale: 1.025, zIndex: 3 }} whileTap={{ scale: .98 }}><div className="tape"/><div className="memory-image"><Photo index={i}/></div><span className="handwritten">{photo.caption}</span></motion.button>)}</div></section>;
}
