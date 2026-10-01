'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { Eye, EyeOff, Heart, LockKeyhole, LoaderCircle } from 'lucide-react';
import Button from './ui/Button';

export default function PasswordGate() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const input = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError('');
    try {
      const response = await fetch('/api/access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.current?.value ?? '' }),
        credentials: 'same-origin', cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'неа, попробуй ещё раз 🤭');
        setPending(false);
        requestAnimationFrame(() => input.current?.focus());
        return;
      }
      if (input.current) input.current.value = '';
      setUnlocked(true);
    } catch {
      setError('Не получилось открыть. Попробуй ещё раз.');
      setPending(false);
    }
  }

  return <main className="password-gate">
    <motion.section className="gate-content" aria-label="Вход в открытку"
      animate={unlocked ? { opacity: 0, y: reduce ? 0 : -8, filter: reduce ? 'none' : 'blur(6px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: reduce ? .15 : .5, ease: [.22, 1, .36, 1] }}
      onAnimationComplete={() => { if (unlocked) router.refresh(); }}
    >
      <span className="gate-heart" aria-hidden="true"><Heart size={27} strokeWidth={1.2} /></span>
      <h1>сюда только<br />лапули 🤍</h1>
      <p className="gate-note" id="password-hint">введи секретное словечко</p>
      <form onSubmit={submit} aria-busy={pending}>
        <label htmlFor="love-password" className="sr-only">Секретное словечко</label>
        <motion.div className={`password-field ${error ? 'has-error' : ''}`}
          animate={{ x: error && !reduce ? [0, -5, 5, -3, 3, 0] : 0 }}
          transition={{ duration: .35 }}
        >
          <LockKeyhole className="password-lock" size={17} aria-hidden="true" />
          <input ref={input} id="love-password" name="password" type={visible ? 'text' : 'password'}
            autoComplete="current-password" autoCapitalize="none" spellCheck={false} required maxLength={512}
            aria-describedby={`password-hint${error ? ' password-error' : ''}`} aria-invalid={Boolean(error)} disabled={pending}
            onChange={() => { if (error) setError(''); }}
          />
          <Button tone="icon" className="password-visibility" onClick={() => setVisible(value => !value)}
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'} aria-pressed={visible} title={visible ? 'Скрыть пароль' : 'Показать пароль'}
          >{visible ? <EyeOff size={20} /> : <Eye size={20} />}</Button>
        </motion.div>
        <div className="gate-error" id="password-error" role="status" aria-live="polite">{error}</div>
        <Button tone="primary" type="submit" className="gate-submit" disabled={pending}>
          {pending ? <LoaderCircle size={18} className="gate-spinner" aria-hidden="true" /> : null}
          {unlocked ? 'открываю…' : 'открыть открытку'}
        </Button>
      </form>
    </motion.section>
  </main>;
}
