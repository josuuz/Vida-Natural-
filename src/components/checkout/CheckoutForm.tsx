'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { formatPrice } from '@/lib/format';
import { site } from '@/lib/site';

type Field = {
  name: string;
  email: string;
  phone: string;
  document: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  notes: string;
};

const empty: Field = {
  name: '',
  email: '',
  phone: '',
  document: '',
  zip: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  notes: '',
};

const inputClass =
  'h-12 w-full rounded-lg border border-line bg-cream-50 px-4 text-[0.9rem] text-forest-900 outline-none transition-colors placeholder:text-ink-muted/60 focus:border-forest-500';

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[0.78rem] font-medium text-ink-soft">
      {children}
    </label>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { intent, summary, status, setAddress, chooseShipping, applyCoupon, couponError } = useCart();
  const [fields, setFields] = useState<Field>(empty);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState(intent.couponCode ?? '');
  // gerada no primeiro envio (render precisa ser puro) e reaproveitada nas
  // tentativas seguintes, para não duplicar o pedido
  const idempotencyKey = useRef<string | null>(null);

  const set = (key: keyof Field) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((current) => ({ ...current, [key]: event.target.value }));

  // preenche o endereço a partir do CEP
  useEffect(() => {
    const digits = fields.zip.replace(/\D/g, '');
    if (digits.length !== 8) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/cep?cep=${digits}`);
        if (!response.ok || cancelled) return;
        const address = (await response.json()) as {
          street: string;
          district: string;
          city: string;
          state: string;
        };
        setFields((current) => ({
          ...current,
          street: current.street || address.street,
          district: current.district || address.district,
          city: address.city,
          state: address.state,
        }));
        setAddress(digits, address.state);
      } catch {
        // sem rede: o cliente preenche à mão
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fields.zip, setAddress]);

  const lines = summary?.lines ?? [];
  const isEmpty = !intent.lines.length;

  const validation = useMemo(() => {
    const problems: string[] = [];
    if (fields.name.trim().length < 2) problems.push('Informe seu nome completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) problems.push('Informe um e-mail válido.');
    const document = fields.document.replace(/\D/g, '');
    if (document && document.length !== 11 && document.length !== 14) problems.push('CPF ou CNPJ inválido.');
    if (fields.zip.replace(/\D/g, '').length !== 8) problems.push('Informe um CEP válido.');
    if (fields.street.trim().length < 2) problems.push('Informe o endereço.');
    if (fields.number.trim().length < 1) problems.push('Informe o número.');
    if (fields.district.trim().length < 2) problems.push('Informe o bairro.');
    if (fields.city.trim().length < 2) problems.push('Informe a cidade.');
    if (fields.state.trim().length !== 2) problems.push('Informe o estado (UF).');
    return problems;
  }, [fields]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);

    if (validation.length) {
      setErrors(validation);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    idempotencyKey.current ??=
      typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `pedido-${Date.now()}`;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: intent.lines,
          customer: {
            name: fields.name,
            email: fields.email,
            phone: fields.phone || null,
            document: fields.document || null,
          },
          address: {
            zip: fields.zip,
            street: fields.street,
            number: fields.number,
            complement: fields.complement || null,
            district: fields.district,
            city: fields.city,
            state: fields.state.toUpperCase(),
          },
          couponCode: intent.couponCode,
          shippingOptionId: intent.shippingOptionId,
          notes: fields.notes || null,
          idempotencyKey: idempotencyKey.current,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error ?? 'Não conseguimos concluir o pedido.');
        return;
      }

      if (data.mode === 'mercadopago' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // sem gateway configurado: pedido registrado e fechado pelo WhatsApp
      router.push(`/pedido/${data.orderToken}?novo=1`);
    } catch {
      setServerError('Falha de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isEmpty) {
    return (
      <div className="container-page py-20 text-center">
        <p className="font-display text-3xl text-forest-900">Seu carrinho está vazio</p>
        <p className="mx-auto mt-4 max-w-sm text-[0.95rem] text-ink-muted">
          Escolha seus produtos e volte aqui para finalizar o pedido.
        </p>
        <Link
          href="/produtos"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-forest-700 px-7 text-sm text-cream-50 transition-colors hover:bg-forest-800"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="container-page grid gap-10 pb-24 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-14">
      <div className="flex flex-col gap-10">
        {/* dados */}
        <section>
          <h2 className="font-display text-[1.4rem] text-forest-900">1. Seus dados</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <input id="name" value={fields.name} onChange={set('name')} className={inputClass} autoComplete="name" />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <input
                id="email"
                type="email"
                value={fields.email}
                onChange={set('email')}
                className={inputClass}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <input
                id="phone"
                value={fields.phone}
                onChange={set('phone')}
                className={inputClass}
                autoComplete="tel"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="document">CPF ou CNPJ</Label>
              <input
                id="document"
                value={fields.document}
                onChange={set('document')}
                className={inputClass}
                inputMode="numeric"
                placeholder="somente números"
              />
              <p className="mt-1.5 text-[0.72rem] text-ink-muted">Exigido pelo meio de pagamento para emitir a nota.</p>
            </div>
          </div>
        </section>

        {/* entrega */}
        <section>
          <h2 className="font-display text-[1.4rem] text-forest-900">2. Entrega</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <Label htmlFor="zip">CEP</Label>
              <input
                id="zip"
                value={fields.zip}
                onChange={set('zip')}
                className={inputClass}
                inputMode="numeric"
                maxLength={9}
                autoComplete="postal-code"
                placeholder="00000-000"
              />
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor="street">Endereço</Label>
              <input
                id="street"
                value={fields.street}
                onChange={set('street')}
                className={inputClass}
                autoComplete="address-line1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="number">Número</Label>
              <input id="number" value={fields.number} onChange={set('number')} className={inputClass} />
            </div>
            <div className="sm:col-span-4">
              <Label htmlFor="complement">Complemento</Label>
              <input
                id="complement"
                value={fields.complement}
                onChange={set('complement')}
                className={inputClass}
                placeholder="opcional"
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="district">Bairro</Label>
              <input id="district" value={fields.district} onChange={set('district')} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="city">Cidade</Label>
              <input id="city" value={fields.city} onChange={set('city')} className={inputClass} />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="state">UF</Label>
              <input
                id="state"
                value={fields.state}
                onChange={(event) =>
                  setFields((current) => ({ ...current, state: event.target.value.toUpperCase().slice(0, 2) }))
                }
                className={inputClass}
                maxLength={2}
              />
            </div>
            <div className="sm:col-span-6">
              <Label htmlFor="notes">Observações do pedido</Label>
              <textarea
                id="notes"
                value={fields.notes}
                onChange={set('notes')}
                rows={3}
                className="w-full rounded-lg border border-line bg-cream-50 p-4 text-[0.9rem] text-forest-900 outline-none transition-colors focus:border-forest-500"
                placeholder="opcional"
              />
            </div>
          </div>

          {summary?.shippingOptions.length ? (
            <div className="mt-6">
              <p className="mb-2.5 text-[0.78rem] font-medium text-ink-soft">Forma de envio</p>
              <div className="flex flex-col gap-2">
                {summary.shippingOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                      (summary.selectedShipping?.id ?? '') === option.id
                        ? 'border-forest-700 bg-cream-100'
                        : 'border-line bg-cream-50 hover:border-forest-500'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="frete"
                        className="sr-only"
                        checked={(summary.selectedShipping?.id ?? '') === option.id}
                        onChange={() => chooseShipping(option.id)}
                      />
                      <span className="text-[0.88rem] text-forest-900">{option.label}</span>
                    </span>
                    <span className="text-[0.85rem] tabular-nums text-ink-soft">
                      {summary.shipping === null
                        ? 'a combinar'
                        : option.price === 0
                          ? 'Grátis'
                          : formatPrice(option.price)}
                    </span>
                  </label>
                ))}
              </div>
              {summary.shipping === null ? (
                <p className="mt-2 text-[0.75rem] leading-relaxed text-ink-muted">
                  O valor do frete é confirmado pela nossa equipe pelo WhatsApp {site.contact.whatsapp} antes do
                  envio. O pedido é registrado agora com o valor dos produtos.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* pagamento */}
        <section>
          <h2 className="font-display text-[1.4rem] text-forest-900">3. Pagamento</h2>
          <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft">
            Ao confirmar, você escolhe entre <strong className="font-medium text-forest-900">PIX</strong>,{' '}
            <strong className="font-medium text-forest-900">cartão de crédito</strong> ou{' '}
            <strong className="font-medium text-forest-900">boleto</strong> no ambiente seguro do Mercado Pago. A Vida
            Natural não recebe nem armazena os dados do seu cartão.
          </p>

          {errors.length ? (
            <ul className="mt-5 rounded-lg border border-honey-600/40 bg-honey-200/40 p-4 text-[0.82rem] text-forest-800">
              {errors.map((problem) => (
                <li key={problem}>• {problem}</li>
              ))}
            </ul>
          ) : null}

          {serverError ? (
            <p className="mt-5 rounded-lg border border-honey-600/40 bg-honey-200/40 p-4 text-[0.85rem] text-forest-800">
              {serverError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || status === 'syncing'}
            className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-forest-700 px-8 text-[0.95rem] font-medium text-cream-50 transition-all duration-300 hover:-translate-y-0.5 hover:bg-forest-800 disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
          >
            {submitting ? 'Gerando pagamento…' : `Finalizar pedido — ${formatPrice(summary?.total ?? 0)}`}
          </button>
        </section>
      </div>

      {/* resumo */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-xl border border-line bg-cream-100 p-6">
          <h2 className="font-display text-[1.2rem] text-forest-900">Resumo do pedido</h2>

          <ul className="mt-5 flex flex-col gap-4">
            {lines.map((line) => (
              <li key={line.product.slug} className="flex gap-3">
                <span className="grid h-16 w-14 shrink-0 place-items-center rounded-md bg-cream-50">
                  <Image
                    src={line.product.image.src}
                    alt=""
                    width={120}
                    height={120}
                    sizes="56px"
                    className="h-[85%] w-auto object-contain"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.85rem] text-forest-900">{line.product.title}</span>
                  <span className="block text-[0.75rem] text-ink-muted">
                    {line.quantity} × {formatPrice(line.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 text-[0.85rem] tabular-nums text-forest-900">{formatPrice(line.total)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-line pt-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                applyCoupon(couponInput.trim() ? couponInput : null);
              }}
              className="flex gap-2"
            >
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                placeholder="CUPOM"
                aria-label="Cupom de desconto"
                className="h-10 flex-1 rounded-full border border-line bg-cream-50 px-4 text-[0.8rem] uppercase text-forest-900 outline-none focus:border-forest-500"
              />
              <button
                type="submit"
                className="h-10 rounded-full border border-forest-700/30 px-4 text-[0.78rem] text-forest-800 transition-colors hover:bg-forest-700 hover:text-cream-50"
              >
                Aplicar
              </button>
            </form>
            {couponError ? <p className="mt-2 text-[0.72rem] text-honey-700">Cupom não aplicado.</p> : null}
          </div>

          <dl className="mt-5 flex flex-col gap-1.5 border-t border-line pt-4 text-[0.85rem]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums text-forest-900">{formatPrice(summary?.subtotal ?? 0)}</dd>
            </div>
            {summary && summary.couponDiscount > 0 ? (
              <div className="flex justify-between text-forest-600">
                <dt>Cupom {summary.coupon?.code}</dt>
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

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm text-ink-soft">Total</span>
            <span className="font-display text-2xl tabular-nums text-forest-900">
              {formatPrice(summary?.total ?? 0)}
            </span>
          </div>

          <p className="mt-4 text-[0.72rem] leading-relaxed text-ink-muted">
            Os valores são recalculados no servidor no momento da compra.
          </p>
        </div>
      </aside>
    </form>
  );
}
