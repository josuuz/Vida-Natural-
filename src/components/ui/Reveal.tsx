'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ElementType, ReactNode } from 'react';

type RevealProps = {
  children: ReactNode;
  /** Atraso em segundos — usado para escalonar itens de uma grade. */
  delay?: number;
  /** Deslocamento inicial em pixels. */
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'header' | 'figure' | 'span';
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Entrada suave quando o elemento chega à viewport. */
export function Reveal({ children, delay = 0, y = 28, className, as = 'div' }: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as] as ElementType;

  return (
    <Component
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px -10% 0px' }}
      transition={{ duration: 0.75, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}

/** Variante para títulos: entra um pouco mais lenta e com menos deslocamento. */
export function RevealText({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
