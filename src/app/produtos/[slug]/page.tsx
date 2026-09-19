import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKitsForProduct, getProduct, getProductSlugs, getRelatedProducts } from '@/server/catalog';
import { formatSize } from '@/lib/format';
import { site } from '@/lib/site';
import { Breadcrumbs } from '@/components/layout/PageHero';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductDescription } from '@/components/product/ProductDescription';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ShippingEstimate } from '@/components/product/ShippingEstimate';
import { KitOffer } from '@/components/product/KitOffer';
import { PriceTag } from '@/components/product/PriceTag';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Texture } from '@/components/ui/Texture';

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Produto não encontrado' };

  const description =
    product.metaDescription ??
    product.description
      .map((block) => (block.label ? `${block.label}: ${block.text}` : block.text))
      .join(' ')
      .slice(0, 300);

  return {
    title: product.name,
    description,
    alternates: { canonical: `/produtos/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: `/produtos/${product.slug}`,
      images: product.gallery[0]
        ? [{ url: product.gallery[0].src, width: product.gallery[0].width, height: product.gallery[0].height }]
        : undefined,
    },
  };
}

const trustItems = [
  {
    label: 'Pagamento processado pelo Mercado Pago',
    detail: 'PIX, cartão de crédito ou boleto — a Vida Natural não armazena dados do seu cartão.',
    icon: (
      <path
        d="M10 2.5 16 5v5c0 3.4-2.5 5.9-6 7.5C6.5 15.9 4 13.4 4 10V5z M7.6 10.2l1.8 1.8 3.2-3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'Envio em até 2 dias úteis após a aprovação',
    detail: 'Para todo o Brasil, por parceiros de logística.',
    icon: (
      <>
        <path d="M2.5 6.5h10v7h-10zM12.5 9h3l2 2.5v2h-5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="5.5" cy="14.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="14.5" cy="14.5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </>
    ),
  },
  {
    label: 'Trocas e devoluções em até 7 dias corridos',
    detail: 'Produto na embalagem original, sem indícios de uso.',
    icon: (
      <path
        d="M10 3a7 7 0 1 0 7 7M13.5 3.5 17 7l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: 'Produzido em fábrica inspecionada pelo MAPA',
    detail: 'Laboratório próprio e 13 Programas de Auto Controle.',
    icon: (
      <path d="M4 17V9l6-4 6 4v8M8.5 17v-4.5h3V17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    ),
  },
];

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [related, crossSell, kits] = await Promise.all([
    getRelatedProducts(slug, 'related', 4),
    getRelatedProducts(slug, 'cross-sell', 3),
    getKitsForProduct(slug),
  ]);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku ?? undefined,
    image: product.gallery.map((image) => `${site.url}${image.src}`),
    description: product.metaDescription ?? undefined,
    brand: { '@type': 'Brand', name: site.name },
    category: product.categoryName,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: product.price,
      availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${site.url}/produtos/${product.slug}`,
      seller: { '@type': 'Organization', name: site.legalName },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: site.url },
      { '@type': 'ListItem', position: 2, name: 'Produtos', item: `${site.url}/produtos` },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.categoryName,
        item: `${site.url}/categoria/${product.categorySlug}`,
      },
      { '@type': 'ListItem', position: 4, name: product.name, item: `${site.url}/produtos/${product.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }}
      />

      <div className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50 pb-16 pt-8 sm:pb-20">
        <Texture variant="grain" />
        <div className="container-page relative">
          <Breadcrumbs
            crumbs={[
              { label: 'Produtos', href: '/produtos' },
              { label: product.categoryName, href: `/categoria/${product.categorySlug}` },
              { label: product.title },
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
            <ProductGallery product={product} />

            <div className="lg:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/categoria/${product.categorySlug}`}
                  className="eyebrow text-honey-700 transition-colors hover:text-honey-600"
                >
                  {product.line}
                </Link>
                {product.badges.map((badge) => (
                  <span
                    key={badge.kind}
                    className="rounded-full border border-honey-600/30 bg-honey-200/60 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-honey-700"
                  >
                    {badge.label}
                  </span>
                ))}
              </div>

              <h1 className="mt-4 text-[clamp(1.9rem,4.4vw,2.9rem)] leading-[1.06] text-forest-900">
                {product.title}
              </h1>

              {product.variant ? <p className="mt-3 text-[1rem] text-ink-soft">{product.variant}</p> : null}

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.82rem] text-ink-muted">
                {product.size ? (
                  <span className="rounded-full border border-line bg-cream-50 px-3 py-1">
                    {formatSize(product.size)}
                  </span>
                ) : null}
                {product.sku ? <span>Código {product.sku}</span> : null}
                <span className={product.available ? 'text-forest-600' : 'text-ink-muted'}>
                  {product.available ? 'Disponível' : 'Indisponível'}
                </span>
                {product.lowStock && product.stock ? (
                  <span className="text-honey-700">Últimas {product.stock} unidades</span>
                ) : null}
              </div>

              <div className="mt-8 border-y border-line py-7">
                <PriceTag product={product} size="lg" showSavings />
                <p className="mt-3 text-[0.78rem] leading-relaxed text-ink-muted">
                  Pagamento por Pix, boleto ou cartão de crédito. Frete calculado antes de finalizar o pedido.
                </p>
              </div>

              <div className="mt-7">
                <ProductPurchase product={product} />
              </div>

              <div className="mt-7">
                <ShippingEstimate slug={product.slug} />
              </div>

              <ul className="mt-7 flex flex-col gap-3.5">
                {trustItems.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-honey-600" aria-hidden>
                      {item.icon}
                    </svg>
                    <span className="text-[0.82rem] leading-snug">
                      <span className="block text-forest-900">{item.label}</span>
                      <span className="block text-ink-muted">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {kits.length ? (
        <section className="container-page py-14">
          <div className="grid gap-5 lg:grid-cols-2">
            {kits.map((kit) => (
              <KitOffer key={kit.slug} kit={kit} />
            ))}
          </div>
        </section>
      ) : null}

      {product.description.length ? (
        <section className="container-page py-14 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
            <div>
              <h2 className="eyebrow text-honey-700">Sobre o produto</h2>
            </div>
            <div className="max-w-3xl">
              <ProductDescription blocks={product.description} />
              {product.infoImages.length ? (
                <p className="mt-10 text-[0.8rem] text-ink-muted">
                  A tabela nutricional completa está na galeria de imagens acima.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {crossSell.length ? (
        <section className="container-page pb-8">
          <SectionHeading eyebrow="Combina com" title="Leve também" className="mb-12" />
          <ProductGrid products={crossSell} columns={3} />
        </section>
      ) : null}

      {related.length ? (
        <section className="container-page pb-8 pt-16">
          <SectionHeading eyebrow="Da mesma linha" title="Você também pode gostar" className="mb-12" />
          <ProductGrid products={related} columns={4} />
        </section>
      ) : null}
    </>
  );
}
