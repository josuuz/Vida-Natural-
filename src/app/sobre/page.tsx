import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHero } from '@/components/layout/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { Parallax } from '@/components/ui/Parallax';
import { ButtonLink } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getPage } from '@/lib/pages';
import { getCategories, getProduct, getProducts, getSpecies } from '@/server/catalog';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sobre a Vida Natural',
  description:
    'Há mais de 40 anos a Vida Natural produz méis, extratos de própolis e compostos naturais em fábrica própria, com laboratório interno e inspeção do MAPA.',
  alternates: { canonical: '/sobre' },
};

export const revalidate = 60;

export default async function SobrePage() {
  const [categories, products, species, jar, bottle] = await Promise.all([
    getCategories(),
    getProducts(),
    getSpecies(),
    getProduct('mel-de-abelhas-sem-ferrao-mandacaia-100g'),
    getProduct('extrato-de-propolis-propogreen-propolis-verde-30ml'),
  ]);

  const numbers = [
    { value: '40+', label: 'anos de história' },
    { value: '500+', label: 'produtos registrados no MAPA' },
    { value: '13', label: 'Programas de Auto Controle' },
    { value: `${species.length}`, label: 'espécies de abelhas nativas' },
  ];

  const page = getPage('quem-somos');
  const paragraphs = page?.blocks.filter((block) => block.kind === 'paragraph') ?? [];

  return (
    <>
      <PageHero
        eyebrow="Nossa história"
        title={
          <>
            Uma fábrica de mel <span className="italic text-honey-700">há mais de 40 anos</span>
          </>
        }
        description="A Vida Natural nasceu da filosofia de vida do nosso fundador, Edson de Rezende, com uma missão clara: transformar saúde em algo acessível."
        crumbs={[{ label: 'Sobre' }]}
      />

      {/* texto institucional + composição */}
      <section className="container-page pb-20 sm:pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <Reveal className="max-w-2xl">
            <div className="flex flex-col gap-6">
              {paragraphs.map((block) => (
                <p key={block.text} className="text-[1rem] leading-relaxed text-ink-soft">
                  {block.text}
                </p>
              ))}
            </div>
            <p className="mt-8 text-[0.78rem] text-ink-muted">
              Texto institucional publicado pela Vida Natural na página “Quem somos”.
            </p>
            <ButtonLink href="/produtos" className="mt-9" arrow>
              Ver o catálogo
            </ButtonLink>
          </Reveal>

          <div className="relative min-h-[22rem] lg:min-h-[30rem]">
            <span className="honey-glow absolute inset-8 rounded-full" aria-hidden />
            {jar ? (
              <Parallax distance={34} className="absolute left-0 top-[6%] w-[58%]">
                <Image
                  src={jar.image.src}
                  alt={jar.name}
                  width={jar.image.width}
                  height={jar.image.height}
                  sizes="(max-width: 1024px) 58vw, 26vw"
                  className="h-auto w-full drop-shadow-[0_30px_45px_rgba(62,45,15,0.24)]"
                />
              </Parallax>
            ) : null}
            {bottle ? (
              <Parallax distance={-26} className="absolute bottom-[4%] right-[2%] w-[52%]">
                <Image
                  src={bottle.image.src}
                  alt={bottle.name}
                  width={bottle.image.width}
                  height={bottle.image.height}
                  sizes="(max-width: 1024px) 52vw, 24vw"
                  className="h-auto w-full drop-shadow-[0_28px_42px_rgba(62,45,15,0.22)]"
                />
              </Parallax>
            ) : null}
          </div>
        </div>
      </section>

      {/* números */}
      <section className="honeycomb-light bg-forest-800 py-14 text-cream-100 sm:py-16">
        <div className="container-page grid grid-cols-2 gap-8 lg:grid-cols-4">
          {numbers.map((item, index) => (
            <Reveal key={item.label} delay={index * 0.07}>
              <p className="font-display text-[2.4rem] leading-none text-honey-300 sm:text-[3rem]">{item.value}</p>
              <p className="mt-3 text-[0.8rem] leading-snug text-cream-200/70">{item.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* o que produzimos */}
      <section className="container-page py-20 sm:py-24">
        <SectionHeading
          eyebrow="O que produzimos"
          title={
            <>
              Nove linhas, <span className="italic text-honey-700">{products.length} produtos</span>
            </>
          }
          description="Do mel raro das abelhas nativas sem ferrão aos compostos de própolis do dia a dia — tudo com produção e envase próprios."
          className="mb-12"
        />

        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delay={Math.min(index * 0.05, 0.3)}>
              <div className="border-t border-line pt-5">
                <p className="text-[1.1rem] leading-snug text-forest-900">{category.label}</p>
                {category.tagline ? (
                  <p className="mt-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-honey-700">{category.tagline}</p>
                ) : null}
                <p className="mt-3 text-[0.85rem] text-ink-muted">
                  {category.count} {category.count === 1 ? 'produto' : 'produtos'}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* contato */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="honeycomb rounded-xl bg-cream-100 px-7 py-12 sm:px-12">
            <h2 className="max-w-lg text-[clamp(1.6rem,3.4vw,2.4rem)] leading-tight text-forest-900">
              Quer conhecer a fábrica ou falar sobre terceirização?
            </h2>
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">{site.inspection}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contato" size="lg">
                Falar com a gente
              </ButtonLink>
              <ButtonLink href="/produtos" variant="outline" size="lg" arrow>
                Ver produtos
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
