'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { formatPrice, formatSize } from '@/lib/format';
import type { CategorySummary, ProductSummary } from '@/lib/types';

export function SearchOverlay({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategorySummary[];
}) {
  const [term, setTerm] = useState('');
  const [allResults, setAllResults] = useState<ProductSummary[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  // a busca roda no servidor, contra o catálogo do banco
  const query = term.trim();
  // resultados só valem para o termo atual; com a busca vazia nem consultamos
  const results = query ? allResults : [];

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { results: ProductSummary[] };
        setAllResults(data.results);
      } catch {
        // busca cancelada ou offline — a lista simplesmente não muda
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Buscar produtos">
          <motion.button
            type="button"
            aria-label="Fechar busca"
            onClick={onClose}
            className="absolute inset-0 h-full w-full cursor-default bg-forest-950/50 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className="absolute inset-x-0 top-0 bg-cream-50 shadow-deep"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
          >
            <div className="container-page py-6 sm:py-8">
              <div className="flex items-center gap-3 border-b border-line pb-4">
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-honey-700" aria-hidden>
                  <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  type="search"
                  placeholder="Buscar mel, própolis, espécie de abelha…"
                  className="w-full bg-transparent py-2 font-display text-xl text-forest-900 outline-none placeholder:text-ink-muted/60 sm:text-2xl"
                  aria-label="Buscar produtos"
                />
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-forest-700 hover:text-forest-800"
                >
                  Esc
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pt-5">
                {term.trim() === '' ? (
                  <div>
                    <p className="eyebrow mb-4 text-ink-muted">Categorias</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/categoria/${category.slug}`}
                          onClick={onClose}
                          className="rounded-full border border-line bg-cream-100 px-4 py-2 text-sm text-forest-800 transition-colors hover:border-forest-700 hover:bg-forest-700 hover:text-cream-50"
                        >
                          {category.label}
                          {category.tagline ? <span className="ml-1.5 text-xs opacity-60">{category.tagline}</span> : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-muted">
                    Nada encontrado para “{term}”. Tente “mel”, “própolis” ou o nome da abelha.
                  </p>
                ) : (
                  <ul className="grid gap-1.5">
                    {results.map((product) => (
                      <li key={product.slug}>
                        <Link
                          href={`/produtos/${product.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-cream-200"
                        >
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-cream-200">
                            <Image
                              src={product.image.src}
                              alt=""
                              width={120}
                              height={120}
                              className="h-[82%] w-auto object-contain"
                              sizes="56px"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[0.68rem] uppercase tracking-[0.14em] text-honey-700">
                              {product.line}
                            </span>
                            <span className="block truncate font-display text-[1.05rem] text-forest-900">
                              {product.title}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-sm">
                            <span className="block tabular-nums text-forest-900">{formatPrice(product.price)}</span>
                            {product.size ? (
                              <span className="block text-xs text-ink-muted">{formatSize(product.size)}</span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {term.trim() && results.length > 0 ? (
                  <Link
                    href={`/produtos?busca=${encodeURIComponent(term.trim())}`}
                    onClick={onClose}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-honey-700 link-underline"
                  >
                    Ver todos os resultados
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
