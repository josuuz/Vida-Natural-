import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { createOrder, OrderError } from '@/server/orders';
import { createPreference, isMercadoPagoConfigured } from '@/server/payments/mercadopago';
import { rateLimit } from '@/server/rate-limit';
import { site, whatsappLink } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  lines: z
    .array(z.object({ slug: z.string().min(1).max(200), quantity: z.number().int().min(1).max(99) }))
    .min(1)
    .max(60),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(160),
    phone: z.string().trim().max(30).nullish(),
    document: z
      .string()
      .trim()
      .transform((value) => value.replace(/\D/g, ''))
      .refine((value) => value === '' || value.length === 11 || value.length === 14, 'CPF ou CNPJ inválido')
      .nullish(),
  }),
  address: z
    .object({
      zip: z.string().trim().min(8).max(10),
      street: z.string().trim().min(2).max(160),
      number: z.string().trim().min(1).max(20),
      complement: z.string().trim().max(120).nullish(),
      district: z.string().trim().min(2).max(120),
      city: z.string().trim().min(2).max(120),
      state: z.string().trim().length(2),
    })
    .nullish(),
  couponCode: z.string().trim().max(40).nullish(),
  shippingOptionId: z.string().trim().max(60).nullish(),
  notes: z.string().trim().max(500).nullish(),
  idempotencyKey: z.string().trim().min(8).max(80),
});

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

/**
 * Cria o pedido e, quando o gateway está configurado, a cobrança.
 *
 * O total cobrado é SEMPRE o recalculado no servidor — o corpo da requisição
 * não carrega preços.
 */
export async function POST(request: Request) {
  if (!rateLimit(request, 'checkout', 20)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um instante.' }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados do pedido inválidos', issues: parsed.error.issues.map((issue) => issue.path.join('.')) },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    const { order, reused } = await createOrder({
      lines: input.lines,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone ?? null,
        document: input.customer.document || null,
      },
      address: input.address ?? null,
      couponCode: input.couponCode ?? null,
      shippingOptionId: input.shippingOptionId ?? null,
      notes: input.notes ?? null,
      idempotencyKey: input.idempotencyKey,
    });

    // sem gateway configurado o pedido existe e é fechado pelo WhatsApp —
    // em nenhum momento fingimos que houve pagamento
    if (!isMercadoPagoConfigured()) {
      const message = [
        `Olá! Acabei de fazer o pedido ${order.number} no site.`,
        '',
        ...order.items.map((item) => `• ${item.quantity}x ${item.name}`),
        '',
        `Total: R$ ${(order.totalCents / 100).toFixed(2).replace('.', ',')}`,
      ].join('\n');

      return NextResponse.json({
        mode: 'whatsapp' as const,
        orderNumber: order.number,
        orderToken: order.token,
        total: order.totalCents / 100,
        whatsappUrl: whatsappLink(message),
        whatsappNumber: site.contact.whatsapp,
        reused,
      });
    }

    if (reused && order.gatewayPreference) {
      return NextResponse.json({
        mode: 'mercadopago' as const,
        orderNumber: order.number,
        orderToken: order.token,
        preferenceId: order.gatewayPreference,
        checkoutUrl: `${siteUrl()}/pedido/${order.token}`,
        reused: true,
      });
    }

    const base = siteUrl();
    const preference = await createPreference({
      orderId: order.id,
      orderNumber: order.number,
      items: order.items.map((item) => ({
        id: item.slug,
        title: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        pictureUrl: `${base}${item.imageSrc}`,
      })),
      shippingCents: order.shippingCents,
      discountCents: order.discountCents,
      payer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone ?? null,
        document: input.customer.document || null,
      },
      backUrls: {
        success: `${base}/pedido/sucesso?pedido=${order.token}`,
        pending: `${base}/pedido/pendente?pedido=${order.token}`,
        failure: `${base}/pedido/erro?pedido=${order.token}`,
      },
      notificationUrl: `${base}/api/webhooks/mercadopago`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { gateway: 'mercadopago', gatewayPreference: preference.id },
    });

    return NextResponse.json({
      mode: 'mercadopago' as const,
      orderNumber: order.number,
      orderToken: order.token,
      preferenceId: preference.id,
      checkoutUrl: preference.checkoutUrl,
      reused,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }
    console.error('[checkout]', error);
    return NextResponse.json(
      { error: 'Não conseguimos gerar o pagamento agora. Tente novamente em instantes.' },
      { status: 502 }
    );
  }
}
