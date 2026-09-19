'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

type ParallaxProps = {
  children: ReactNode;
  /** Deslocamento total em pixels ao longo da travessia do elemento. */
  distance?: number;
  /** Escala aplicada no fim do percurso (1 = sem zoom). */
  scaleTo?: number;
  className?: string;
};

/**
 * Parallax leve: o elemento se desloca no eixo Y enquanto cruza a viewport.
 * Desligado quando o usuário pede menos movimento.
 */
export function Parallax({ children, distance = 60, scaleTo = 1, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.35 });
  const y = useTransform(smooth, [0, 1], [distance, -distance]);
  const scale = useTransform(smooth, [0, 1], [1, scaleTo]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, scale }} className="will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
