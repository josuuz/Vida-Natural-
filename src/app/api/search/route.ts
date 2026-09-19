import { NextResponse } from 'next/server';
import { getSearchIndex } from '@/server/catalog';

export const runtime = 'nodejs';

const normalize = (value: string) =>
  value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

/** Busca no catálogo, ignorando acentos. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const term = (params.get('q') ?? '').trim();
  const limit = Math.min(Number(params.get('limit') ?? 6) || 6, 24);

  const index = await getSearchIndex();
  if (!term) {
    return NextResponse.json({ results: [] });
  }

  const words = normalize(term).split(/\s+/).filter(Boolean);
  const results = index
    .filter((entry: typeof index[number]) => words.every((word: string) => normalize(entry.haystack).includes(word)))
    .slice(0, limit)
    .map((entry: typeof index[number]) => {
      const { haystack, ...product } = entry;
      void haystack;
      return product;
    });

  return NextResponse.json({ results });
}
