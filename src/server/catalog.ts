import 'server-only';
import { cache } from 'react';
import { prisma } from './db';
import {
  KITS,
  crossSellSlugsFor,
  relatedSlugsFor,
  sourceCategories,
  sourceProducts,
} from '@/data/catalog-source';
import type {
  CategorySummary,
  DescriptionBlock,
  ImageRef,
  KitSummary,
  PriceTier,
  ProductBadge,
  ProductDetail,
  ProductSummary,
  Species,
} from '@/lib/types';

type ProductRow = Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
  category?: { slug: string; name: string; label: string; family: string } | null;
  tiers?: { minQuantity: number; unitPriceCents: number; highlight: boolean; label: string | null }[];
};

const toReais = (cents: number) => Math.round(cents) / 100;

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildBadges(row: ProductRow, discountPercent: number | null): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if (discountPercent !== null) badges.push({ kind: 'oferta', label: `${discountPercent}% OFF` });
  if (row.bestSeller) badges.push({ kind: 'mais-vendido', label: 'Mais vendido' });
  if (row.isNew) badges.push({ kind: 'novidade', label: 'Novidade' });
  // `featured` é curadoria de vitrine, não um atributo do produto: não vira selo
  if (row.trackStock && row.stock > 0 && row.stock <= row.lowStockThreshold) {
    badges.push({ kind: 'estoque-limitado', label: `Últimas ${row.stock} unidades` });
  }
  return badges;
}

function buildTiers(row: ProductRow): PriceTier[] {
  const tiers = row.tiers ?? [];
  return tiers
    .slice()
    .sort((a: typeof tiers[number], b: typeof tiers[number]) => a.minQuantity - b.minQuantity)
    .map((tier: typeof tiers[number]) => ({
      minQuantity: tier.minQuantity,
      unitPrice: toReais(tier.unitPriceCents),
      total: toReais(tier.unitPriceCents * tier.minQuantity),
      savings: toReais((row.priceCents - tier.unitPriceCents) * tier.minQuantity),
      highlight: tier.highlight,
      label: tier.label,
    }));
}

export function toSummary(row: ProductRow): ProductSummary {
  const price = toReais(row.priceCents);
  const compareAtPrice = row.compareAtPriceCents ? toReais(row.compareAtPriceCents) : null;
  const hasPromo = Boolean(row.compareAtPriceCents && row.compareAtPriceCents > row.priceCents);
  const discountPercent = hasPromo
    ? Math.round(((row.compareAtPriceCents! - row.priceCents) / row.compareAtPriceCents!) * 100)
    : null;

  const available = row.active && (!row.trackStock || row.stock > 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    line: row.line,
    title: row.title,
    variant: row.variant,
    categorySlug: row.category?.slug ?? '',
    categoryName: row.category?.label ?? '',
    size: row.sizeLabel,
    price,
    compareAtPrice: hasPromo ? compareAtPrice : null,
    discountPercent,
    savings: hasPromo ? toReais(row.compareAtPriceCents! - row.priceCents) : null,
    installments:
      row.installmentCount && row.installmentValueCents
        ? { count: row.installmentCount, value: toReais(row.installmentValueCents) }
        : null,
    image: parseJson<ImageRef>(row.cutout, { src: '/produtos/placeholder.webp', width: 800, height: 800 }),
    available,
    lowStock: row.trackStock && row.stock > 0 && row.stock <= row.lowStockThreshold,
    stock: row.trackStock ? row.stock : null,
    badges: buildBadges(row, discountPercent),
    tiers: buildTiers(row),
  };
}

const include = { category: true, tiers: true } as const;

/* ----------------------------------------------------------------- fallback

O catálogo é público e não pode depender do banco: enquanto DATABASE_URL não
estiver configurada — ou enquanto as tabelas ainda não existirem — as páginas
da vitrine respondem a partir de `src/data/catalog-source.ts`, a mesma fonte
que alimenta o seed. Pedido, checkout e admin continuam exigindo banco de
verdade e não usam este caminho.                                            */

/** Erros que significam "ainda não há banco", não "a consulta está errada". */
const NO_DATABASE_CODES = new Set(['P1000', 'P1001', 'P1003', 'P1010', 'P2021', 'P2022']);

let warned = false;

function isDatabaseMissing(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code;
  if (typeof code === 'string' && NO_DATABASE_CODES.has(code)) return true;
  // o adapter do SQLite não repassa o código quando o arquivo não existe
  const message = error instanceof Error ? error.message : '';
  return /does not exist|no such table|unable to open database/i.test(message);
}

