'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Marca o bloco com `data-loops="on"` só enquanto ele está na tela. Animações
 * contínuas lá dentro usam `in-data-[loops=off]:[animation-play-state:paused]`
 * para não rodarem fora da vista.
 */
export function InViewLoops({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '10% 0px',
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-loops={visible ? 'on' : 'off'} className={className}>
      {children}
    </div>
  );
}
