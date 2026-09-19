'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { ProductDetail } from '@/lib/types';

type GalleryImage = { src: string; width: number; height: number; kind: 'produto' | 'tabela' };

export function ProductGallery({ product }: { product: ProductDetail }) {
  const images: GalleryImage[] = [
    { ...product.image, kind: 'produto' as const },
    ...product.gallery.slice(1).map((image) => ({ ...image, kind: 'produto' as const })),
    ...product.infoImages.map((image) => ({ ...image, kind: 'tabela' as const })),
  ];
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-start sm:gap-6">
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-cream-100 sm:flex-1">
        <span className="texture-paper absolute inset-0 opacity-[0.06]" aria-hidden />
        <span className="honey-glow absolute inset-0" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.src}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-full w-full items-center justify-center p-8 sm:p-12"
          >
            <Image
              src={current.src}
              alt={
                current.kind === 'tabela'
                  ? `Tabela nutricional — ${product.name}`
                  : product.name
              }
              width={current.width}
              height={current.height}
              priority
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 40vw"
              className={
                current.kind === 'tabela'
                  ? 'max-h-full w-auto rounded-md bg-cream-50 object-contain shadow-soft'
                  : 'max-h-full w-auto object-contain drop-shadow-[0_30px_45px_rgba(62,45,15,0.22)]'
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 ? (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={
                  image.kind === 'tabela' ? 'Ver tabela nutricional' : `Ver imagem ${index + 1} do produto`
                }
                aria-current={index === active}
                className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md border bg-cream-100 p-2 transition-all duration-300 ${
                  index === active ? 'border-forest-700' : 'border-transparent hover:border-line'
                }`}
              >
                <Image
                  src={image.src}
                  alt=""
                  width={160}
                  height={160}
                  sizes="80px"
                  className="h-full w-auto object-contain"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
