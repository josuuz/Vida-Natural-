'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ButtonLink } from '@/components/ui/Button';
import { Blob, Texture } from '@/components/ui/Texture';
import type { ProductSummary } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({
  products,
  stats,
}: {
  /** Exatamente três produtos: frente, lateral e fundo da composição. */
  products: ProductSummary[];
  stats: { species: number; products: number };
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, reduced ? 1 : 0.15]);
  const frontY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -130]);
  const backY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -190]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.25]);

  const [mainProduct, sideProduct, thirdProduct] = products;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-cream-100 via-cream-100 to-cream-200"
      aria-label="Vida Natural — méis e própolis"
    >
      {/* texturas de fundo */}
      <Texture variant="wax" />
      <Texture variant="grain" />
      <Blob className="-left-24 bottom-[-8rem] h-[32rem] w-[32rem]" tone="forest" />
      <motion.span
        style={{ scale: glowScale }}
        className="honey-glow pointer-events-none absolute -right-[18%] top-[-12%] h-[75vh] w-[75vh] rounded-full blur-[2px] sm:-right-[8%]"
        aria-hidden
      />
      <div className="container-page relative grid items-center gap-10 pb-16 pt-12 lg:min-h-[calc(100svh-6.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-8 lg:pb-24 lg:pt-10">
        {/* coluna de texto */}
        <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 max-w-xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.05 }}
            className="eyebrow flex items-center gap-2.5 text-honey-700"
          >
            <span className="h-px w-8 bg-honey-600/50" aria-hidden />
            Fábrica própria · há mais de 40 anos
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.12 }}
            className="mt-6 text-[clamp(2.6rem,7.2vw,5rem)] leading-[0.98] text-forest-900"
          >
            O sabor exato
            <span className="block text-honey-700 italic">de onde o mel</span>
            nasceu.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.24 }}
            className="mt-7 max-w-md text-[1.02rem] leading-relaxed text-ink-soft"
          >
            Méis de abelhas nativas sem ferrão, méis florais do campo brasileiro e extratos de própolis — produzidos
            e envasados na nossa fábrica, inspecionada pelo Ministério da Agricultura.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.34 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <ButtonLink href="/produtos" size="lg" arrow>
              Conheça nossos produtos
            </ButtonLink>
            <ButtonLink href="/categoria/meis-de-abelhas-sem-ferrao-lancamentos" variant="outline" size="lg">
              Explorar méis
            </ButtonLink>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: EASE, delay: 0.5 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-7"
          >
            {[
              { value: String(stats.species), label: 'espécies nativas' },
              { value: String(stats.products), label: 'produtos no catálogo' },
              { value: '40+', label: 'anos de fábrica' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-2xl text-forest-800 sm:text-[1.75rem]">{stat.value}</dt>
                <dd className="mt-1 text-[0.72rem] uppercase tracking-[0.13em] text-ink-muted">{stat.label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* composição de produtos — três planos com profundidades diferentes */}
        <div className="relative mx-auto h-[42vh] min-h-[17rem] w-full max-w-xl sm:h-[52vh] lg:h-[calc(100svh-12rem)] lg:max-w-none">
          {thirdProduct ? (
            <motion.div
              style={{ y: backY }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.45 }}
              className="absolute bottom-[30%] left-0 w-[32%] -rotate-3 sm:w-[29%] lg:w-[31%]"
            >
              <Image
                src={thirdProduct.image.src}
                alt={thirdProduct.name}
                width={thirdProduct.image.width}
                height={thirdProduct.image.height}
                priority
                sizes="(max-width: 768px) 32vw, 20vw"
                className="h-auto w-full drop-shadow-[0_26px_38px_rgba(62,45,15,0.2)]"
              />
            </motion.div>
          ) : null}

          {sideProduct ? (
            <motion.div
              style={{ y: midY }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
              className="absolute bottom-[12%] right-0 w-[33%] sm:w-[30%] lg:w-[32%]"
            >
              <Image
                src={sideProduct.image.src}
                alt={sideProduct.name}
                width={sideProduct.image.width}
                height={sideProduct.image.height}
                priority
                sizes="(max-width: 768px) 33vw, 21vw"
                className="h-auto w-full drop-shadow-[0_30px_45px_rgba(62,45,15,0.22)]"
              />
            </motion.div>
          ) : null}

          {mainProduct ? (
            <motion.div
              style={{ y: frontY }}
              initial={{ opacity: 0, y: 60, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
              className="absolute bottom-[4%] left-[15%] z-10 w-[54%] sm:w-[50%] lg:w-[52%]"
            >
              <Image
                src={mainProduct.image.src}
                alt={mainProduct.name}
                width={mainProduct.image.width}
                height={mainProduct.image.height}
                priority
                sizes="(max-width: 768px) 54vw, 33vw"
                className="h-auto w-full drop-shadow-[0_40px_60px_rgba(62,45,15,0.28)]"
              />
            </motion.div>
          ) : null}

          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.7 }}
            className="absolute bottom-[4%] left-0 z-20 rounded-full border border-honey-600/30 bg-cream-50/85 px-3.5 py-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-honey-700 backdrop-blur-sm sm:text-[0.62rem]"
          >
            Edição Nativas do Brasil
          </motion.span>
        </div>
      </div>

      {/* indicador de rolagem */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex"
        aria-hidden
      >
        <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ink-muted">Role</span>
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-8 w-px bg-gradient-to-b from-honey-600/70 to-transparent"
        />
      </motion.div>
    </section>
  );
}
