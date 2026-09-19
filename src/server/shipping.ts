import 'server-only';
import { cache } from 'react';
import { prisma } from './db';
import { getBooleanSetting, getNumberSetting, getSetting } from './settings';

export type ShippingQuote = {
  id: string;
  label: string;
  priceCents: number;
  days: number;
};

export type ZipLookup = {
  zip: string;
  street: string;
  district: string;
  city: string;
  state: string;
} | null;

const onlyDigits = (value: string) => value.replace(/\D/g, '');

/**
 * Consulta o CEP no ViaCEP (serviço público e gratuito dos Correios).
 * Falhas de rede não quebram o checkout: devolvemos null e o cliente preenche
 * o endereço à mão.
 */
export const lookupZip = cache(async (rawZip: string): Promise<ZipLookup> => {
  const zip = onlyDigits(rawZip);
  if (zip.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      erro?: boolean | string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) return null;
    return {
      zip,
      street: data.logradouro ?? '',
      district: data.bairro ?? '',
      city: data.localidade ?? '',
      state: (data.uf ?? '').toUpperCase(),
    };
  } catch {
    return null;
  }
});

/**
 * Opções de frete para um estado e peso.
 *
 * Enquanto `shipping.mode` for "quote", a loja não publica preço de frete: o
 * pedido é fechado com frete a combinar, exatamente como acontece hoje no
 * atendimento. Ao cadastrar as tarifas em `ShippingRate` e mudar o modo para
 * "table", o cálculo passa a ser automático.
 */
export async function getShippingQuotes(params: {
  state: string | null;
  weightGrams: number;
  subtotalCents: number;
}): Promise<{ mode: 'quote' | 'table'; options: ShippingQuote[] }> {
  const mode = (await getSetting('shipping.mode')) === 'table' ? 'table' : 'quote';
  const handlingDays = await getNumberSetting('shipping.handlingDays');

  if (mode === 'quote' || !params.state) {
    return {
      mode: 'quote',
      options: [
        {
          id: 'a_combinar',
          label: 'Frete a combinar com a nossa equipe',
          priceCents: 0,
          days: handlingDays,
        },
      ],
    };
  }

  const rates = await prisma.shippingRate.findMany({
    where: { active: true, maxWeightGrams: { gte: Math.max(params.weightGrams, 1) } },
    orderBy: [{ position: 'asc' }, { priceCents: 'asc' }],
  });

  const matching = rates.filter((rate: typeof rates[number]) =>
    rate.states
      .split(',')
      .map((state: string) => state.trim().toUpperCase())
      .includes(params.state!.toUpperCase())
  );

  if (!matching.length) {
    return {
      mode: 'quote',
      options: [
        { id: 'a_combinar', label: 'Frete a combinar com a nossa equipe', priceCents: 0, days: handlingDays },
      ],
    };
  }

  const free = await getFreeShippingRule();
  const qualifiesForFree = free.enabled && params.subtotalCents >= free.thresholdCents;

  return {
    mode: 'table',
    options: matching.map((rate: typeof matching[number]) => ({
      id: rate.id,
      label: rate.name,
      priceCents: qualifiesForFree ? 0 : rate.priceCents,
      days: rate.days + handlingDays,
    })),
  };
}

export async function getFreeShippingRule() {
  return {
    enabled: await getBooleanSetting('shipping.freeShipping.enabled'),
    thresholdCents: await getNumberSetting('shipping.freeShipping.thresholdCents'),
  };
}
