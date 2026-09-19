import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { rateLimit } from '@/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().trim().email().max(160),
  number: z.string().trim().min(3).max(40),
});

/**
 * Consulta de pedido para quem comprou sem cadastro.
 *
 * Exige e-mail E número do pedido: só o e-mail permitiria que qualquer pessoa
 * lesse os pedidos de outra.
 */
export async function POST(request: Request) {
  if (!rateLimit(request, 'consulta-pedido', 20)) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um instante.' }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Informe e-mail e número do pedido.' }, { status: 400 });

  const number = parsed.data.number.toUpperCase().startsWith('VN-')
    ? parsed.data.number.toUpperCase()
    : `VN-${parsed.data.number.replace(/\D/g, '').padStart(6, '0')}`;

  const order = await prisma.order.findFirst({
    where: { number, customer: { email: parsed.data.email.trim().toLowerCase() } },
    select: { token: true },
  });

  // mensagem única para não revelar se o e-mail existe
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado para esse e-mail.' }, { status: 404 });

  return NextResponse.json({ token: order.token });
}
