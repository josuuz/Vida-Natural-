/**
 * Catálogo oficial em arquivo.
 *
 * `catalog.json` é gerado por `npm run scrape` a partir de vidanat.com.br e
 * tem dois consumidores: o seed, que leva tudo para o banco, e o fallback das
 * páginas públicas, usado enquanto o banco não está configurado. Os dois
 * passam por esta mesma transformação — é o que garante que a vitrine seja
 * idêntica com ou sem banco.
 */
import rawCatalog from './catalog.json';

export type RawProduct = {
  slug: string;
  sku: string | null;
  name: string;
  category: { slug: string; name: string };
  price: number | null;
  priceFrom: number | null;
  installments: { count: number; value: number } | null;
  available: boolean;
  size: string | null;
  description: { kind: string; emoji: string | null; label?: string; text: string }[];
  metaDescription: string | null;
  localImages: { src: string; width: number; height: number }[];
  localInfoImages: { src: string; width: number; height: number }[];
  cutout: { src: string; width: number; height: number };
};

export type RawCatalog = {
  categories: { slug: string; name: string }[];
  products: RawProduct[];
};

export const catalog = rawCatalog as unknown as RawCatalog;

export const CATEGORY_META: Record<string, { family: string; position: number; label?: string }> = {
  'meis-de-abelhas-sem-ferrao-lancamentos': { family: 'sem-ferrao', position: 1 },
  'meis-de-abelhas-sem-ferrao': { family: 'sem-ferrao', position: 2 },
  'meis-de-abelhas-apis-mellifera': { family: 'meis', position: 3 },
  'meis-em-saches': { family: 'meis', position: 4 },
  'extrato-de-propolis': { family: 'propolis', position: 5, label: 'Extratos de Própolis' },
  'composto-de-mel-e-extrato-de-propolis': { family: 'propolis', position: 6, label: 'Compostos de Mel e Própolis' },
  'spray-bucal': { family: 'propolis', position: 7 },
  balas: { family: 'outros', position: 8 },
  cha: { family: 'outros', position: 9 },
};

/** Curadoria editorial dos destaques da home. */
export const FEATURED = [
  'mel-de-abelhas-sem-ferrao-urucu-nordestina-100g',
  'mel-de-flores-de-laranjeira',
  'extrato-de-propolis-propolis-verde-30ml',
  'mel-de-abelhas-sem-ferrao-jatai-100g',
  'mel-de-flores-silvestres-730g',
  'composto-de-mel-e-extrato-de-propolis-sabor-menta-spray-30ml',
  'mel-estudante-mel-de-flores-silvestres-300g',
  'balas-de-propolis-40g',
];

/** Combinações reais, vendidas pela soma dos itens: nenhum desconto inventado. */
export const KITS = [
  {
    slug: 'kit-mel-e-propolis',
    name: 'Mel de Abelhas sem Ferrão + Extrato de Própolis',
    description: 'O mel de Uruçu Nordestina com o extrato de própolis verde.',
    items: [
      { slug: 'mel-de-abelhas-sem-ferrao-urucu-nordestina-100g', quantity: 1 },
      { slug: 'extrato-de-propolis-propolis-verde-30ml', quantity: 1 },
    ],
  },
  {
    slug: 'kit-dia-a-dia',
    name: 'Mel de Flores Silvestres + Spray Bucal',
    description: 'O mel do dia a dia com o spray de própolis sabor menta.',
    items: [
      { slug: 'mel-de-flores-silvestres-400g', quantity: 1 },
      { slug: 'composto-de-mel-e-extrato-de-propolis-sabor-menta-spray-30ml', quantity: 1 },
    ],
  },
];

/* --------------------------------------------------------- nomes de vitrine */

export const stripSize = (value: string) =>
  value.replace(/\s*[-–|]?\s*\d+(?:[.,]\d+)?\s*(g|kg|ml|l)\b\.?\s*$/i, '').trim();

export const splitCategoryName = (fullName: string) => {
  const [name, ...rest] = fullName.split(/\s+[-–]\s+/);
  return { name: name.trim(), tagline: rest.join(' - ').trim() };
};

export function displayName(product: RawProduct, categoryLabel: string) {
  const parts = product.name.split('|').map((part) => part.trim());

  switch (product.category.slug) {
    case 'spray-bucal': {
      const flavour = parts[0].split(/\s+[-–]\s+/).slice(1).join(' - ');
      return { title: flavour || stripSize(parts[0]), line: categoryLabel, variant: 'Spray' };
    }
    case 'composto-de-mel-e-extrato-de-propolis': {
      const flavour = parts[1]?.split(/\s+[-–]\s+/).slice(1).join(' - ');
      return { title: stripSize(parts[0]), line: categoryLabel, variant: flavour ? stripSize(flavour) : null };
    }
    case 'meis-em-saches':
      return { title: stripSize(parts[0]), line: categoryLabel, variant: parts[1] ? stripSize(parts[1]) : null };
    default: {
      const last = stripSize(parts[parts.length - 1]);
      return {
        title: last || stripSize(parts[0]),
        line: parts.length > 1 ? stripSize(parts[0]) : categoryLabel,
        variant: null,
      };
    }
  }
}

