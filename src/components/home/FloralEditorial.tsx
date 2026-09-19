'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { formatSize } from '@/lib/format';
import type { ProductSummary } from '@/lib/types';
import { ButtonLink } from '@/components/ui/Button';
import { Blob, Texture } from '@/components/ui/Texture';

const EASE = [0.22, 1, 0.36, 1] as const;

/*
 * Cada pote é dimensionado pela ALTURA (nunca pela largura): assim as
 * proporções continuam variadas, mas nenhuma embalagem é cortada, independente
 * de o rótulo ser alto ou baixo. As alturas somadas ao offset inferior ficam
 * sempre abaixo de 100% para sobrar folga para o parallax.
 */
const showcase = [
  { slug: 'mel-de-flores-de-laranjeira', className: 'left-0 bottom-[2%] h-[58%]', speed: -30 },
  { slug: 'mel-de-flores-de-cafe', className: 'left-[26%] bottom-[12%] h-[72%]', speed: -52 },
  { slug: 'mel-de-melato-bracatinga', className: 'left-[60%] bottom-0 h-[52%]', speed: -18 },
];

export function FloralEditorial({ products }: { products: ProductSummary[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -60]);
  const floradas = products;

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-cream-100 py-20 sm:py-24 lg:py-28"
      aria-labelledby="floradas-titulo"
    >
      <Texture variant="wax" />
      <Texture variant="grain" />
      <Blob className="-left-32 top-10 h-[26rem] w-[26rem]" tone="honey" />
      <Blob className="-right-24 bottom-0 h-[22rem] w-[22rem]" tone="forest" />

      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* composição com velocidades diferentes */}
        <div className="relative order-2 h-[24rem] w-full sm:h-[32rem] lg:order-1 lg:h-[42rem]">
          <span className="honey-glow absolute inset-x-0 bottom-0 top-[14%] rounded-full" aria-hidden />
          {showcase.map((item, index) => {
            const product = products.find((candidate) => candidate.slug === item.slug);
            if (!product) return null;
            return (
              <ParallaxItem key={item.slug} progress={scrollYProgress} distance={reduced ? 0 : item.speed} delay={index * 0.08}>
                <div className={`absolute ${item.className}`}>
                  {/* o link precisa ter altura própria, senão o h-full da
                      imagem não resolve e ela volta ao tamanho intrínseco */}
                  <Link href={`/produtos/${product.slug}`} className="group block h-full">
                    <Image
                      src={product.image.src}
                      alt={product.name}
                      width={product.image.width}
                      height={product.image.height}
                      sizes="(max-width: 1024px) 40vw, 22vw"
                      className="h-full w-auto max-w-none drop-shadow-[0_30px_45px_rgba(62,45,15,0.25)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2"
                    />
                  </Link>
                </div>
              </ParallaxItem>
            );
          })}
        </div>

        {/* texto */}
        <motion.div style={{ y: textY }} className="order-1 lg:order-2">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.8, ease: EASE }}
            className="eyebrow flex items-center gap-2.5 text-honey-700"
          >
            <span className="h-px w-8 bg-honey-600/50" aria-hidden />
            Méis florais
          </motion.span>

          <motion.h2
            id="floradas-titulo"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.06 }}
            className="mt-6 text-[clamp(2rem,4.6vw,3.3rem)] leading-[1.04] text-forest-900"
          >
            Uma florada,
            <span className="block italic text-honey-700">um sabor diferente.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.14 }}
            className="mt-6 max-w-lg text-[1rem] leading-relaxed text-ink-soft"
          >
            O mel muda conforme a flor que a abelha visitou. Por isso trabalhamos cada florada separadamente, em
            potes de 300g, 400g e 730g.
          </motion.p>

          <motion.ul
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-9 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-7"
          >
            {floradas.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/produtos/${product.slug}`}
                  className="text-[0.92rem] text-ink-soft transition-colors duration-300 hover:text-honey-700"
                >
                  {product.title}
                  {product.size ? <span className="text-ink-muted"> · {formatSize(product.size)}</span> : null}
                </Link>
              </li>
            ))}
          </motion.ul>

          <ButtonLink href="/categoria/meis-de-abelhas-apis-mellifera" className="mt-10" arrow>
            Ver todos os méis florais
          </ButtonLink>
        </motion.div>
      </div>
    </section>
  );
}

function ParallaxItem({
  children,
  progress,
  distance,
  delay,
}: {
  children: React.ReactNode;
  progress: MotionValue<number>;
  distance: number;
  delay: number;
}) {
  // o reveal (opacity) e o parallax (y) ficam em camadas separadas para não
  // disputarem a mesma propriedade
  const y = useTransform(progress, [0, 1], [distance * -0.5, distance]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      className="absolute inset-0"
    >
      <motion.div style={{ y }} className="absolute inset-0 will-change-transform">
        {children}
      </motion.div>
    </motion.div>
  );
}
