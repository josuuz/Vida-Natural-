import 'server-only';
import { prisma } from './db';
import { toSummary } from './catalog';
import { getFreeShippingRule, getShippingQuotes } from './shipping';
import type { AppliedCoupon, CartLineInput, CartSummary, CouponError, PriceTier } from '@/lib/types';

const toReais = (cents: number) => Math.round(cents) / 100;

export type CartInput = {
  lines: CartLineInput[];
  couponCode?: string | null;
  /** CEP apenas com dígitos, quando o cliente já informou. */
  zip?: string | null;
  state?: string | null;
  shippingOptionId?: string | null;
};

export type CouponResult =
  | { ok: true; coupon: AppliedCoupon; couponId: string; discountCents: number }
  | { ok: false; error: CouponError };

/**
 * Preço unitário válido para a quantidade pedida.
 * A faixa promocional só vale a partir da quantidade mínima cadastrada.
 */
export function resolveUnitPriceCents(
  priceCents: number,
  tiers: { minQuantity: number; unitPriceCents: number }[],
  quantity: number
) {
  const applicable = tiers
    .filter((tier) => quantity >= tier.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  return applicable ? Math.min(applicable.unitPriceCents, priceCents) : priceCents;
}

/** Valida o cupom contra o banco. Nunca confie no que o navegador enviou. */
export async function validateCoupon(code: string, subtotalCents: number): Promise<CouponResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon) return { ok: false, error: 'nao_encontrado' };
  if (!coupon.active) return { ok: false, error: 'inativo' };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: 'nao_iniciado' };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, error: 'expirado' };
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, error: 'limite_atingido' };
  }
  if (subtotalCents < coupon.minSubtotalCents) return { ok: false, error: 'subtotal_minimo' };

  const discountCents =
    coupon.type === 'percent'
      ? Math.round((subtotalCents * coupon.value) / 100)
      : Math.min(coupon.value, subtotalCents);

  return {
    ok: true,
    couponId: coupon.id,
    discountCents,
    coupon: {
      code: coupon.code,
      type: coupon.type === 'percent' ? 'percent' : 'fixed',
      value: coupon.type === 'percent' ? coupon.value : toReais(coupon.value),
      description: coupon.description,
    },
  };
}

/**
 * Recalcula o carrinho inteiro a partir do banco.
 *
 * É a única fonte de verdade de preço: o navegador manda apenas slug e
 * quantidade. Itens inativos ou sem estoque são removidos e reportados.
 */