/** Peso líquido declarado na embalagem, em gramas (ml tratado como 1g/ml). */
export function weightFromSize(size: string | null) {
  if (!size) return 0;
  const match = size.match(/^(\d+(?:[.,]\d+)?)(g|kg|ml|l)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  if (unit === 'kg' || unit === 'l') return Math.round(value * 1000);
  return Math.round(value);
}

export const toCents = (value: number | null | undefined) =>
  value === null || value === undefined ? null : Math.round(value * 100);

/* ------------------------------------------------------------------- linhas */

export type CategorySource = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  label: string;
  family: string;
  position: number;
  active: boolean;
};

export type ProductSource = ReturnType<typeof buildProductData> & {
  id: string;
  slug: string;
  category: CategorySource;
  tiers: never[];
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
};

export function categoryMetaFor(slug: string) {
  return CATEGORY_META[slug] ?? { family: 'outros', position: 99 };
}

/** Campos da categoria, na mesma forma gravada pelo seed. */
export function buildCategoryData(raw: { slug: string; name: string }) {
  const meta = categoryMetaFor(raw.slug);
  const { name, tagline } = splitCategoryName(raw.name);
  return {
    name,
    tagline,
    label: meta.label ?? name,
    family: meta.family,
    position: meta.position,
  };
}

/** Campos do produto, na mesma forma gravada pelo seed. */
export function buildProductData(raw: RawProduct, categoryId: string, index: number) {
  const meta = CATEGORY_META[raw.category.slug];
  const categoryLabel = meta?.label ?? splitCategoryName(raw.category.name).name;
  const { title, line, variant } = displayName(raw, categoryLabel);

  const priceCents = toCents(raw.price) ?? 0;
  const compareAt = toCents(raw.priceFrom);

  return {
    name: raw.name,
    line,
    title,
    variant,
    sku: raw.sku,
    categoryId,
    description: JSON.stringify(raw.description),
    metaDescription: raw.metaDescription,
    cutout: JSON.stringify(raw.cutout),
    images: JSON.stringify(raw.localImages),
    infoImages: JSON.stringify(raw.localInfoImages),
    priceCents,
    // só é promoção quando o site oficial realmente publica um "de/por"
    compareAtPriceCents: compareAt && compareAt > priceCents ? compareAt : null,
    installmentCount: raw.installments?.count ?? null,
    installmentValueCents: toCents(raw.installments?.value ?? null),
    weightGrams: weightFromSize(raw.size),
    sizeLabel: raw.size,
    // a loja ainda não controla estoque por aqui: produto indisponível no site
    // oficial entra com controle ligado e saldo zero
    trackStock: !raw.available,
    stock: 0,
    active: true,
    featured: FEATURED.includes(raw.slug),
    // `bestSeller` só deve ser ligado com base em vendas reais
    bestSeller: false,
    // a categoria de lançamentos é a própria loja sinalizando novidade
    isNew: raw.category.slug === 'meis-de-abelhas-sem-ferrao-lancamentos',
    position: index,
  };
}

const localId = (prefix: string, slug: string) => `local-${prefix}-${slug}`;

export const sourceCategories: CategorySource[] = catalog.categories.map((raw) => ({
  id: localId('cat', raw.slug),
  slug: raw.slug,
  active: true,
  ...buildCategoryData(raw),
}));

const categoryBySlug = new Map(sourceCategories.map((category) => [category.slug, category]));

export const sourceProducts: ProductSource[] = catalog.products.map((raw, index) => {
  const category = categoryBySlug.get(raw.category.slug)!;
  return {
    id: localId('prod', raw.slug),
    slug: raw.slug,
    ...buildProductData(raw, category.id, index),
    lowStockThreshold: 5,
    category,
    tiers: [],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
});

/* ---------------------------------------------------------------- relações */

/** Mesma categoria: "você também pode gostar". */
export function relatedSlugsFor(slug: string, limit = 4) {
  const product = sourceProducts.find((item) => item.slug === slug);
  if (!product) return [];
  return sourceProducts
    .filter((other) => other.slug !== slug && other.categoryId === product.categoryId)
    .slice(0, limit)
    .map((other) => other.slug);
}

/** Família complementar: "combine com". */
export function crossSellSlugsFor(slug: string, limit = 3) {
  const product = sourceProducts.find((item) => item.slug === slug);
  if (!product) return [];
  const complementary = product.category.family === 'propolis' ? 'meis' : 'propolis';
  return sourceProducts
    .filter((other) => other.slug !== slug && other.category.family === complementary)
    .slice(0, limit)
    .map((other) => other.slug);
}
