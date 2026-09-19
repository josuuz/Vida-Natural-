'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from './CartProvider';
import { formatPrice, formatSize } from '@/lib/format';
import type { CartLine, CouponError, ProductSummary } from '@/lib/types';
import { ButtonLink } from '@/components/ui/Button';

const couponMessages: Record<CouponError, string> = {
  nao_encontrado: 'Cupom não encontrado.',
  inativo: 'Este cupom não está ativo.',
  expirado: 'Este cupom expirou.',
  nao_iniciado: 'Este cupom ainda não começou a valer.',
  limite_atingido: 'Este cupom atingiu o limite de uso.',
  subtotal_minimo: 'O subtotal ainda não atingiu o mínimo do cupom.',
};

function QuantityStepper({ line }: { line: CartLine }) {
  const { setQuantity } = useCart();

  return (
    <div className="inline-flex items-center rounded-full border border-line bg-cream-50">
      <button
        type="button"
        onClick={() => setQuantity(line.product.slug, line.quantity - 1)}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:text-forest-800"
        aria-label={`Diminuir quantidade de ${line.product.name}`}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
      <button
        type="button"
        onClick={() => setQuantity(line.product.slug, line.quantity + 1)}
        className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition-colors hover:text-forest-800"
        aria-label={`Aumentar quantidade de ${line.product.name}`}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
          <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function FreeShippingBar() {
  const { summary } = useCart();
  const rule = summary?.freeShipping;
  if (!rule?.enabled) return null;

  const progress = rule.reached
    ? 100
    : Math.min(100, Math.round(((rule.threshold - rule.missing) / rule.threshold) * 100));

  return (
    <div className="border-b border-line bg-honey-200/60 px-5 py-3.5 sm:px-7">
      <p className="text-[0.78rem] text-forest-800">
        {rule.reached ? (
          <>
            <strong className="font-semibold">Frete grátis liberado</strong> para este pedido.
          </>
        ) : (
          <>
            Faltam <strong className="font-semibold tabular-nums">{formatPrice(rule.missing)}</strong> para o frete
            grátis.
          </>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-50">
        <motion.div
          className="h-full rounded-full bg-forest-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function CouponField() {
  const { summary, couponError, applyCoupon, intent } = useCart();
  const [code, setCode] = useState(intent.couponCode ?? '');
  const [open, setOpen] = useState(Boolean(intent.couponCode));

  if (summary?.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-forest-700/20 bg-cream-50 px-3.5 py-2.5">
        <div>
          <p className="text-[0.8rem] font-medium text-forest-800">Cupom {summary.coupon.code}</p>
          <p className="text-[0.72rem] text-ink-muted">
            {summary.coupon.type === 'percent'
              ? `${summary.coupon.value}% de desconto`
              : `${formatPrice(summary.coupon.value)} de desconto`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => applyCoupon(null)}
          className="text-[0.72rem] text-ink-muted underline-offset-2 transition-colors hover:text-honey-700 hover:underline"
        >
          remover
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left text-[0.8rem] text-forest-800 link-underline"
      >
        Tenho um cupom de desconto
      </button>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        applyCoupon(code.trim() ? code : null);
      }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          aria-label="Código do cupom"
          className="h-10 flex-1 rounded-full border border-line bg-cream-50 px-4 text-[0.82rem] uppercase tracking-wide text-forest-900 outline-none transition-colors focus:border-forest-500"
        />
        <button
          type="submit"
          className="h-10 shrink-0 rounded-full border border-forest-700/30 px-4 text-[0.8rem] text-forest-800 transition-colors hover:bg-forest-700 hover:text-cream-50"
        >
          Aplicar
        </button>
      </div>
      {couponError ? <p className="text-[0.72rem] text-honey-700">{couponMessages[couponError]}</p> : null}
    </form>
  );
}

function Suggestion({ product }: { product: ProductSummary }) {
  const { add } = useCart();

  return (
    <div className="flex items-center gap-3 rounded-md border border-line-soft bg-cream-50 p-2.5">
      <Image
        src={product.image.src}
        alt=""
        width={80}
        height={80}
        sizes="48px"
        className="h-12 w-12 shrink-0 object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] text-forest-900">{product.title}</p>
        <p className="text-[0.75rem] tabular-nums text-ink-muted">{formatPrice(product.price)}</p>
      </div>
      <button
        type="button"
        onClick={() => add(product.slug)}
        className="shrink-0 rounded-full border border-forest-700/25 px-3 py-1.5 text-[0.72rem] text-forest-800 transition-colors hover:bg-forest-700 hover:text-cream-50"
      >
        Adicionar
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { isOpen, close, summary, count, status, remove } = useCart();
  const lines = summary?.lines ?? [];

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
          <motion.button
            type="button"
            onClick={close}
            aria-label="Fechar carrinho"
            className="absolute inset-0 h-full w-full cursor-default bg-forest-950/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.aside
            className="absolute inset-y-0 right-0 flex h-full w-full max-w-[28rem] flex-col bg-cream-50 shadow-deep"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 34 }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-5 sm:px-7">
              <div>
                <p className="eyebrow text-honey-700">Seu carrinho</p>
                <p className="mt-1 font-display text-xl text-forest-900">
                  {count === 0 ? 'Vazio por enquanto' : `${count} ${count === 1 ? 'item' : 'itens'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition-colors hover:border-forest-700 hover:text-forest-800"
                aria-label="Fechar carrinho"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                  <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <FreeShippingBar />

            {count === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
                <div className="honey-glow grid h-28 w-28 place-items-center rounded-full">
                  <svg viewBox="0 0 48 48" className="h-12 w-12 text-forest-600" aria-hidden>
                    <path d="M12 16h24l-2.5 22a3 3 0 0 1-3 2.7H17.5a3 3 0 0 1-3-2.7z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M18 20v-4a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </div>
                <p className="max-w-[16rem] text-sm leading-relaxed text-ink-muted">
                  Você ainda não escolheu nenhum produto. Comece pelos méis de abelhas sem ferrão.
                </p>
                <ButtonLink href="/produtos" onClick={close} variant="primary" arrow>
                  Ver produtos
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 sm:px-7">
                  {summary?.removed.length ? (
                    <div className="mt-4 rounded-md border border-honey-600/30 bg-honey-200/50 px-3.5 py-2.5">
                      {summary.removed.map((item) => (
                        <p key={item.slug} className="text-[0.75rem] text-forest-800">
                          {item.reason}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <ul className="divide-y divide-line-soft">
                    {lines.map((line) => (
                      <li key={line.product.slug} className="flex gap-4 py-5">
                        <Link
                          href={`/produtos/${line.product.slug}`}
                          onClick={close}
                          className="relative grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-cream-200"
                        >
                          <Image
                            src={line.product.image.src}
                            alt={line.product.name}
                            width={160}
                            height={160}
                            className="h-[85%] w-auto object-contain"
                            sizes="80px"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-honey-700">
                            {line.product.line}
                          </p>
                          <Link
                            href={`/produtos/${line.product.slug}`}
                            onClick={close}
                            className="mt-1 font-display text-[1.05rem] leading-snug text-forest-900 hover:text-honey-700"
                          >
                            {line.product.title}
                          </Link>
                          {line.product.size ? (
                            <p className="mt-0.5 text-xs text-ink-muted">{formatSize(line.product.size)}</p>
                          ) : null}

                          {line.appliedTier ? (
                            <p className="mt-1 text-[0.72rem] text-forest-600">
                              Oferta por quantidade aplicada
                            </p>
                          ) : line.nextTier ? (
                            <p className="mt-1 text-[0.72rem] text-ink-muted">
                              Leve {line.nextTier.minQuantity} e pague {formatPrice(line.nextTier.unitPrice)} cada
                            </p>
                          ) : null}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <QuantityStepper line={line} />
                            <div className="text-right">
                              {line.compareAtUnitPrice ? (
                                <p className="text-[0.7rem] text-ink-muted line-through">
                                  {formatPrice(line.compareAtUnitPrice * line.quantity)}
                                </p>
                              ) : null}
                              <p className="text-sm font-medium tabular-nums text-forest-900">
                                {formatPrice(line.total)}
                              </p>
                              <button
                                type="button"
                                onClick={() => remove(line.product.slug)}
                                className="mt-0.5 text-[0.7rem] text-ink-muted underline-offset-2 transition-colors hover:text-honey-700 hover:underline"
                              >
                                remover
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {summary?.suggestions.length ? (
                    <div className="border-t border-line-soft py-5">
                      <p className="eyebrow mb-3 text-ink-muted">Leve também</p>
                      <div className="flex flex-col gap-2">
                        {summary.suggestions.map((product) => (
                          <Suggestion key={product.slug} product={product} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <footer className="border-t border-line bg-cream-100 px-5 py-5 sm:px-7">
                  <CouponField />

                  <dl className="mt-4 flex flex-col gap-1.5 text-[0.85rem]">
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Subtotal</dt>
                      <dd className="tabular-nums text-forest-900">{formatPrice(summary?.subtotal ?? 0)}</dd>
                    </div>
                    {summary && summary.couponDiscount > 0 ? (
                      <div className="flex justify-between text-forest-600">
                        <dt>Desconto do cupom</dt>
                        <dd className="tabular-nums">− {formatPrice(summary.couponDiscount)}</dd>
                      </div>
                    ) : null}
                    {summary && summary.tierDiscount > 0 ? (
                      <div className="flex justify-between text-forest-600">
                        <dt>Oferta por quantidade</dt>
                        <dd className="tabular-nums">− {formatPrice(summary.tierDiscount)}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Frete</dt>
                      <dd className="tabular-nums text-ink-muted">
                        {summary?.shipping === null ? 'a combinar' : formatPrice(summary?.shipping ?? 0)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                    <span className="text-sm text-ink-soft">Total</span>
                    <span
                      data-testid="cart-total"
                      className="font-display text-2xl tabular-nums text-forest-900"
                    >
                      {status === 'syncing' && !summary ? '…' : formatPrice(summary?.total ?? 0)}
                    </span>
                  </div>

                  {status === 'error' ? (
                    <p className="mt-2 text-[0.75rem] text-honey-700">
                      Não conseguimos atualizar os valores agora. Confira sua conexão.
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-2.5">
                    <ButtonLink href="/checkout" onClick={close} variant="primary" size="lg" className="w-full" arrow>
                      Finalizar compra
                    </ButtonLink>
                    <button
                      type="button"
                      onClick={close}
                      className="h-11 rounded-full border border-line text-sm text-forest-800 transition-colors hover:border-forest-700 hover:bg-cream-200"
                    >
                      Continuar comprando
                    </button>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
