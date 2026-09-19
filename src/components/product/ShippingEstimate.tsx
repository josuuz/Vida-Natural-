'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import type { CartSummary, ShippingOption } from '@/lib/types';

type Result =
  | { kind: 'quote'; city: string; state: string; days: number }
  | { kind: 'table'; city: string; state: string; options: ShippingOption[] }
  | { kind: 'error'; message: string };

/**
 * Consulta de frete na página do produto.
 *
 * Enquanto a loja não cadastra a tabela de tarifas, o resultado é honesto:
 * confirmamos a cidade e avisamos que o valor é combinado no fechamento.
 */
export function ShippingEstimate({ slug }: { slug: string }) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function consult(event: React.FormEvent) {
    event.preventDefault();
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) {
      setResult({ kind: 'error', message: 'Digite um CEP com 8 dígitos.' });
      return;
    }

    setLoading(true);
    try {
      const addressResponse = await fetch(`/api/cep?cep=${digits}`);
      if (!addressResponse.ok) {
        setResult({ kind: 'error', message: 'CEP não encontrado.' });
        return;
      }
      const address = (await addressResponse.json()) as { city: string; state: string };

      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: [{ slug, quantity: 1 }], zip: digits, state: address.state }),
      });
      if (!cartResponse.ok) {
        setResult({ kind: 'error', message: 'Não foi possível calcular agora.' });
        return;
      }
      const cart = (await cartResponse.json()) as CartSummary;

      if (cart.shipping === null) {
        setResult({
          kind: 'quote',
          city: address.city,
          state: address.state,
          days: cart.shippingOptions[0]?.days ?? 2,
        });
      } else {
        setResult({ kind: 'table', city: address.city, state: address.state, options: cart.shippingOptions });
      }
    } catch {
      setResult({ kind: 'error', message: 'Não foi possível calcular agora.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-cream-100 p-5">
      <p className="text-[0.85rem] font-medium text-forest-900">Calcular entrega</p>
      <form onSubmit={consult} className="mt-3 flex gap-2">
        <input
          value={cep}
          onChange={(event) => setCep(event.target.value)}
          inputMode="numeric"
          placeholder="00000-000"
          aria-label="CEP de entrega"
          maxLength={9}
          className="h-11 w-36 rounded-full border border-line bg-cream-50 px-4 text-[0.85rem] text-forest-900 outline-none transition-colors focus:border-forest-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-full border border-forest-700/30 px-5 text-[0.85rem] text-forest-800 transition-colors hover:bg-forest-700 hover:text-cream-50 disabled:opacity-60"
        >
          {loading ? 'Consultando…' : 'Consultar'}
        </button>
      </form>

      {result?.kind === 'error' ? <p className="mt-3 text-[0.8rem] text-honey-700">{result.message}</p> : null}

      {result?.kind === 'quote' ? (
        <div className="mt-3 text-[0.82rem] leading-relaxed text-ink-soft">
          <p>
            Entrega para <strong className="font-medium text-forest-900">{result.city} / {result.state}</strong>.
          </p>
          <p className="mt-1 text-ink-muted">
            O valor do frete é confirmado pela nossa equipe no fechamento do pedido. Envio em até {result.days} dias
            úteis após a aprovação do pagamento.
          </p>
        </div>
      ) : null}

      {result?.kind === 'table' ? (
        <div className="mt-3">
          <p className="text-[0.82rem] text-ink-soft">
            Entrega para <strong className="font-medium text-forest-900">{result.city} / {result.state}</strong>:
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {result.options.map((option) => (
              <li key={option.id} className="flex justify-between text-[0.82rem]">
                <span className="text-ink-soft">
                  {option.label} · {option.days} dias úteis
                </span>
                <span className="tabular-nums text-forest-900">
                  {option.price === 0 ? 'Grátis' : formatPrice(option.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
