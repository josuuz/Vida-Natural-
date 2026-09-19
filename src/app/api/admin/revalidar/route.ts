import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  /** Caminhos específicos; vazio revalida o catálogo inteiro. */
  paths: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
});

function authorized(request: Request) {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

/**
 * Publica na hora o que mudou no banco.
 *
 * As páginas de catálogo são cacheadas (ISR de 60s). Ao alterar preço, estoque
 * ou descrição, chame esta rota para o site refletir na mesma hora, sem deploy.
 */
export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'não autorizado' }, { status: 401 });

  let payload: unknown = {};
  try {
    payload = await request.json();
  } catch {
    // corpo vazio revalida tudo
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'dados inválidos' }, { status: 400 });

  const paths = parsed.data.paths?.length ? parsed.data.paths : ['/', '/produtos', '/sobre'];
  for (const path of paths) revalidatePath(path);

  // os detalhes de produto e categoria compartilham layout dinâmico
  if (!parsed.data.paths?.length) {
    revalidatePath('/produtos/[slug]', 'page');
    revalidatePath('/categoria/[slug]', 'page');
  }

  return NextResponse.json({ ok: true, revalidated: paths });
}
