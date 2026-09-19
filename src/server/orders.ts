import 'server-only';
import { randomUUID } from 'node:crypto';
import { prisma } from './db';
import { buildCartCents } from './cart';
import type { CartLineInput, OrderSummary, OrderStatus, PaymentStatus } from '@/lib/types';

export type CustomerInput = {
  name: string;
  email: string;
  phone?: string | null;
  document?: string | null;
};

export type AddressInput = {
  zip: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
};

export type CreateOrderInput = {
  lines: CartLineInput[];
  customer: CustomerInput;
  address?: AddressInput | null;
  couponCode?: string | null;
  shippingOptionId?: string | null;
  notes?: string | null;
  /** Evita que um duplo clique gere dois pedidos. */
  idempotencyKey?: string | null;
};

const toReais = (cents: number) => Math.round(cents) / 100;

/** Número sequencial legível para o cliente (VN-000123). */
async function nextOrderNumber() {
  const key = 'orders.sequence';
  const row = await prisma.setting.findUnique({ where: { key } });
  const next = Number(row?.value ?? '0') + 1;
  await prisma.setting.upsert({ where: { key }, update: { value: String(next) }, create: { key, value: String(next) } });
  return `VN-${String(next).padStart(6, '0')}`;
}

/**
 * Cria o pedido recalculando tudo no servidor.
 *
 * O frontend envia apenas slug + quantidade, cupom e endereço. Preço,
 * desconto, frete e total são recomputados a partir do banco.
 */
export async function createOrder(input: CreateOrderInput) {
  if (input.idempotencyKey) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true },
    });
    if (existing) return { order: existing, reused: true as const };
  }

  const { summary, subtotalCents, couponDiscountCents, shippingCents, totalCents } = await buildCartCents({
    lines: input.lines,
    couponCode: input.couponCode ?? null,
    state: input.address?.state ?? null,
    zip: input.address?.zip ?? null,
    shippingOptionId: input.shippingOptionId ?? null,
  });

  if (!summary.lines.length) throw new OrderError('carrinho_vazio', 'Nenhum item válido no carrinho.');
  if (summary.couponError && input.couponCode) {
    throw new OrderError('cupom_invalido', 'O cupom informado não é válido para este pedido.');
  }

  const email = input.customer.email.trim().toLowerCase();
  const customer = await prisma.customer.upsert({
    where: { email },
    update: {
      name: input.customer.name.trim(),
      phone: input.customer.phone ?? undefined,
      document: input.customer.document ?? undefined,
    },
    create: {
      name: input.customer.name.trim(),
      email,
      phone: input.customer.phone ?? null,
      document: input.customer.document ?? null,
    },
  });

  const address = input.address
    ? await prisma.address.create({
        data: {
          customerId: customer.id,
          zip: input.address.zip.replace(/\D/g, ''),
          street: input.address.street,
          number: input.address.number,
          complement: input.address.complement ?? null,
          district: input.address.district,
          city: input.address.city,
          state: input.address.state.toUpperCase(),
        },
      })
    : null;

  const slugs = summary.lines.map((line) => line.product.slug);
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } } });

  const coupon = summary.coupon
    ? await prisma.coupon.findUnique({ where: { code: summary.coupon.code } })
    : null;

  const number = await nextOrderNumber();

  const order = await prisma.order.create({
    data: {
      number,
      token: randomUUID(),
      customerId: customer.id,
      shippingAddressId: address?.id ?? null,
      couponId: coupon?.id ?? null,
      couponCode: coupon?.code ?? null,
      subtotalCents,
      discountCents: couponDiscountCents,
      shippingCents,
      totalCents,
      shippingService: summary.selectedShipping?.id ?? 'a_combinar',
      shippingLabel: summary.selectedShipping?.label ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      notes: input.notes ?? null,
      items: {
        create: summary.lines.map((line) => {
          const product = products.find((candidate) => candidate.slug === line.product.slug)!;
          return {
            productId: product.id,
            name: product.name,
            slug: product.slug,
            imageSrc: line.product.image.src,
            unitPriceCents: Math.round(line.unitPrice * 100),
            compareAtPriceCents: line.compareAtUnitPrice ? Math.round(line.compareAtUnitPrice * 100) : null,
            quantity: line.quantity,
            totalCents: Math.round(line.total * 100),
          };
        }),
      },
      events: {
        create: {
          status: 'aguardando_pagamento',
          note: 'Pedido criado',
          source: 'system',
        },
      },
    },
    include: { items: true },
  });

  if (coupon) {
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
  }

  return { order, reused: false as const };
}

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

