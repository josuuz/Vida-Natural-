/**
 * Popula o banco com o catálogo real da Vida Natural.
 *
 * A fonte é `src/data/catalog.json`, gerado por `npm run scrape` a partir de
 * vidanat.com.br. O seed é idempotente: rode quantas vezes quiser.
 *
 *   npx prisma db seed
 */
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client';
import { KITS, buildCategoryData, buildProductData, catalog } from '../src/data/catalog-source';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db' }),
});

/* ---------------------------------------------------------------------- seed */

async function main() {
  console.log(`seed: ${catalog.categories.length} categorias, ${catalog.products.length} produtos`);

  // categorias
  const categoryIds = new Map<string, string>();
  for (const raw of catalog.categories) {
    const data = buildCategoryData(raw);
    const category = await prisma.category.upsert({
      where: { slug: raw.slug },
      update: data,
      create: { slug: raw.slug, ...data },
    });
    categoryIds.set(raw.slug, category.id);
  }

  // produtos
  for (const [index, raw] of catalog.products.entries()) {
    const categoryId = categoryIds.get(raw.category.slug);
    if (!categoryId) throw new Error(`categoria ausente para ${raw.slug}`);

    const data = buildProductData(raw, categoryId, index);

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
      .filter((other: typeof all[number]) => other.id !== product.id && other.categoryId === product.categoryId)
      .slice(0, 4);

    const complementaryFamily = product.category.family === 'propolis' ? 'meis' : 'propolis';
    const complementary = (byFamily.get(complementaryFamily) ?? [])
      .filter((other: typeof all[number]) => other.id !== product.id)
      .slice(0, 3);

    const rows = [
      ...sameCategory.map((other: typeof sameCategory[number], position: number) => ({
        productId: product.id,
        relatedId: other.id,
        kind: 'related',
        position,
      })),
      ...complementary.map((other: typeof complementary[number], position: number) => ({
        productId: product.id,
        relatedId: other.id,
        kind: 'cross-sell',
        position,
      })),
    ];
    if (rows.length) await prisma.productRelation.createMany({ data: rows });
  }

  // kits: definidos em src/data/catalog-source.ts
  for (const [position, kit] of KITS.entries()) {
    const created = await prisma.kit.upsert({
      where: { slug: kit.slug },
      update: { name: kit.name, description: kit.description, position, active: true },
      create: { slug: kit.slug, name: kit.name, description: kit.description, position, active: true },
    });
    await prisma.kitItem.deleteMany({ where: { kitId: created.id } });
    for (const item of kit.items) {
      const product = all.find((candidate: typeof all[number]) => candidate.slug === item.slug);
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
