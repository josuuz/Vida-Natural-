import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageHero } from '@/components/layout/PageHero';
import { ShopClient } from '@/components/shop/ShopClient';
import { getCategories, getProducts } from '@/server/catalog';

export const metadata: Metadata = {
  title: 'Todos os produtos',
  description:
    'Catálogo completo da Vida Natural: méis de abelhas sem ferrão, méis florais, méis em sachês, extratos de própolis, compostos, sprays bucais, balas e chá.',
  alternates: { canonical: '/produtos' },
};

function ShopFallback() {
  return (
    <div className="container-page pb-24">
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <div className="hidden h-96 rounded-lg bg-cream-100 lg:block" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] rounded-lg bg-cream-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export const revalidate = 60;

export default async function ProdutosPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <>
      <PageHero
        eyebrow={`${products.length} produtos`}
        title={
          <>
            Todo o catálogo da <span className="italic text-honey-700">Vida Natural</span>
          </>
        }
        description="Filtre por categoria, peso ou faixa de preço. Todos os produtos saem da nossa fábrica, inspecionada pelo MAPA."
        crumbs={[{ label: 'Produtos' }]}
        compact
      />
      <Suspense fallback={<ShopFallback />}>
        <ShopClient products={products} categories={categories} />
      </Suspense>
    </>
  );
}
