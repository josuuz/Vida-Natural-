'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from './CartProvider';
import type { ProductSummary } from '@/lib/types';

type Props = {
  product: Pick<ProductSummary, 'slug' | 'available' | 'name'>;
  quantity?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'soft';
  className?: string;
  label?: string;
};

const sizes = {
  sm: 'h-9 px-4 text-[0.8rem]',
  md: 'h-11 px-6 text-[0.88rem]',
  lg: 'h-13 px-7 text-[0.95rem] sm:h-14',
};

const variants = {
  solid: 'bg-forest-700 text-cream-50 hover:bg-forest-800',
  outline: 'border border-forest-700/30 text-forest-800 hover:border-forest-700 hover:bg-forest-700 hover:text-cream-50',
  soft: 'bg-forest-800/95 text-cream-50 backdrop-blur-sm hover:bg-forest-700',
};

/** Adiciona ao carrinho sem recarregar a página e confirma na hora. */
export function AddToCartButton({
  product,
  quantity = 1,
  size = 'md',
  variant = 'solid',
  className = '',
  label = 'Adicionar ao carrinho',
}: Props) {
  const { add } = useCart();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), 1600);
    return () => window.clearTimeout(timer);
  }, [done]);

  if (!product.available) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-line text-ink-muted ${sizes[size]} ${className}`}
      >
        Indisponível
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add(product.slug, quantity);
        setDone(true);
      }}
      aria-label={`${label}: ${product.name}`}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sizes[size]} ${variants[variant]} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span
            key="ok"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="inline-flex items-center gap-2"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path d="m3 8.4 3.2 3.2L13 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Adicionado
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
