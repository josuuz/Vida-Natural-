import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { applyPaymentUpdate } from '@/server/orders';
import type { OrderStatus, PaymentStatus } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORDER_STATUS = [
  'aguardando_pagamento',
  'pago',
  'em_separacao',
  'enviado',
  'entregue',
  'cancelado',
] as const;

const PAYMENT_STATUS = ['pending', 'approved', 'in_process', 'rejected', 'cancelled', 'refunded'] as const;

const schema = z.object({
  number: z.string().trim().min(3).max(40),
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  status: z.enum(ORDER_STATUS).optional(),
  note: z.string().trim().max(300).optional(),
});

/** Só responde com um token administrativo válido. */
function authorized(request: Request) {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false;
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${expected}`;
}

/** Lista os pedidos mais recentes. */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { items: true, customer: true },
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      number: order.number,
      token: order.token,
      customer: order.customer.email,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.totalCents / 100,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
    })),
  });
}

/**
 * Atualiza a situação de um pedido.
 *
 * Serve para a operação da loja (marcar como pago fora do gateway, enviar,
 * cancelar) e usa o mesmo caminho do webhook, então a baixa de estoque e o
 * histórico continuam consistentes.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'dados inválidos' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { number: parsed.data.number } });
  if (!order) return NextResponse.json({ error: 'pedido não encontrado' }, { status: 404 });

  if (parsed.data.paymentStatus) {
    await applyPaymentUpdate({
      orderId: order.id,
      paymentStatus: parsed.data.paymentStatus as PaymentStatus,
      source: 'admin',
    });
  }

  if (parsed.data.status) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: parsed.data.status as OrderStatus,
        events: { create: { status: parsed.data.status, note: parsed.data.note ?? null, source: 'admin' } },
      },
    });
  }

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  return NextResponse.json({
    number: updated!.number,
    status: updated!.status,
    paymentStatus: updated!.paymentStatus,
  });
}