/** Mapeia o status do gateway para o status do pedido. */
export function orderStatusFor(paymentStatus: PaymentStatus): OrderStatus {
  switch (paymentStatus) {
    case 'approved':
      return 'pago';
    case 'rejected':
    case 'cancelled':
      return 'cancelado';
    case 'refunded':
      return 'cancelado';
    default:
      return 'aguardando_pagamento';
  }
}

/**
 * Atualiza o pedido a partir de um evento do gateway.
 * É idempotente: reprocessar o mesmo status não duplica eventos nem baixa
 * estoque duas vezes.
 */
export async function applyPaymentUpdate(params: {
  orderId: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  gatewayPaymentId?: string | null;
  source?: 'webhook' | 'callback' | 'admin';
}) {
  const order = await prisma.order.findUnique({ where: { id: params.orderId }, include: { items: true } });
  if (!order) return null;

  const alreadyApplied =
    order.paymentStatus === params.paymentStatus &&
    (!params.gatewayPaymentId || order.gatewayPaymentId === params.gatewayPaymentId);
  if (alreadyApplied) return order;

  const status = orderStatusFor(params.paymentStatus);
  const becamePaid = params.paymentStatus === 'approved' && order.paymentStatus !== 'approved';

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: params.paymentStatus,
      paymentMethod: params.paymentMethod ?? order.paymentMethod,
      gatewayPaymentId: params.gatewayPaymentId ?? order.gatewayPaymentId,
      status,
      paidAt: becamePaid ? new Date() : order.paidAt,
      events: {
        create: {
          status,
          note: `Pagamento ${params.paymentStatus}`,
          source: params.source ?? 'webhook',
        },
      },
    },
    include: { items: true },
  });

  // baixa de estoque só acontece uma vez, quando o pagamento é aprovado
  if (becamePaid) {
    for (const item of updated.items) {
      await prisma.product.updateMany({
        where: { id: item.productId, trackStock: true },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }

  return updated;
}

export async function getOrderByToken(token: string): Promise<OrderSummary | null> {
  const order = await prisma.order.findUnique({
    where: { token },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
      customer: true,
      shippingAddress: true,
    },
  });
  if (!order) return null;

  return {
    number: order.number,
    token: order.token,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: toReais(order.subtotalCents),
    discount: toReais(order.discountCents),
    shipping: toReais(order.shippingCents),
    total: toReais(order.totalCents),
    couponCode: order.couponCode,
    shippingLabel: order.shippingLabel,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    customer: { name: order.customer.name, email: order.customer.email },
    address: order.shippingAddress
      ? {
          zip: order.shippingAddress.zip,
          street: order.shippingAddress.street,
          number: order.shippingAddress.number,
          complement: order.shippingAddress.complement,
          district: order.shippingAddress.district,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
        }
      : null,
    items: order.items.map((item) => ({
      slug: item.slug,
      name: item.name,
      image: item.imageSrc,
      quantity: item.quantity,
      unitPrice: toReais(item.unitPriceCents),
      total: toReais(item.totalCents),
    })),
    events: order.events.map((event) => ({
      status: event.status,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

/** Histórico de pedidos de um cliente, consultado por e-mail. */
export async function getOrdersByEmail(email: string) {
  const customer = await prisma.customer.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { orders: { orderBy: { createdAt: 'desc' }, include: { items: true } } },
  });
  if (!customer) return [];

  return customer.orders.map((order) => ({
    number: order.number,
    token: order.token,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    total: toReais(order.totalCents),
    createdAt: order.createdAt.toISOString(),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));
}
