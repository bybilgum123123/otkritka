'use client';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
type ButtonProps = HTMLMotionProps<'button'> & { tone?: 'primary' | 'secondary' | 'icon' | 'quiet' };
export default function Button({ tone = 'secondary', className = '', children, ...props }: ButtonProps) {
  const reduce = useReducedMotion();
  return <motion.button type="button" className={`button button-${tone} ${className}`} whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: .97 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} {...props}>{children}</motion.button>;
}