/**
 * Consulta o banco; se ele ainda não existe, devolve o catálogo em arquivo.
 * Sem DATABASE_URL nem tentamos conectar, para não criar um SQLite vazio.
 */
async function fromDatabase<T>(query: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback();
  try {
    return await query();
  } catch (error) {
    if (!isDatabaseMissing(error)) throw error;
    if (!warned) {
      warned = true;
      console.warn('[catalogo] banco indisponivel — servindo o catalogo local de src/data/catalog-source.ts');
    }
    return fallback();
  }
}

const localRows = sourceProducts as unknown as ProductRow[];
const localBySlug = new Map(localRows.map((row) => [row.slug, row]));
const localActive = () => localRows.filter((row) => row.active);

function toDetail(row: ProductRow): ProductDetail {
  return {
    ...toSummary(row),
    sku: row.sku,
    description: parseJson<DescriptionBlock[]>(row.description, []),
    metaDescription: row.metaDescription,
    gallery: parseJson<ImageRef[]>(row.images, []),
    infoImages: parseJson<ImageRef[]>(row.infoImages, []),
    weightGrams: row.weightGrams,
  };
}

/**
 * Espécie de abelha nativa.
 *
 * O nome científico e o epíteto vêm da própria descrição oficial do produto,
 * que abre com "Mel de <Espécie> (<Nome científico>) — <Epíteto>".
 */
function toSpecies(row: ProductRow): Species | null {
  const blocks = parseJson<DescriptionBlock[]>(row.description, []);
  const heading = blocks.find((block: DescriptionBlock) => block.kind === 'heading')?.text ?? '';
  const match = heading.match(/^Mel de ([^(]+)\(([^)]+)\)\s*[—-]\s*(.+)$/);
  if (!match) return null;
  return {
    name: match[1].replace(/-/g, ' ').trim(),
    scientific: match[2].trim(),
    epithet: match[3].trim(),
    product: toSummary(row),
  };
}

