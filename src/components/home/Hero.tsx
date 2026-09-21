'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ButtonLink } from '@/components/ui/Button';
import { Blob, Texture } from '@/components/ui/Texture';
import type { ProductSummary } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as const;

// no mobile as colunas empilham: texto descendo e potes subindo se cruzariam
const DESKTOP = '(min-width: 1024px)';
function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
const useDesktop = () =>
  useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP).matches, () => false);
const noop = () => () => {};
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/*
 * Luz ambiente do hero mobile: loop gerado no Higgsfield pelo agente
 * .claude/agents/higgsfield-hero.md a partir do fundo da própria seção, SEM os
 * produtos — vídeo de IA redesenha o texto dos rótulos. Os potes continuam
 * sendo as fotos reais, animadas em código por cima. Fica `null` enquanto não
 * houver um loop aprovado, e aí nada é baixado.
 */
const HERO_AMBIENT: string | null = null;

// o quadro traz o fundo da seção: só as bordas se dissolvem nele
const EDGE_FADE =
  'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent), linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)';
const edgeMask = {
  maskImage: EDGE_FADE,
  WebkitMaskImage: EDGE_FADE,
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
} as const;

function HeroAmbient({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // só no cliente: o HTML do servidor não leva o vídeo, então o desktop e
  // quem pede menos movimento nunca chegam a baixá-lo
  const playable = useHydrated() && active && HERO_AMBIENT !== null;

  useEffect(() => {
    const video = videoRef.current;
    if (!playable || !video) return;
    video.muted = true;
    // loop decorativo: pausa assim que o hero sai da tela
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? video.play().catch(() => {}) : video.pause()),
      { threshold: 0.15 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [playable]);

  if (!playable || !HERO_AMBIENT) return null;
  return (
    <video
      ref={videoRef}
      src={HERO_AMBIENT}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden
      onPlaying={() => setPlaying(true)}
      style={edgeMask}
      className={`pointer-events-none absolute inset-y-0 -inset-x-4 h-full w-[calc(100%+2rem)] max-w-none object-cover transition-opacity duration-1000 sm:inset-x-0 sm:w-full lg:hidden ${
        playing ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}

/*
 * Flutuação lenta dos potes no mobile — o que dá vida à composição sem
 * depender da rolagem. Durações diferentes deixam os três fora de fase.
 */
function Float({ active, duration, delay, children }: { active: boolean; duration: number; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      animate={active ? { y: [0, -9, 0], rotate: [0, 0.9, 0] } : { y: 0, rotate: 0 }}
      transition={active ? { duration, delay, ease: 'easeInOut', repeat: Infinity } : { duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

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
  const desktop = useDesktop();
  const still = reduced || !desktop;
  const inView = useInView(ref, { amount: 0.1 });
  const floating = !reduced && !desktop && inView;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const textY = useTransform(scrollYProgress, [0, 1], [0, still ? 0 : 90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.75], [1, still ? 1 : 0.15]);
  // no desktop os potes sobem mais rápido que a página; no mobile, com o texto
  // logo acima, o pote da frente fica ancorado (com o selo) e os de trás ficam
  // para trás (descem) — profundidade sem nunca subir sobre o texto
  const depth = (desktopDistance: number, mobileDistance: number) =>
    reduced ? 0 : desktop ? desktopDistance : mobileDistance;
  const frontY = useTransform(scrollYProgress, [0, 1], [0, depth(-70, 0)]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, depth(-130, 28)]);
  const backY = useTransform(scrollYProgress, [0, 1], [0, depth(-190, 48)]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, still ? 1 : 1.25]);

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
            <span className="hidden h-px w-8 bg-honey-600/50 sm:block" aria-hidden />
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

        {/* composição de produtos — três planos com profundidades diferentes.
            No mobile os potes flutuam e, na rolagem, ficam para trás em vez de
            subir sobre o texto; atrás deles entra a luz ambiente do Higgsfield. */}
        <div
          data-hero-stage
          className="relative mx-auto h-[42vh] min-h-[17rem] w-full max-w-xl sm:h-[52vh] lg:h-[calc(100svh-12rem)] lg:max-w-none"
        >
          <HeroAmbient active={!reduced && !desktop} />

          <div data-hero-layers className="absolute inset-0">
            {thirdProduct ? (
              <motion.div
                style={{ y: backY }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.45 }}
                className="absolute bottom-[30%] left-0 w-[32%] -rotate-3 sm:w-[29%] lg:w-[31%]"
              >
                <Float active={floating} duration={7.4} delay={1.6}>
                  <Image
                    src={thirdProduct.image.src}
                    alt={thirdProduct.name}
                    width={thirdProduct.image.width}
                    height={thirdProduct.image.height}
                    priority
                    sizes="(max-width: 768px) 32vw, 20vw"
                    className="h-auto w-full drop-shadow-[0_26px_38px_rgba(62,45,15,0.2)]"
                  />
                </Float>
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
                <Float active={floating} duration={6.6} delay={1.3}>
                  <Image
                    src={sideProduct.image.src}
                    alt={sideProduct.name}
                    width={sideProduct.image.width}
                    height={sideProduct.image.height}
                    priority
                    sizes="(max-width: 768px) 33vw, 21vw"
                    className="h-auto w-full drop-shadow-[0_30px_45px_rgba(62,45,15,0.22)]"
                  />
                </Float>
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
                <Float active={floating} duration={5.8} delay={1}>
                  <Image
                    src={mainProduct.image.src}
                    alt={mainProduct.name}
                    width={mainProduct.image.width}
                    height={mainProduct.image.height}
                    priority
                    sizes="(max-width: 768px) 54vw, 33vw"
                    className="h-auto w-full drop-shadow-[0_40px_60px_rgba(62,45,15,0.28)]"
                  />
                </Float>
              </motion.div>
            ) : null}
          </div>

          <motion.span
            data-hero-badge
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