export async function buildCart(input: CartInput): Promise<CartSummary & { couponError?: CouponError }> {
  const requested = input.lines
    .filter((line) => typeof line.slug === 'string' && Number.isFinite(line.quantity))
    .map((line) => ({ slug: line.slug, quantity: Math.max(0, Math.min(99, Math.floor(line.quantity))) }))
    .filter((line) => line.quantity > 0);

  const products = requested.length
    ? await prisma.product.findMany({
        where: { slug: { in: requested.map((line) => line.slug) } },
        include: { category: true, tiers: true },
      })
    : [];

  const removed: { slug: string; reason: string }[] = [];
  const lines: CartSummary['lines'] = [];
  let subtotalCents = 0;
  let fullPriceCents = 0;
  let weightGrams = 0;

  for (const line of requested) {
    const product = products.find((candidate) => candidate.slug === line.slug);
    if (!product) {
      removed.push({ slug: line.slug, reason: 'Produto não encontrado' });
      continue;
    }
    if (!product.active) {
      removed.push({ slug: line.slug, reason: 'Produto indisponível' });
      continue;
    }

    let quantity = line.quantity;
    if (product.trackStock) {
      if (product.stock <= 0) {
        removed.push({ slug: line.slug, reason: 'Produto sem estoque' });
        continue;
      }
      if (quantity > product.stock) {
        quantity = product.stock;
        removed.push({ slug: line.slug, reason: `Quantidade ajustada para o estoque (${product.stock})` });
      }
    }

    const tiers = product.tiers.map((tier) => ({
      minQuantity: tier.minQuantity,
      unitPriceCents: tier.unitPriceCents,
      highlight: tier.highlight,
      label: tier.label,
    }));
    const unitPriceCents = resolveUnitPriceCents(product.priceCents, tiers, quantity);
    const totalCents = unitPriceCents * quantity;

    subtotalCents += totalCents;
    fullPriceCents += product.priceCents * quantity;
    weightGrams += product.weightGrams * quantity;

    const summary = toSummary(product);
    const appliedTier = summary.tiers.find((tier) => quantity >= tier.minQuantity && tier.unitPrice * 100 <= product.priceCents) ?? null;
    const nextTier: PriceTier | null =
      summary.tiers.find((tier) => tier.minQuantity > quantity) ?? null;

    lines.push({
      product: summary,
      quantity,
      unitPrice: toReais(unitPriceCents),
      compareAtUnitPrice: unitPriceCents < product.priceCents ? toReais(product.priceCents) : null,
      total: toReais(totalCents),
      appliedTier,
      nextTier,
    });
  }

  // cupom
  let couponResult: CouponResult | null = null;
  if (input.couponCode) couponResult = await validateCoupon(input.couponCode, subtotalCents);
  const couponDiscountCents = couponResult?.ok ? couponResult.discountCents : 0;

  // frete
  const { mode, options } = await getShippingQuotes({
    state: input.state ?? null,
    weightGrams,
    subtotalCents: subtotalCents - couponDiscountCents,
  });
  const selected =
    options.find((option) => option.id === input.shippingOptionId) ?? (mode === 'table' ? options[0] : options[0]);
  const shippingCents = mode === 'table' ? (selected?.priceCents ?? 0) : 0;

  // recomendações complementares do primeiro item, sem repetir o carrinho
  const inCart = new Set(lines.map((line) => line.product.slug));
  const firstSlug = lines[0]?.product.slug;
  const suggestionRows = firstSlug
    ? await prisma.productRelation.findMany({
        where: {
          kind: 'cross-sell',
          product: { slug: firstSlug },
          related: { active: true, slug: { notIn: [...inCart] } },
        },
        orderBy: { position: 'asc' },
        take: 2,
        include: { related: { include: { category: true, tiers: true } } },
      })
    : [];
  const suggestions = suggestionRows.map((row) => toSummary(row.related));

  const freeRule = await getFreeShippingRule();
  const afterDiscount = subtotalCents - couponDiscountCents;
  const totalCents = Math.max(0, afterDiscount + shippingCents);

  return {
    lines,
    removed,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: toReais(subtotalCents),
    tierDiscount: toReais(fullPriceCents - subtotalCents),
    coupon: couponResult?.ok ? couponResult.coupon : null,
    couponError: couponResult && !couponResult.ok ? couponResult.error : undefined,
    couponDiscount: toReais(couponDiscountCents),
    discount: toReais(fullPriceCents - subtotalCents + couponDiscountCents),
    shipping: mode === 'table' ? toReais(shippingCents) : null,
    shippingOptions: options.map((option) => ({
      id: option.id,
      label: option.label,
      price: toReais(option.priceCents),
      days: option.days,
    })),
    selectedShipping: selected
      ? { id: selected.id, label: selected.label, price: toReais(selected.priceCents), days: selected.days }
      : null,
    freeShipping: freeRule.enabled
      ? {
          enabled: true,
          threshold: toReais(freeRule.thresholdCents),
          missing: toReais(Math.max(0, freeRule.thresholdCents - afterDiscount)),
          reached: afterDiscount >= freeRule.thresholdCents,
        }
      : null,
    total: toReais(totalCents),
    weightGrams,
    suggestions,
  };
}

/** Versão em centavos usada na criação do pedido. */
export async function buildCartCents(input: CartInput) {
  const summary = await buildCart(input);
  return {
    summary,
    subtotalCents: Math.round(summary.subtotal * 100),
    couponDiscountCents: Math.round(summary.couponDiscount * 100),
    shippingCents: Math.round((summary.shipping ?? 0) * 100),
    totalCents: Math.round(summary.total * 100),
  };
}
