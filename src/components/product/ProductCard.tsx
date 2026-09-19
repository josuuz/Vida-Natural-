'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ProductBadge, ProductSummary } from '@/lib/types';
import { formatPrice, formatSize } from '@/lib/format';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { PriceTag } from './PriceTag';

type ProductCardProps = {
  product: ProductSummary;
  index?: number;
  priority?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const badgeStyles: Record<ProductBadge['kind'], string> = {
  oferta: 'bg-honey-500 text-forest-950',
  'mais-vendido': 'bg-forest-800 text-cream-50',
  novidade: 'bg-cream-50 text-forest-800 border border-forest-700/20',
  destaque: 'bg-cream-50 text-honey-700 border border-honey-600/25',
  'estoque-limitado': 'bg-cream-50 text-forest-800 border border-forest-700/20',
};

export function ProductCard({ product, index = 0, priority = false }: ProductCardProps) {
  const badges = product.badges.slice(0, 2);
  const bestTier = product.tiers.find((tier) => tier.highlight) ?? product.tiers.at(-1) ?? null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.65, ease: EASE, delay: Math.min(index * 0.06, 0.4) }}
      className="group/card relative flex h-full flex-col"
    >
      <Link href={`/produtos/${product.slug}`} className="flex h-full flex-col focus-visible:outline-none">
        <div className="relative isolate flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-cream-100 transition-[background-color,box-shadow] duration-500 group-hover/card:bg-cream-200 group-hover/card:shadow-lift">
          <span
            className="honey-glow absolute inset-0 -z-10 opacity-0 transition-opacity duration-700 group-hover/card:opacity-100"
            aria-hidden
          />
          <span className="texture-grain absolute inset-0 -z-10 opacity-[0.05]" aria-hidden />

          <Image
            src={product.image.src}
            alt={product.name}
            width={product.image.width}
            height={product.image.height}
            priority={priority}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="h-[76%] w-auto max-w-[78%] object-contain drop-shadow-[0_18px_28px_rgba(62,45,15,0.16)] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.06]"
          />

          {badges.length ? (
            <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge.kind}
                  className={`rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] ${badgeStyles[badge.kind]}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}

          {!product.available ? (
            <span className="absolute right-4 top-4 rounded-full bg-forest-900/85 px-3 py-1 text-[0.62rem] uppercase tracking-[0.1em] text-cream-100">
              Esgotado
            </span>
          ) : null}

          {/* ação rápida no hover (desktop) */}
          <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:translate-y-0 group-hover/card:opacity-100 max-sm:hidden">
            <AddToCartButton product={product} variant="soft" className="w-full" label="Adicionar ao carrinho" />
          </div>
        </div>

        <div className="flex flex-1 flex-col px-1 pt-5">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-honey-700">{product.line}</p>
          <h3 className="mt-2 text-[1.15rem] leading-snug text-forest-900 transition-colors duration-300 group-hover/card:text-honey-700 sm:text-[1.22rem]">
            {product.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.8rem] text-ink-muted">
            {product.size ? <span>{formatSize(product.size)}</span> : null}
            {product.variant ? <span className="truncate">· {product.variant}</span> : null}
          </div>

          <div className="mt-auto pt-4">
            <PriceTag product={product} size="sm" showSavings />
            {bestTier ? (
              <p className="mt-1.5 text-[0.76rem] text-forest-600">
                Leve {bestTier.minQuantity} por {formatPrice(bestTier.unitPrice)} cada
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      {/* no mobile o botão fica sempre visível */}
      <AddToCartButton product={product} variant="outline" className="mt-4 w-full sm:hidden" label="Adicionar" />
    </motion.article>
  );
}
