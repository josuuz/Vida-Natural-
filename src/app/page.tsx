import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { TrustStrip } from '@/components/home/TrustStrip';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { RareHoneySection } from '@/components/home/RareHoneySection';
import { FloralEditorial } from '@/components/home/FloralEditorial';
import { StorySection } from '@/components/home/StorySection';
import { ContactBand } from '@/components/home/ContactBand';
import { site } from '@/lib/site';
import { getProducts, getSpecies } from '@/server/catalog';

export const metadata: Metadata = {
  title: 'Vida Natural — Méis de abelhas sem ferrão, méis florais e própolis',
  description: site.description,
  alternates: { canonical: '/' },
};

/** O catálogo pode mudar sem novo deploy: a home revalida a cada 5 minutos. */
export const revalidate = 60;

const HERO_SLUGS = [
  'mel-de-abelhas-sem-ferrao-urucu-nordestina-100g',
  'mel-de-flores-de-laranjeira',
  'extrato-de-propolis-propolis-verde-30ml',
];

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  email: site.contact.email,
  telephone: '+551938772189',
  taxID: site.cnpj,
  sameAs: [site.social.instagram],
  description: site.description,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+5519999612189',
      contactType: 'customer service',
      availableLanguage: ['Portuguese'],
    },
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${site.url}/produtos?busca={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default async function HomePage() {
  const [products, species, floral] = await Promise.all([
    getProducts(),
    getSpecies(),
    getProducts('meis-de-abelhas-apis-mellifera'),
  ]);

  const heroProducts = HERO_SLUGS.map((slug) => products.find((product) => product.slug === slug)).filter(
    (product): product is NonNullable<typeof product> => Boolean(product)
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, websiteSchema]) }}
      />
      <Hero products={heroProducts} stats={{ species: species.length, products: products.length }} />
      <TrustStrip />
      <CategoryGrid />
      <RareHoneySection species={species} />
      <FeaturedProducts />
      <FloralEditorial products={floral} />
      <StorySection />
      <ContactBand />
    </>
  );
}
