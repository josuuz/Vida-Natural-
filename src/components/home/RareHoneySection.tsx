'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { Species } from '@/lib/types';
import { formatInstallments, formatPrice } from '@/lib/format';
import { ButtonLink } from '@/components/ui/Button';
import { Blob, Texture } from '@/components/ui/Texture';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

const EASE = [0.22, 1, 0.36, 1] as const;

export function RareHoneySection({ species }: { species: Species[] }) {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const current = species[active];

  const select = useCallback((index: number) => {
    const next = (index + species.length) % species.length;
    setActive(next);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [species.length]);

  if (!current) return null;

  return (
    <section className="relative overflow-hidden bg-cream-200 py-20 sm:py-24 lg:py-28" aria-labelledby="nativas-titulo">
      <Texture variant="paper" />
      <Texture variant="wax" />
      <Blob className="-right-28 -top-20 h-[30rem] w-[30rem]" tone="honey" />
      <Blob className="-left-32 bottom-[-6rem] h-[24rem] w-[24rem]" tone="forest" />

      <div className="container-page relative">
        {/* abertura */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12% 0px' }}
          transition={{ duration: 0.8, ease: EASE }}
          className="max-w-2xl"
        >
          <span className="eyebrow flex items-center gap-2.5 text-honey-700">
            <span className="h-px w-8 bg-honey-600/50" aria-hidden />
            Edição Nativas do Brasil
          </span>
          <h2 id="nativas-titulo" className="mt-5 text-[clamp(1.9rem,4.6vw,3.3rem)] leading-[1.04] text-forest-900">
            Cada abelha nativa
            <span className="block italic text-honey-700">faz um mel diferente.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[0.97rem] leading-relaxed text-ink-soft">
            Dez espécies de abelhas sem ferrão, da Caatinga à Mata Atlântica — cada uma com um mel de perfil próprio,
            envasado por nós em potes de 100g.
          </p>
        </motion.div>

        {/* chips de espécie */}
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Espécies de abelhas nativas"
          className="no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:overflow-visible"
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              select(active + 1);
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              select(active - 1);
            }
          }}
        >
          {species.map((entry, index) => {
            const selected = index === active;
            return (
              <button
                key={entry.product.slug}
                role="tab"
                id={`especie-tab-${index}`}
                aria-selected={selected}
                aria-controls="especie-painel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className={`shrink-0 snap-center whitespace-nowrap rounded-full border px-4 py-2 text-[0.82rem] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  selected
                    ? 'border-forest-700 bg-forest-700 text-cream-50 shadow-[0_8px_20px_-10px_rgba(20,33,26,0.6)]'
                    : 'border-line bg-cream-50/70 text-forest-800 hover:border-forest-500 hover:bg-cream-50'
                }`}
              >
                {entry.name}
              </button>
            );
          })}
        </div>

        {/* painel da espécie selecionada */}
        <div
          role="tabpanel"
          id="especie-painel"
          aria-labelledby={`especie-tab-${active}`}
          className="mt-6 overflow-hidden rounded-xl border border-line bg-cream-50/80 backdrop-blur-[1px]"
        >
          <div className="grid items-stretch gap-0 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            {/* imagem */}
            <div className="relative flex min-h-[15rem] items-center justify-center overflow-hidden bg-cream-200/70 p-6 sm:min-h-[19rem]">
              <span className="honey-glow absolute inset-4 rounded-full" aria-hidden />
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.product.slug}
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -8 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="relative flex h-[11rem] items-center justify-center sm:h-[14rem]"
                >
                  <Image
                    src={current.product.image.src}
                    alt={current.product.name}
                    width={current.product.image.width}
                    height={current.product.image.height}
                    sizes="(max-width: 640px) 60vw, 28vw"
                    className="h-full w-auto max-w-none object-contain drop-shadow-[0_24px_34px_rgba(62,45,15,0.26)]"
                  />
                </motion.div>
              </AnimatePresence>
              <span className="absolute left-5 top-5 rounded-full border border-honey-600/30 bg-cream-50/85 px-3 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-honey-700">
                {String(active + 1).padStart(2, '0')} / {species.length}
              </span>
            </div>

            {/* texto */}
            <div className="flex flex-col justify-center p-6 sm:p-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.product.slug}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <h3 className="text-[clamp(1.6rem,3vw,2.2rem)] leading-tight text-forest-900">{current.name}</h3>
                  <p className="mt-1.5 font-display text-[1rem] italic text-ink-muted">{current.scientific}</p>
                  <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">{current.epithet}</p>

                  <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-display text-[1.7rem] tabular-nums text-forest-900">
                      {formatPrice(current.product.price)}
                    </span>
                    {current.product.installments ? (
                      <span className="text-[0.82rem] text-ink-muted">
                        ou {formatInstallments(current.product.installments)}
                      </span>
                    ) : null}
                    {current.product.size ? (
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-[0.72rem] text-ink-muted">
                        {current.product.size}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <AddToCartButton product={current.product} size="md" />
                    <Link
                      href={`/produtos/${current.product.slug}`}
                      className="inline-flex items-center gap-2 text-[0.88rem] text-forest-800 link-underline"
                    >
                      Ver detalhes
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                        <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/categoria/meis-de-abelhas-sem-ferrao-lancamentos" arrow>
            Ver os 10 méis exclusivos
          </ButtonLink>
          <ButtonLink href="/categoria/meis-de-abelhas-sem-ferrao" variant="outline">
            Méis raros em 50g
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
