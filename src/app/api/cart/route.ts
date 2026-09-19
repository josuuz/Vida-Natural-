import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildCart } from '@/server/cart';
import { rateLimit } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  lines: z
    .array(z.object({ slug: z.string().min(1).max(200), quantity: z.number().int().min(0).max(99) }))
    .max(60),
  couponCode: z.string().trim().max(40).nullish(),
  zip: z.string().trim().max(12).nullish(),
  state: z.string().trim().length(2).nullish(),
  shippingOptionId: z.string().trim().max(60).nullish(),
});

/**
 * Recalcula o carrinho no servidor.
 * O navegador manda apenas slug + quantidade; preço, desconto, cupom e frete
 * saem daqui.
 */
export async function POST(request: Request) {
  if (!rateLimit(request, 'cart', 120)) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados do carrinho inválidos' }, { status: 400 });
  }

  const cart = await buildCart({
    lines: parsed.data.lines,
    couponCode: parsed.data.couponCode ?? null,
    zip: parsed.data.zip ?? null,
    state: parsed.data.state ?? null,
    shippingOptionId: parsed.data.shippingOptionId ?? null,
  });

  return NextResponse.json(cart, { headers: { 'Cache-Control': 'no-store' } });
}
