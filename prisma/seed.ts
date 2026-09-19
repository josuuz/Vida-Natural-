/**
 * Popula o banco com o catálogo real da Vida Natural.
 *
 * A fonte é `src/data/catalog.json`, gerado por `npm run scrape` a partir de
 * vidanat.com.br. O seed é idempotente: rode quantas vezes quiser.
 *
 *   npx prisma db seed
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' }),
});

type RawProduct = {
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

type RawCatalog = {
  categories: { slug: string; name: string }[];
  products: RawProduct[];
};

const catalog: RawCatalog = JSON.parse(
  readFileSync(path.join(process.cwd(), 'src', 'data', 'catalog.json'), 'utf8')
);

const CATEGORY_META: Record<string, { family: string; position: number; label?: string }> = {
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
const FEATURED = [
  'mel-de-abelhas-sem-ferrao-urucu-nordestina-100g',
  'mel-de-flores-de-laranjeira',
  'extrato-de-propolis-propolis-verde-30ml',
  'mel-de-abelhas-sem-ferrao-jatai-100g',
  'mel-de-flores-silvestres-730g',
  'composto-de-mel-e-extrato-de-propolis-sabor-menta-spray-30ml',
  'mel-estudante-mel-de-flores-silvestres-300g',
  'balas-de-propolis-40g',
];

/* --------------------------------------------------------- nomes de vitrine */

const stripSize = (value: string) =>
  value.replace(/\s*[-–|]?\s*\d+(?:[.,]\d+)?\s*(g|kg|ml|l)\b\.?\s*$/i, '').trim();

const splitCategoryName = (fullName: string) => {
  const [name, ...rest] = fullName.split(/\s+[-–]\s+/);
  return { name: name.trim(), tagline: rest.join(' - ').trim() };
};

function displayName(product: RawProduct, categoryLabel: string) {
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
function weightFromSize(size: string | null) {
  if (!size) return 0;
  const match = size.match(/^(\d+(?:[.,]\d+)?)(g|kg|ml|l)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  if (unit === 'kg' || unit === 'l') return Math.round(value * 1000);
  return Math.round(value);
}

const toCents = (value: number | null | undefined) =>
  value === null || value === undefined ? null : Math.round(value * 100);

/* ---------------------------------------------------------------------- seed */

async function main() {
  console.log(`seed: ${catalog.categories.length} categorias, ${catalog.products.length} produtos`);

  // categorias
  const categoryIds = new Map<string, string>();
  for (const raw of catalog.categories) {
    const meta = CATEGORY_META[raw.slug] ?? { family: 'outros', position: 99 };
    const { name, tagline } = splitCategoryName(raw.name);
    const category = await prisma.category.upsert({
      where: { slug: raw.slug },
      update: { name, tagline, label: meta.label ?? name, family: meta.family, position: meta.position },
      create: {
        slug: raw.slug,
        name,
        tagline,
        label: meta.label ?? name,
        family: meta.family,
        position: meta.position,
      },
    });
    categoryIds.set(raw.slug, category.id);
  }

  // produtos
  for (const [index, raw] of catalog.products.entries()) {
    const categoryId = categoryIds.get(raw.category.slug);
    if (!categoryId) throw new Error(`categoria ausente para ${raw.slug}`);

    const meta = CATEGORY_META[raw.category.slug];
    const categoryLabel = meta?.label ?? splitCategoryName(raw.category.name).name;
    const { title, line, variant } = displayName(raw, categoryLabel);

    const priceCents = toCents(raw.price) ?? 0;
    const compareAt = toCents(raw.priceFrom);

    const data = {
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
      stock: raw.available ? 0 : 0,
      active: true,
      featured: FEATURED.includes(raw.slug),
      // `bestSeller` só deve ser ligado com base em vendas reais
      bestSeller: false,
      // a categoria de lançamentos é a própria loja sinalizando novidade
      isNew: raw.category.slug === 'meis-de-abelhas-sem-ferrao-lancamentos',
      position: index,
    };

    await prisma.product.upsert({ where: { slug: raw.slug }, update: data, create: { slug: raw.slug, ...data } });
  }

  // relações: "você também pode gostar" (mesma categoria) e "combine com"
  // (família complementar). São recomendações editoriais, não dados de venda.
  const all = await prisma.product.findMany({ include: { category: true } });
  const byFamily = new Map<string, typeof all>();
  for (const product of all) {
    const list = byFamily.get(product.category.family) ?? [];
    list.push(product);
    byFamily.set(product.category.family, list);
  }

  await prisma.productRelation.deleteMany();
  for (const product of all) {
    const sameCategory = all
      .filter((other) => other.id !== product.id && other.categoryId === product.categoryId)
      .slice(0, 4);

    const complementaryFamily = product.category.family === 'propolis' ? 'meis' : 'propolis';
    const complementary = (byFamily.get(complementaryFamily) ?? [])
      .filter((other) => other.id !== product.id)
      .slice(0, 3);

    const rows = [
      ...sameCategory.map((other, position) => ({
        productId: product.id,
        relatedId: other.id,
        kind: 'related',
        position,
      })),
      ...complementary.map((other, position) => ({
        productId: product.id,
        relatedId: other.id,
        kind: 'cross-sell',
        position,
      })),
    ];
    if (rows.length) await prisma.productRelation.createMany({ data: rows });
  }

  // kits: combinações reais, vendidas pela soma dos itens. Nenhum desconto é
  // inventado — defina `priceCents` quando quiser praticar um preço de kit.
  const kits = [
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

  for (const [position, kit] of kits.entries()) {
    const created = await prisma.kit.upsert({
      where: { slug: kit.slug },
      update: { name: kit.name, description: kit.description, position, active: true },
      create: { slug: kit.slug, name: kit.name, description: kit.description, position, active: true },
    });
    await prisma.kitItem.deleteMany({ where: { kitId: created.id } });
    for (const item of kit.items) {
      const product = all.find((candidate) => candidate.slug === item.slug);
      if (!product) continue;
      await prisma.kitItem.create({
        data: { kitId: created.id, productId: product.id, quantity: item.quantity },
      });
    }
  }

  // cupom de exemplo — nasce INATIVO de propósito
  await prisma.coupon.upsert({
    where: { code: 'BEMVINDO10' },
    update: {},
    create: {
      code: 'BEMVINDO10',
      type: 'percent',
      value: 10,
      minSubtotalCents: 10000,
      active: false,
      description: 'Exemplo: 10% em pedidos acima de R$ 100. Ative quando quiser usar.',
    },
  });

  // configurações da loja
  const settings: Record<string, string> = {
    'shipping.mode': 'quote', // quote = frete combinado depois | table = tabela
    'shipping.freeShipping.enabled': 'false',
    'shipping.freeShipping.thresholdCents': '25000',
    'shipping.handlingDays': '2',
    'checkout.minOrderCents': '0',
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const counts = {
    categorias: await prisma.category.count(),
    produtos: await prisma.product.count(),
    relacoes: await prisma.productRelation.count(),
    kits: await prisma.kit.count(),
    cupons: await prisma.coupon.count(),
    ajustes: await prisma.setting.count(),
  };
  console.log(counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
