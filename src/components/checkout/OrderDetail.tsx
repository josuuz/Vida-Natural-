'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';
import type { OrderSummary } from '@/lib/types';

const statusLabels: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pagamento aprovado',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

const paymentLabels: Record<string, string> = {
  pending: 'pendente',
  in_process: 'em análise',
  approved: 'aprovado',
  rejected: 'recusado',
  cancelled: 'cancelado',
  refunded: 'estornado',
};

export function OrderDetail({ order, justCreated }: { order: OrderSummary; justCreated?: boolean }) {
  const { clear } = useCart();

  // o pedido foi registrado: o carrinho local não vale mais
  useEffect(() => {
    if (justCreated) clear();
  }, [justCreated, clear]);

  const whatsappMessage = [
    `Olá! Fiz o pedido ${order.number} no site.`,
    '',
    ...order.items.map((item) => `• ${item.quantity}x ${item.name}`),
    '',
    `Total dos produtos: ${formatPrice(order.total)}`,
    'Pode confirmar o frete e a forma de pagamento?',
  ].join('\n');

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-honey-700">Pedido {order.number}</p>
        <h1 className="mt-4 text-[clamp(1.9rem,4.4vw,2.8rem)] leading-tight text-forest-900">
          {justCreated ? 'Recebemos o seu pedido' : statusLabels[order.status] ?? order.status}
        </h1>
        <p className="mt-4 max-w-xl text-[0.97rem] leading-relaxed text-ink-soft">
          Guarde este link: é por ele que você acompanha o pedido. Também enviamos o número{' '}
          <strong className="font-medium text-forest-900">{order.number}</strong> para {order.customer.email}.
        </p>

        {justCreated ? (
          <div className="mt-8 rounded-xl border border-honey-600/30 bg-honey-200/50 p-6">
            <p className="text-[0.95rem] leading-relaxed text-forest-800">
              O pagamento online ainda não está ativo nesta loja. Para concluir, fale com a nossa equipe pelo
              WhatsApp {site.contact.whatsapp}: confirmamos o frete e enviamos o PIX ou o link de pagamento.
            </p>
            <a
              href={whatsappLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-forest-700 px-7 text-[0.9rem] text-cream-50 transition-colors hover:bg-forest-800"
            >
              Concluir pelo WhatsApp
            </a>
          </div>
        ) : null}

        {/* status */}
        <section className="mt-10 rounded-xl border border-line bg-cream-100 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.78rem] uppercase tracking-[0.14em] text-ink-muted">Situação</p>
              <p className="mt-1 font-display text-[1.3rem] text-forest-900">
                {statusLabels[order.status] ?? order.status}
              </p>
            </div>
            <span className="rounded-full border border-line bg-cream-50 px-3.5 py-1.5 text-[0.78rem] text-ink-soft">
              Pagamento {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
              {order.paymentMethod ? ` · ${order.paymentMethod}` : ''}
            </span>
          </div>

          {order.events.length ? (
            <ol className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
              {order.events.map((event, index) => (
                <li key={`${event.createdAt}-${index}`} className="flex gap-3 text-[0.82rem]">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-honey-500" />
                  <span className="text-ink-soft">
                    {event.note ?? statusLabels[event.status] ?? event.status}
                    <span className="ml-2 text-ink-muted">
                      {new Date(event.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </section>

        {/* itens */}
        <section className="mt-6 rounded-xl border border-line p-6">
          <h2 className="font-display text-[1.2rem] text-forest-900">Itens</h2>
          <ul className="mt-5 flex flex-col gap-4">
            {order.items.map((item) => (
              <li key={item.slug} className="flex items-center gap-4">
                <Link
                  href={`/produtos/${item.slug}`}
                  className="grid h-16 w-14 shrink-0 place-items-center rounded-md bg-cream-100"
                >
                  <Image src={item.image} alt="" width={120} height={120} sizes="56px" className="h-[85%] w-auto object-contain" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9rem] text-forest-900">{item.name}</p>
                  <p className="text-[0.78rem] text-ink-muted">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-[0.9rem] tabular-nums text-forest-900">{formatPrice(item.total)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 flex flex-col gap-1.5 border-t border-line pt-5 text-[0.88rem]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-forest-600">
                <dt>Desconto {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                <dd className="tabular-nums">− {formatPrice(order.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-ink-soft">Frete {order.shippingLabel ? `· ${order.shippingLabel}` : ''}</dt>
              <dd className="tabular-nums text-ink-muted">
                {order.shipping === 0 ? 'a combinar' : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-3">
              <dt className="text-forest-900">Total</dt>
              <dd className="font-display text-xl tabular-nums text-forest-900">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* entrega */}
        {order.address ? (
          <section className="mt-6 rounded-xl border border-line p-6">
            <h2 className="font-display text-[1.2rem] text-forest-900">Entrega</h2>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
              {order.address.street}, {order.address.number}
              {order.address.complement ? ` — ${order.address.complement}` : ''}
              <br />
              {order.address.district} · {order.address.city}/{order.address.state}
              <br />
              CEP {order.address.zip.replace(/(\d{5})(\d{3})/, '$1-$2')}
            </p>
          </section>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/produtos"
            className="inline-flex h-12 items-center rounded-full border border-forest-700/30 px-6 text-[0.88rem] text-forest-800 transition-colors hover:bg-forest-700 hover:text-cream-50"
          >
            Continuar comprando
          </Link>
          <a
            href={whatsappLink(`Olá! Quero falar sobre o pedido ${order.number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center rounded-full border border-line px-6 text-[0.88rem] text-forest-800 transition-colors hover:border-forest-700"
          >
            Falar sobre este pedido
          </a>
        </div>
      </div>
    </div>
  );
}
