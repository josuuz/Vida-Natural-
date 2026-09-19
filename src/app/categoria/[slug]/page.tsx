import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getCategory, getProducts } from '@/server/catalog';
import { site } from '@/lib/site';
import { PageHero } from '@/components/layout/PageHero';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ButtonLink } from '@/components/ui/Button';

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Categoria não encontrada' };

  const description = `${[category.label, category.tagline].filter(Boolean).join(' — ')}: ${category.count} ${
    category.count === 1 ? 'produto' : 'produtos'
  } da Vida Natural, produzidos em fábrica própria inspecionada pelo MAPA.`;

  return {
    title: [category.label, category.tagline].filter(Boolean).join(' — '),
    description,
    alternates: { canonical: `/categoria/${category.slug}` },
    openGraph: { title: [category.label, category.tagline].filter(Boolean).join(' — '), description, url: `/categoria/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([getCategory(slug), getCategories()]);
  if (!category) notFound();

  const list = await getProducts(category.slug);
  const siblings = categories.filter((item) => item.slug !== category.slug);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: [category.label, category.tagline].filter(Boolean).join(' — '),
    url: `${site.url}/categoria/${category.slug}`,
    hasPart: list.map((product) => ({
      '@type': 'Product',
      name: product.name,
      url: `${site.url}/produtos/${product.slug}`,
      offers: { '@type': 'Offer', priceCurrency: 'BRL', price: product.price },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <PageHero
        eyebrow={category.tagline || 'Categoria'}
        title={category.label}
        description={`${category.count} ${category.count === 1 ? 'produto' : 'produtos'} nesta linha.`}
        crumbs={[{ label: 'Produtos', href: '/produtos' }, { label: category.label }]}
        compact
      />

      <section className="container-page pb-20">
        <ProductGrid products={list} columns={4} priorityCount={4} />
      </section>

      <section className="container-page pb-24">
        <div className="border-t border-line pt-10">
          <h2 className="eyebrow mb-5 text-honey-700">Outras categorias</h2>
          <div className="flex flex-wrap gap-2.5">
            {siblings.map((item) => (
              <Link
                key={item.slug}
                href={`/categoria/${item.slug}`}
                className="group inline-flex items-baseline gap-2 rounded-full border border-line bg-cream-50 px-4 py-2 text-[0.85rem] text-forest-800 transition-all duration-300 hover:border-forest-700 hover:bg-forest-700 hover:text-cream-50"
              >
                {item.label}
                <span className="text-[0.7rem] text-ink-muted transition-colors group-hover:text-cream-200/70">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>

          <ButtonLink href="/produtos" variant="outline" className="mt-9" arrow>
            Ver o catálogo completo
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