function toKitSummary(kit: (typeof KITS)[number], rows: ProductRow[]): KitSummary | null {
  const items = kit.items
    .map((item) => {
      const row = rows.find((candidate) => candidate.slug === item.slug);
      return row ? { product: toSummary(row), quantity: item.quantity, priceCents: row.priceCents } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (items.length !== kit.items.length) return null;

  const itemsTotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  return {
    slug: kit.slug,
    name: kit.name,
    description: kit.description,
    // o preço fechado do kit vive no banco; sem ele, é a soma dos itens
    price: null,
    itemsTotal: toReais(itemsTotalCents),
    savings: null,
    items: items.map(({ product, quantity }) => ({ product, quantity })),
  };
}

/* ------------------------------------------------------------------ queries */

export const getCategories = cache(
  async (): Promise<CategorySummary[]> =>
    fromDatabase(
      async () => {
        const rows = await prisma.category.findMany({
          where: { active: true },
          orderBy: { position: 'asc' },
          include: { _count: { select: { products: { where: { active: true } } } } },
        });

        return rows.map((row: (typeof rows)[number]) => ({
          slug: row.slug,
          name: row.name,
          label: row.label,
          tagline: row.tagline,
          family: row.family as CategorySummary['family'],
          count: row._count.products,
        }));
      },
      () =>
        sourceCategories
          .filter((category) => category.active)
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((category) => ({
            slug: category.slug,
            name: category.name,
            label: category.label,
            tagline: category.tagline,
            family: category.family as CategorySummary['family'],
            count: localActive().filter((row) => row.categoryId === category.id).length,
          }))
    )
);

export const getCategory = cache(async (slug: string) => {
  const rows = await getCategories();
  return rows.find((category) => category.slug === slug) ?? null;
});

export const getProducts = cache(
  async (categorySlug?: string): Promise<ProductSummary[]> =>
    fromDatabase(
      async () => {
        const rows = await prisma.product.findMany({
          where: { active: true, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
          orderBy: [{ position: 'asc' }],
          include,
        });
        return rows.map(toSummary);
      },
      () =>
        localActive()
          .filter((row) => !categorySlug || row.category?.slug === categorySlug)
          .map(toSummary)
    )
);

export const getFeaturedProducts = cache(
  async (limit = 8): Promise<ProductSummary[]> =>
    fromDatabase(
      async () => {
        const rows = await prisma.product.findMany({
          where: { active: true, featured: true },
          orderBy: { position: 'asc' },
          take: limit,
          include,
        });
        return rows.map(toSummary);
      },
      () =>
        localActive()
          .filter((row) => row.featured)
          .slice(0, limit)
          .map(toSummary)
    )
);

export const getProduct = cache(
  async (slug: string): Promise<ProductDetail | null> =>
    fromDatabase(
      async () => {
        const row = await prisma.product.findUnique({ where: { slug }, include });
        return row && row.active ? toDetail(row) : null;
      },
      () => {
        const row = localBySlug.get(slug);
        return row && row.active ? toDetail(row) : null;
      }
    )
);

export const getProductSlugs = cache(
  async (): Promise<string[]> =>
    fromDatabase(
      async () => {
        const rows = await prisma.product.findMany({ where: { active: true }, select: { slug: true } });
        return rows.map((row: (typeof rows)[number]) => row.slug);
      },
      () => localActive().map((row) => row.slug)
    )
);

/** Recomendações editoriais: no banco quando existe, pela mesma regra sem ele. */
export const getRelatedProducts = cache(
  async (slug: string, kind: 'related' | 'cross-sell', limit = 4): Promise<ProductSummary[]> =>
    fromDatabase(
      async () => {
        const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
        if (!product) return [];

        const rows = await prisma.productRelation.findMany({
          where: { productId: product.id, kind, related: { active: true } },
          orderBy: { position: 'asc' },
          take: limit,
          include: { related: { include } },
        });
        return rows.map((row: (typeof rows)[number]) => toSummary(row.related));
      },
      () => {
        const slugs = kind === 'related' ? relatedSlugsFor(slug, limit) : crossSellSlugsFor(slug, limit);
        return slugs
          .map((related) => localBySlug.get(related))
          .filter((row): row is ProductRow => Boolean(row?.active))
          .map(toSummary);
      }
    )
);

export const getSpecies = cache(
  async (): Promise<Species[]> =>
    fromDatabase(
      async () => {
        const rows = await prisma.product.findMany({
          where: { active: true, category: { slug: 'meis-de-abelhas-sem-ferrao-lancamentos' } },
          orderBy: { position: 'asc' },
          include,
        });
        return rows.map(toSpecies).filter((entry): entry is Species => Boolean(entry));
      },
      () =>
        localActive()
          .filter((row) => row.category?.slug === 'meis-de-abelhas-sem-ferrao-lancamentos')
          .map(toSpecies)
          .filter((entry): entry is Species => Boolean(entry))
    )
);

/** Kits que contêm o produto informado. */
export const getKitsForProduct = cache(
  async (slug: string): Promise<KitSummary[]> =>
    fromDatabase(
      async () => {
        const rows = await prisma.kit.findMany({
          where: { active: true, items: { some: { product: { slug } } } },
          orderBy: { position: 'asc' },
          include: { items: { include: { product: { include } } } },
        });

        return rows.map((kit: (typeof rows)[number]) => {
          const items = kit.items.map((item: (typeof kit)['items'][number]) => ({
            product: toSummary(item.product),
            quantity: item.quantity,
          }));
          const itemsTotalCents = kit.items.reduce(
            (sum: number, item: (typeof kit)['items'][number]) => sum + item.product.priceCents * item.quantity,
            0
          );
          return {
            slug: kit.slug,
            name: kit.name,
            description: kit.description,
            price: kit.priceCents ? toReais(kit.priceCents) : null,
            itemsTotal: toReais(itemsTotalCents),
            savings:
              kit.priceCents && kit.priceCents < itemsTotalCents ? toReais(itemsTotalCents - kit.priceCents) : null,
            items,
          };
        });
      },
      () => {
        const rows = localActive();
        return KITS.filter((kit) => kit.items.some((item) => item.slug === slug))
          .map((kit) => toKitSummary(kit, rows))
          .filter((kit): kit is KitSummary => Boolean(kit));
      }
    )
);

/** Índice leve usado pela busca no cliente. */
export const getSearchIndex = cache(async () => {
  const withHaystack = (row: ProductRow) => {
    const summary = toSummary(row);
    const blocks = parseJson<DescriptionBlock[]>(row.description, []);
    return {
      ...summary,
      haystack: [
        row.name,
        row.title,
        row.line,
        row.sku ?? '',
        blocks.map((block: DescriptionBlock) => block.text).join(' '),
      ]
        .join(' ')
        .toLowerCase(),
    };
  };

  return fromDatabase(
    async () => {
      const rows = await prisma.product.findMany({ where: { active: true }, orderBy: { position: 'asc' }, include });
      return rows.map(withHaystack);
    },
    () => localActive().map(withHaystack)
  );
});
