'use client';

import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/format';
import type { KitSummary } from '@/lib/types';

/** "Leve junto": adiciona todos os itens do kit de uma vez. */
export function KitOffer({ kit }: { kit: KitSummary }) {
  const { addMany } = useCart();
  const total = kit.price ?? kit.itemsTotal;

  return (
    <div className="rounded-xl border border-line bg-cream-100 p-5 sm:p-6">
      <p className="eyebrow text-honey-700">Leve junto</p>
      <h3 className="mt-2 text-[1.2rem] leading-snug text-forest-900">{kit.name}</h3>
      {kit.description ? <p className="mt-1.5 text-[0.85rem] text-ink-muted">{kit.description}</p> : null}

      <ul className="mt-5 flex flex-wrap items-center gap-3">
        {kit.items.map((item, index) => (
          <li key={item.product.slug} className="flex items-center gap-3">
            {index > 0 ? (
              <span aria-hidden className="text-lg text-honey-600">
                +
              </span>
            ) : null}
            <span className="grid h-16 w-16 place-items-center rounded-md bg-cream-50">
              <Image
                src={item.product.image.src}
                alt={item.product.name}
                width={120}
                height={120}
                sizes="64px"
                className="h-[82%] w-auto object-contain"
              />
            </span>
            <span className="text-[0.82rem] leading-snug text-ink-soft">
              {item.quantity > 1 ? `${item.quantity}× ` : ''}
              {item.product.title}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <div>
          {kit.savings ? (
            <p className="text-[0.78rem] text-ink-muted line-through">{formatPrice(kit.itemsTotal)}</p>
          ) : null}
          <p className="font-display text-[1.4rem] tabular-nums text-forest-900">{formatPrice(total)}</p>
          {kit.savings ? (
            <p className="text-[0.78rem] text-honey-700">economize {formatPrice(kit.savings)}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => addMany(kit.items.map((item) => ({ slug: item.product.slug, quantity: item.quantity })))}
          className="h-11 rounded-full bg-forest-700 px-6 text-[0.85rem] text-cream-50 transition-colors hover:bg-forest-800"
        >
          Adicionar os dois
        </button>
      </div>
    </div>
  );
}
