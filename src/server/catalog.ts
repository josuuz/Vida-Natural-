import 'server-only';
import { cache } from 'react';
import { prisma } from './db';
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
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((tier) => ({
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

/* ------------------------------------------------------------------ queries */

export const getCategories = cache(async (): Promise<CategorySummary[]> => {
  const rows = await prisma.category.findMany({
    where: { active: true },
    orderBy: { position: 'asc' },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });

  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    label: row.label,
    tagline: row.tagline,
    family: row.family as CategorySummary['family'],
    count: row._count.products,
  }));
});

export const getCategory = cache(async (slug: string) => {
  const rows = await getCategories();
  return rows.find((category) => category.slug === slug) ?? null;
});

export const getProducts = cache(async (categorySlug?: string): Promise<ProductSummary[]> => {
  const rows = await prisma.product.findMany({
    where: { active: true, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
    orderBy: [{ position: 'asc' }],
    include,
  });
  return rows.map(toSummary);
});

export const getFeaturedProducts = cache(async (limit = 8): Promise<ProductSummary[]> => {
  const rows = await prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: { position: 'asc' },
    take: limit,
    include,
  });
  return rows.map(toSummary);
});

export const getProduct = cache(async (slug: string): Promise<ProductDetail | null> => {
  const row = await prisma.product.findUnique({ where: { slug }, include });
  if (!row || !row.active) return null;

  return {
    ...toSummary(row),
    sku: row.sku,
    description: parseJson<DescriptionBlock[]>(row.description, []),
    metaDescription: row.metaDescription,
    gallery: parseJson<ImageRef[]>(row.images, []),
    infoImages: parseJson<ImageRef[]>(row.infoImages, []),
    weightGrams: row.weightGrams,
  };
});

export const getProductSlugs = cache(async () => {
  const rows = await prisma.product.findMany({ where: { active: true }, select: { slug: true } });
  return rows.map((row) => row.slug);
});

/** Recomendações editoriais salvas no banco. */
export const getRelatedProducts = cache(
  async (slug: string, kind: 'related' | 'cross-sell', limit = 4): Promise<ProductSummary[]> => {
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) return [];

    const rows = await prisma.productRelation.findMany({
      where: { productId: product.id, kind, related: { active: true } },
      orderBy: { position: 'asc' },
      take: limit,
      include: { related: { include } },
    });
    return rows.map((row) => toSummary(row.related));
  }
);

/**
 * Espécies de abelhas nativas.
 *
 * O nome científico e o epíteto vêm da própria descrição oficial do produto,
 * que abre com "Mel de <Espécie> (<Nome científico>) — <Epíteto>".
 */
export const getSpecies = cache(async (): Promise<Species[]> => {
  const rows = await prisma.product.findMany({
    where: { active: true, category: { slug: 'meis-de-abelhas-sem-ferrao-lancamentos' } },
    orderBy: { position: 'asc' },
    include,
  });

  return rows
    .map((row) => {
      const blocks = parseJson<DescriptionBlock[]>(row.description, []);
      const heading = blocks.find((block) => block.kind === 'heading')?.text ?? '';
      const match = heading.match(/^Mel de ([^(]+)\(([^)]+)\)\s*[—-]\s*(.+)$/);
      if (!match) return null;
      return {
        name: match[1].replace(/-/g, ' ').trim(),
        scientific: match[2].trim(),
        epithet: match[3].trim(),
        product: toSummary(row),
      };
    })
    .filter((entry): entry is Species => Boolean(entry));
});

/** Kits que contêm o produto informado. */
export const getKitsForProduct = cache(async (slug: string): Promise<KitSummary[]> => {
  const rows = await prisma.kit.findMany({
    where: { active: true, items: { some: { product: { slug } } } },
    orderBy: { position: 'asc' },
    include: { items: { include: { product: { include } } } },
  });

  return rows.map((kit) => {
    const items = kit.items.map((item) => ({ product: toSummary(item.product), quantity: item.quantity }));
    const itemsTotalCents = kit.items.reduce(
      (sum, item) => sum + item.product.priceCents * item.quantity,
      0
    );
    const price = kit.priceCents ? toReais(kit.priceCents) : null;
    return {
      slug: kit.slug,
      name: kit.name,
      description: kit.description,
      price,
      itemsTotal: toReais(itemsTotalCents),
      savings: kit.priceCents && kit.priceCents < itemsTotalCents ? toReais(itemsTotalCents - kit.priceCents) : null,
      items,
    };
  });
});

/** Índice leve usado pela busca no cliente. */
export const getSearchIndex = cache(async () => {
  const rows = await prisma.product.findMany({
    where: { active: true },
    orderBy: { position: 'asc' },
    include,
  });
  return rows.map((row) => {
    const summary = toSummary(row);
    const blocks = parseJson<DescriptionBlock[]>(row.description, []);
    return {
      ...summary,
      haystack: [row.name, row.title, row.line, row.sku ?? '', blocks.map((block) => block.text).join(' ')]
        .join(' ')
        .toLowerCase(),
    };
  });
});
