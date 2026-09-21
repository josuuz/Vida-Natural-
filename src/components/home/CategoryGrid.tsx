import Image from 'next/image';
import Link from 'next/link';
import { getCategories, getProducts } from '@/server/catalog';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Texture } from '@/components/ui/Texture';

type Tile = {
  slug: string;
  /** Produto que ilustra a categoria. */
  image: string;
  /** Texto curto apoiado apenas em dados do catálogo. */
  note?: string;
  span: string;
  tone: 'dark' | 'cream' | 'honey';
  size: 'xl' | 'lg' | 'md';
};

const tiles: Tile[] = [
  {
    slug: 'meis-de-abelhas-sem-ferrao-lancamentos',
    image: 'mel-de-abelhas-sem-ferrao-jandaira-100g',
    note: '10 espécies nativas · potes de 100g',
    span: 'col-span-2 row-span-2 lg:col-span-2 lg:row-span-2',
    tone: 'dark',
    size: 'xl',
  },
  {
    slug: 'meis-de-abelhas-apis-mellifera',
    image: 'mel-de-flores-silvestres-730g',
    note: 'Silvestres, laranjeira, café, açaí e melato',
    span: 'col-span-2 lg:col-span-2',
    tone: 'honey',
    size: 'lg',
  },
  { slug: 'extrato-de-propolis', image: 'extrato-de-propolis-propored-propolis-vermelha-30ml', span: '', tone: 'cream', size: 'md' },
  {
    slug: 'composto-de-mel-e-extrato-de-propolis',
    image: 'megmel-composto-de-mel-extrato-de-propolis-polen-apicola-e-geleia-real-sabores-agriao-e-roma-300g-',
    span: '',
    tone: 'cream',
    size: 'md',
  },
  { slug: 'meis-de-abelhas-sem-ferrao', image: 'mel-de-abelhas-sem-ferrao-urucu-cinzenta-50g', span: '', tone: 'cream', size: 'md' },
  { slug: 'meis-em-saches', image: 'mel-em-saches-mel-de-flores-silvestres-80g', span: '', tone: 'cream', size: 'md' },
  { slug: 'spray-bucal', image: 'composto-de-mel-e-extrato-de-propolis-sabor-propolis-spray-30ml', span: '', tone: 'cream', size: 'md' },
  { slug: 'balas', image: 'balas-de-roma-40g', span: '', tone: 'cream', size: 'md' },
  { slug: 'cha', image: 'meg-ervas-cha-misto-500ml', span: 'col-span-2 lg:col-span-4', tone: 'cream', size: 'md' },
];

const toneStyles = {
  dark: 'bg-forest-800 text-cream-100 hover:bg-forest-700',
  honey: 'bg-honey-200 text-forest-900 hover:bg-honey-300',
  cream: 'bg-cream-100 text-forest-900 hover:bg-cream-200',
};

export async function CategoryGrid() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  const findCategory = (slug: string) => categories.find((category) => category.slug === slug);
  const findProduct = (slug: string) => products.find((product) => product.slug === slug);

  return (
    <section className="relative bg-cream-50 py-20 sm:py-24 lg:py-28" aria-labelledby="categorias-titulo">
      <Texture variant="grain" />
      <div className="container-page relative">
      <SectionHeading
        eyebrow="Nosso catálogo"
        title={
          <span id="categorias-titulo">
            Explore por <span className="italic text-honey-700">categoria</span>
          </span>
        }
        description="Do mel raro das abelhas nativas ao própolis do dia a dia — nove linhas produzidas na nossa fábrica."
        action={
          <ButtonLink href="/produtos" variant="outline" arrow>
            Ver tudo
          </ButtonLink>
        }
        className="mb-12"
      />

      <div className="grid auto-rows-[13.5rem] grid-cols-2 gap-3.5 sm:auto-rows-[12.5rem] sm:gap-4 lg:auto-rows-[14.5rem] lg:grid-cols-4">
        {tiles.map((tile, index) => {
          const category = findCategory(tile.slug);
          const product = findProduct(tile.image);
          if (!category || !product) return null;

          return (
            <Reveal
              key={tile.slug}
              as="article"
              delay={Math.min(index * 0.05, 0.3)}
              className={`${tile.span} min-w-0`}
            >
              <Link
                href={`/categoria/${category.slug}`}
                className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-lg p-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-6 ${
                  toneStyles[tile.tone]
                }`}
              >
                <span
                  className={`absolute inset-0 ${tile.tone === 'dark' ? 'honeycomb-light' : 'honeycomb'} opacity-[0.08]`}
                  aria-hidden
                />

                {/* a imagem ocupa uma caixa fixa (object-contain) para nunca
                    invadir o texto, mesmo em embalagens muito largas */}
                <Image
                  src={product.image.src}
                  alt=""
                  width={product.image.width}
                  height={product.image.height}
                  sizes={tile.size === 'xl' ? '(max-width: 1024px) 55vw, 28vw' : '(max-width: 1024px) 40vw, 16vw'}
                  className={`pointer-events-none absolute object-contain transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:scale-[1.05] ${
                    tile.size === 'xl'
                      ? 'right-[4%] top-[5%] h-[42%] w-[48%] drop-shadow-[0_26px_40px_rgba(0,0,0,0.3)] sm:top-1/2 sm:h-[66%] sm:w-[46%] sm:-translate-y-1/2'
                      : tile.size === 'lg'
                        ? 'right-[5%] top-[8%] h-[46%] w-[38%] drop-shadow-[0_20px_32px_rgba(62,45,15,0.22)] sm:top-1/2 sm:h-[76%] sm:-translate-y-1/2'
                        : 'right-[5%] top-[6%] h-[28%] w-[36%] drop-shadow-[0_16px_26px_rgba(62,45,15,0.18)] sm:right-[4%] sm:h-[42%] sm:w-[42%] lg:top-1/2 lg:h-[56%] lg:w-[40%] lg:-translate-y-1/2 lg:object-right'
                  }`}
                />

                <div
                  className={`relative z-10 ${
                    tile.size === 'md' ? 'max-w-[86%] lg:max-w-[58%]' : 'max-w-[90%] sm:max-w-[52%]'
                  }`}
                >
                  <h3
                    className={`leading-tight ${
                      tile.size === 'xl'
                        ? 'text-[1.55rem] sm:text-[2rem]'
                        : tile.size === 'lg'
                          ? 'text-[1.35rem] sm:text-[1.7rem]'
                          : 'text-[1.05rem] sm:text-[1.2rem]'
                    }`}
                  >
                    {category.label}
                  </h3>
                  {category.tagline ? (
                    <p
                      className={`mt-1.5 text-[0.66rem] uppercase tracking-[0.1em] sm:text-[0.7rem] sm:tracking-[0.14em] ${
                        tile.tone === 'dark' ? 'text-honey-300' : 'text-honey-700'
                      }`}
                    >
                      {category.tagline}
                    </p>
                  ) : null}
                  {tile.note ? (
                    <p
                      className={`mt-3 hidden text-[0.82rem] leading-snug sm:block ${
                        tile.tone === 'dark' ? 'text-cream-200/70' : 'text-ink-muted'
                      }`}
                    >
                      {tile.note}
                    </p>
                  ) : null}
                  <span
                    className={`mt-4 inline-flex items-center gap-1.5 text-[0.75rem] ${
                      tile.tone === 'dark' ? 'text-cream-100/80' : 'text-forest-700/80'
                    }`}
                  >
                    {category.count} {category.count === 1 ? 'produto' : 'produtos'}
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1" aria-hidden>
                      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
        </div>
      </div>
    </section>
  );
}
