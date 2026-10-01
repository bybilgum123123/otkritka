'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig, useReducedMotion, useScroll } from 'motion/react';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, X } from 'lucide-react';
import { useLoveContent } from '@/components/ContentProvider';
import Intro from './sections/Intro';
import { LoveMessage, ThingsILove } from './sections/Messages';
import PhotoStory from './sections/PhotoStory';
import Letter from './sections/Letter';
import { Surprise, FinalMessage } from './sections/Ending';
import Photo from './ui/Photo';
import Button from './ui/Button';

export default function Keepsake({ hasMusic }: { hasMusic: boolean }) {
 const c = useLoveContent();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const [toast, setToast] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const dialogOpen = selected !== null;

  const secret = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }, []);

  const movePhoto = useCallback((delta: number) => {
    setSelected(index => index === null ? null : (index + delta + c.photos.length) % c.photos.length);
  }, [c.photos.length]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (openingTimer.current) clearTimeout(openingTimer.current);
  }, []);

  useEffect(() => {
    if (!dialogOpen) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        movePhoto(event.key === 'ArrowRight' ? 1 : -1);
      }
      if (event.key === 'Tab') {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.lightbox button'));
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus({ preventScroll: true });
    };
  }, [dialogOpen, movePhoto]);

  const playMusic = async () => {
    if (!hasMusic) { secret(c.ui.musicMissing); return; }
    try {
      await audio.current?.play();
      setSound(true);
      sessionStorage.setItem('love-sound', 'on');
    } catch { setSound(false); }
  };

  const toggleSound = () => {
    if (sound) {
      audio.current?.pause(); setSound(false);
      sessionStorage.setItem('love-sound', 'off');
    } else void playMusic();
  };

  const openCard = () => {
    setOpen(true);
    if (sessionStorage.getItem('love-sound') !== 'off' && hasMusic) void playMusic();
    openingTimer.current = setTimeout(() => {
      const message = document.getElementById('message');
      message?.focus({ preventScroll: true });
      message?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
    }, reduce ? 0 : 650);
  };

  const restart = () => {
    if (openingTimer.current) clearTimeout(openingTimer.current);
    setSelected(null); setOpen(false);
    window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.open-button')?.focus({ preventScroll: true }));
  };

  return <MotionConfig reducedMotion="user"><main>
    <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} />
    <div className="keepsake-content" inert={dialogOpen}>
      <Button tone="icon" className="sound-toggle" onClick={toggleSound} aria-label={sound ? c.ui.soundOn : c.ui.soundOff} title={sound ? c.ui.soundOn : c.ui.soundOff} aria-pressed={sound}>
        {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
      </Button>
      {hasMusic && <audio ref={audio} src="/music.mp3" loop preload="none" onError={() => { setSound(false); secret(c.ui.musicMissing); }} />}
      <Intro open={open} onOpen={openCard} secret={secret} />
      {open && <div className="story"><LoveMessage /><ThingsILove /><PhotoStory select={setSelected} /><Letter /><Surprise secret={secret} /><FinalMessage restart={restart} secret={secret} /></div>}
    </div>
    <AnimatePresence>{toast && <motion.div className="secret-toast" role="status" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{toast}</motion.div>}</AnimatePresence>
    <AnimatePresence>{selected !== null && <motion.div
      className="lightbox" role="dialog" aria-modal="true" aria-label={c.photos[selected].caption}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => setSelected(null)}
      onTouchStart={event => { touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={event => {
        const dx = event.changedTouches[0].clientX - touchStart.current.x;
        const dy = event.changedTouches[0].clientY - touchStart.current.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) movePhoto(dx < 0 ? 1 : -1);
      }}
    >
      <Button ref={closeRef} tone="icon" className="lightbox-close" aria-label={c.ui.closePhoto} title={c.ui.closePhoto} onClick={() => setSelected(null)}><X size={22} /></Button>
      <Button tone="icon" className="lightbox-prev" aria-label={c.ui.previous} title={c.ui.previous} onClick={event => { event.stopPropagation(); movePhoto(-1); }}><ArrowLeft size={22} /></Button>
      <motion.div className="lightbox-photo" key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={event => event.stopPropagation()} onDoubleClick={() => secret(c.secrets.photo)}>
        <Photo index={selected} full />
        <span className="lightbox-caption">{c.photos[selected].caption}<small>{selected + 1} {c.ui.photoCount} {c.photos.length}</small></span>
      </motion.div>
      <Button tone="icon" className="lightbox-next" aria-label={c.ui.next} title={c.ui.next} onClick={event => { event.stopPropagation(); movePhoto(1); }}><ArrowRight size={22} /></Button>
    </motion.div>}</AnimatePresence>
  </main></MotionConfig>;
}

