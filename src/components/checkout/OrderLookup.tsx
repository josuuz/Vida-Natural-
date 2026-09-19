'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { site } from '@/lib/site';

export function OrderLookup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/pedidos/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, number }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Não encontramos esse pedido.');
        return;
      }
      router.push(`/pedido/${data.token}`);
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container-page pb-24">
      <form onSubmit={submit} className="max-w-md">
        <label htmlFor="email" className="mb-1.5 block text-[0.78rem] font-medium text-ink-soft">
          E-mail da compra
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-lg border border-line bg-cream-50 px-4 text-[0.9rem] text-forest-900 outline-none focus:border-forest-500"
          autoComplete="email"
        />

        <label htmlFor="numero" className="mb-1.5 mt-4 block text-[0.78rem] font-medium text-ink-soft">
          Número do pedido
        </label>
        <input
          id="numero"
          value={number}
          onChange={(event) => setNumber(event.target.value.toUpperCase())}
          placeholder="VN-000123"
          className="h-12 w-full rounded-lg border border-line bg-cream-50 px-4 text-[0.9rem] text-forest-900 outline-none focus:border-forest-500"
        />

        {error ? <p className="mt-4 text-[0.82rem] text-honey-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-forest-700 px-7 text-[0.9rem] text-cream-50 transition-colors hover:bg-forest-800 disabled:opacity-60"
        >
          {loading ? 'Procurando…' : 'Ver meu pedido'}
        </button>

        <p className="mt-8 text-[0.8rem] leading-relaxed text-ink-muted">
          Não encontrou? Fale com a gente pelo WhatsApp {site.contact.whatsapp} ou pelo e-mail {site.contact.email} que
          localizamos para você.
        </p>
      </form>
    </section>
  );
}
