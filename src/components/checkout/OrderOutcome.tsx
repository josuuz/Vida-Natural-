'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';
import type { OrderSummary } from '@/lib/types';

type Outcome = 'sucesso' | 'pendente' | 'erro';

const copy: Record<Outcome, { eyebrow: string; title: string; text: string }> = {
  sucesso: {
    eyebrow: 'Pagamento aprovado',
    title: 'Pedido confirmado',
    text: 'Recebemos o seu pagamento. Agora é com a gente: separamos, embalamos e enviamos.',
  },
  pendente: {
    eyebrow: 'Pagamento pendente',
    title: 'Estamos aguardando a confirmação',
    text: 'Boleto e PIX podem levar alguns minutos (ou até 2 dias úteis, no caso do boleto) para serem compensados. Assim que o pagamento for confirmado, o pedido entra em separação.',
  },
  erro: {
    eyebrow: 'Pagamento não concluído',
    title: 'Não conseguimos confirmar o pagamento',
    text: 'O pedido continua registrado. Você pode tentar pagar de novo ou falar com a nossa equipe.',
  },
};

export function OrderOutcome({ outcome, order }: { outcome: Outcome; order: OrderSummary | null }) {
  const { clear } = useCart();

  // com o pedido registrado, o carrinho local perde a validade
  useEffect(() => {
    if (outcome !== 'erro') clear();
  }, [outcome, clear]);

  const content = copy[outcome];

  return (
    <div className="container-page py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-honey-700">{content.eyebrow}</p>
        <h1 className="mt-5 text-[clamp(2rem,5vw,3rem)] leading-tight text-forest-900">{content.title}</h1>
        <p className="mx-auto mt-5 max-w-lg text-[0.97rem] leading-relaxed text-ink-soft">{content.text}</p>

        {order ? (
          <div className="mt-10 rounded-xl border border-line bg-cream-100 p-6 text-left">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-display text-[1.2rem] text-forest-900">Pedido {order.number}</p>
              <p className="tabular-nums text-forest-900">{formatPrice(order.total)}</p>
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 text-[0.85rem] text-ink-soft">
              {order.items.map((item) => (
                <li key={item.slug} className="flex justify-between gap-4">
                  <span className="truncate">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatPrice(item.total)}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/pedido/${order.token}`}
              className="mt-5 inline-flex text-[0.85rem] text-honey-700 link-underline"
            >
              Acompanhar o pedido
            </Link>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {outcome === 'erro' ? (
            <Link
              href="/checkout"
              className="inline-flex h-12 items-center rounded-full bg-forest-700 px-7 text-[0.9rem] text-cream-50 transition-colors hover:bg-forest-800"
            >
              Tentar novamente
            </Link>
          ) : (
            <Link
              href="/produtos"
              className="inline-flex h-12 items-center rounded-full bg-forest-700 px-7 text-[0.9rem] text-cream-50 transition-colors hover:bg-forest-800"
            >
              Continuar comprando
            </Link>
          )}
          <a
            href={whatsappLink(
              order ? `Olá! Quero falar sobre o pedido ${order.number}.` : 'Olá! Preciso de ajuda com um pedido.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center rounded-full border border-forest-700/30 px-7 text-[0.9rem] text-forest-800 transition-colors hover:border-forest-700"
          >
            Falar com a gente
          </a>
        </div>

        <p className="mt-8 text-[0.75rem] text-ink-muted">
          Dúvidas? WhatsApp {site.contact.whatsapp} · {site.contact.email}
        </p>
      </div>
    </div>
  );
}
