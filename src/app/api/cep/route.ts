import { NextResponse } from 'next/server';
import { lookupZip } from '@/server/shipping';
import { rateLimit } from '@/server/rate-limit';

export const runtime = 'nodejs';

/** Busca endereço pelo CEP (ViaCEP) para preencher o checkout. */
export async function GET(request: Request) {
  if (!rateLimit(request, 'cep', 60)) {
    return NextResponse.json({ error: 'Muitas consultas seguidas.' }, { status: 429 });
  }

  const cep = new URL(request.url).searchParams.get('cep') ?? '';
  const address = await lookupZip(cep);
  if (!address) return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });

  return NextResponse.json(address, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
