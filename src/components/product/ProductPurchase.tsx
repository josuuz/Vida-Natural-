'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/format';
import type { ProductDetail } from '@/lib/types';
import { whatsappLink } from '@/lib/site';

/** Seletor de quantidade + ofertas progressivas + CTA. */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const tiers = product.tiers;
  const activeTier = tiers.filter((tier) => quantity >= tier.minQuantity).at(-1) ?? null;
  const unitPrice = activeTier ? activeTier.unitPrice : product.price;
  const lineTotal = unitPrice * quantity;

  if (!product.available) {
    return (
      <div className="rounded-lg border border-line bg-cream-100 p-5">
        <p className="text-sm text-ink-soft">Este produto está indisponível no momento.</p>
        <a
          href={whatsappLink(`Olá! Gostaria de saber quando o produto "${product.name}" estará disponível.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm text-honey-700 link-underline"
        >
          Avisar quando chegar
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ofertas por quantidade — só aparecem quando cadastradas */}
      {tiers.length ? (
        <div>
          <p className="eyebrow mb-3 text-honey-700">Leve mais, pague menos</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[{ minQuantity: 1, unitPrice: product.price, highlight: false, label: null, savings: 0, total: product.price }, ...tiers].map(
              (tier) => {
                const selected = quantity >= tier.minQuantity && (activeTier?.minQuantity ?? 1) === tier.minQuantity;
                return (
                  <button
                    key={tier.minQuantity}
                    type="button"
                    onClick={() => setQuantity(tier.minQuantity)}
                    className={`relative rounded-lg border p-3 text-left transition-all duration-300 ${
                      selected
                        ? 'border-forest-700 bg-cream-100 shadow-soft'
                        : 'border-line bg-cream-50 hover:border-forest-500'
                    }`}
                  >
                    {tier.highlight ? (
                      <span className="absolute -top-2 right-2 rounded-full bg-honey-500 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-forest-950">
                        Melhor custo
                      </span>
                    ) : null}
                    <p className="text-[0.82rem] text-forest-900">
                      {tier.minQuantity} {tier.minQuantity === 1 ? 'unidade' : 'unidades'}
                    </p>
                    <p className="mt-1 font-display text-[1.05rem] tabular-nums text-forest-900">
                      {formatPrice(tier.unitPrice)} <span className="text-[0.72rem] text-ink-muted">cada</span>
                    </p>
                    {tier.savings > 0 ? (
                      <p className="mt-1 text-[0.7rem] text-forest-600">economize {formatPrice(tier.savings)}</p>
                    ) : null}
                  </button>
                );
              }
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-12 items-center rounded-full border border-line bg-cream-50">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="grid h-12 w-11 place-items-center rounded-l-full text-ink-muted transition-colors hover:text-forest-800"
            aria-label="Diminuir quantidade"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(99, value + 1))}
            className="grid h-12 w-11 place-items-center rounded-r-full text-ink-muted transition-colors hover:text-forest-800"
            aria-label="Aumentar quantidade"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
              <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            add(product.slug, quantity);
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1800);
          }}
          className="group/cta inline-flex h-12 min-w-[15rem] flex-1 items-center justify-center gap-2 rounded-full bg-forest-700 px-7 text-[0.95rem] font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-forest-800 hover:shadow-[0_12px_30px_-12px_rgba(20,33,26,0.7)]"
        >
          {added ? 'Adicionado ao carrinho' : `Adicionar — ${formatPrice(lineTotal)}`}
          <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden>
            <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {activeTier ? (
        <p className="text-[0.82rem] text-forest-600">
          Oferta aplicada: {formatPrice(activeTier.unitPrice)} por unidade — você economiza{' '}
          {formatPrice((product.price - activeTier.unitPrice) * quantity)}.
        </p>
      ) : null}

      <a
        href={whatsappLink(
          `Olá! Tenho interesse em ${quantity}x ${product.name} (${formatPrice(product.price)} cada). Pode me ajudar?`
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-forest-700/30 text-[0.88rem] text-forest-800 transition-colors duration-300 hover:border-forest-700 hover:bg-forest-700 hover:text-cream-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        Comprar pelo WhatsApp
      </a>
    </div>
  );
}
