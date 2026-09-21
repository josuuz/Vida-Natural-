import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getCategories, getProducts } from '@/server/catalog';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Texture } from '@/components/ui/Texture';
import { InViewLoops } from '@/components/ui/InViewLoops';
import type { ProductSummary } from '@/lib/types';

type Tile = {
  slug: string;
  /** Produto que ilustra a categoria. */
  image: string;
  /** Texto curto apoiado apenas em dados do catálogo. */
  note?: string;
  span: string;
  tone: 'dark' | 'cream' | 'honey';
  size: 'xl' | 'lg' | 'md';
  /** Card que ocupa a linha inteira no mobile: texto e produto lado a lado. */
  wide?: boolean;
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
    wide: true,
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
  { slug: 'cha', image: 'meg-ervas-cha-misto-500ml', span: 'col-span-2 lg:col-span-4', tone: 'cream', size: 'md', wide: true },
];

const toneStyles = {
  dark: 'bg-forest-800 text-cream-100 hover:bg-forest-700',
  honey: 'bg-honey-200 text-forest-900 hover:bg-honey-300',
  cream: 'bg-cream-100 text-forest-900 hover:bg-cream-200',
};

/*
 * Três arranjos. No mobile: o destaque e os cards de meia largura empilham a
 * cena sobre o texto, colados; os cards de linha inteira põem os dois lado a
 * lado. Do sm para cima volta o bento: texto embaixo à esquerda e a cena
 * posicionada à direita, dentro de uma caixa fixa que nunca invade o texto.
 */
const layouts = {
  feature: {
    link: 'flex-col p-5 sm:justify-end sm:p-6',
    stage: 'h-[15rem] w-full sm:absolute sm:right-[4%] sm:top-1/2 sm:h-[68%] sm:w-[46%] sm:-translate-y-1/2',
    text: 'mt-5 sm:mt-0 sm:max-w-[52%]',
  },
  wide: {
    link: 'flex-row-reverse items-center gap-2 p-5 sm:flex-col sm:items-stretch sm:justify-end sm:gap-0 sm:p-6',
    stage: 'h-[9.5rem] w-[46%] shrink-0 sm:absolute sm:right-[5%] sm:top-1/2 sm:h-[76%] sm:w-[38%] sm:-translate-y-1/2',
    text: 'min-w-0 flex-1 sm:flex-none sm:max-w-[52%]',
  },
  compact: {
    link: 'flex-col p-4 sm:justify-end sm:p-6',
    stage:
      'h-[7.5rem] w-full sm:absolute sm:right-[4%] sm:top-[6%] sm:h-[44%] sm:w-[42%] lg:top-1/2 lg:h-[60%] lg:w-[40%] lg:-translate-y-1/2',
    text: 'mt-3 flex flex-1 flex-col sm:mt-0 sm:block sm:flex-none lg:max-w-[58%]',
  },
};

const sceneTones = {
  dark: { light: 'rgb(221 176 90 / 0.26)', shadow: 'rgb(0 0 0 / 0.5)' },
  honey: { light: 'rgb(255 249 232 / 0.95)', shadow: 'rgb(98 64 12 / 0.3)' },
  cream: { light: 'rgb(255 253 247 / 1)', shadow: 'rgb(62 45 15 / 0.26)' },
};

const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';
const LOOP_PAUSE = 'in-data-[loops=off]:[animation-play-state:paused]';

/**
 * Cena do produto, no espírito de uma foto de catálogo: halo de luz, ramos de
 * folhas saindo de trás da embalagem, sombra de contato e o produto
 * respirando. No hover as folhas se abrem, o produto sobe e a sombra encolhe.
 *
 * A caixa do produto tem exatamente a proporção da foto e cabe na cena pelos
 * dois lados (unidades de container), então folhas e sombra se ancoram na
 * embalagem real, seja um frasco fino ou uma caixa larga.
 */
function Scene({
  product,
  tone,
  index,
  sizes,
  className,
}: {
  product: ProductSummary;
  tone: Tile['tone'];
  index: number;
  sizes: string;
  className: string;
}) {
  const ratio = product.image.width / product.image.height;
  const colors = sceneTones[tone];
  // cada card entra no ciclo num ponto diferente: a grade nunca pulsa junta
  const phase = (seconds: number): CSSProperties => ({ animationDelay: `${-(index * 1.1 + seconds)}s` });

  return (
    <div
      aria-hidden
      className={`pointer-events-none relative flex items-center justify-center [container-type:size] ${className}`}
    >
      {/* sobra ~10% de cada lado para os ramos não baterem na borda do card */}
      <div className="relative" style={{ width: `min(80cqw, ${ratio} * 84cqh)`, aspectRatio: ratio }}>
        {/* halo */}
        <span
          className={`absolute left-1/2 top-1/2 size-[118cqh] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 transition-[scale,opacity] duration-700 ${EASE} group-hover:scale-110 group-hover:opacity-100`}
          style={{ background: `radial-gradient(closest-side, ${colors.light}, transparent)` }}
        />

        {/* ramos atrás da embalagem */}
        <span
          className={`absolute bottom-[10%] left-[30%] h-[74cqh] -translate-x-1/2 origin-bottom rotate-[-26deg] transition-[rotate] duration-700 ${EASE} group-hover:rotate-[-36deg]`}
        >
          <Image
            src="/cena/ramo-largo.webp"
            alt=""
            width={405}
            height={640}
            sizes="140px"
            style={phase(0)}
            className={`h-full w-auto max-w-none origin-bottom animate-scene-sway ${LOOP_PAUSE}`}
          />
        </span>
        <span
          className={`absolute bottom-[12%] left-[72%] h-[66cqh] -translate-x-1/2 origin-bottom rotate-[24deg] transition-[rotate] duration-700 ${EASE} group-hover:rotate-[34deg]`}
        >
          <Image
            src="/cena/ramo-fino.webp"
            alt=""
            width={317}
            height={640}
            sizes="120px"
            style={phase(2.6)}
            className={`h-full w-auto max-w-none origin-bottom -scale-x-100 animate-scene-sway [animation-duration:8.2s] ${LOOP_PAUSE}`}
          />
        </span>

        {/* sombra de contato */}
        <span
          className={`absolute -bottom-[4%] left-1/2 h-[10cqh] w-[88%] -translate-x-1/2 rounded-[50%] transition-[scale,opacity] duration-700 ${EASE} group-hover:scale-x-[0.84] group-hover:opacity-60`}
          style={{ background: `radial-gradient(closest-side, ${colors.shadow}, transparent)` }}
        />

        {/* produto */}
        <div
          className={`absolute inset-0 transition-[translate,scale] duration-700 ${EASE} group-hover:-translate-y-[5%] group-hover:scale-[1.04]`}
        >
          <Image
            src={product.image.src}
            alt=""
            width={product.image.width}
            height={product.image.height}
            sizes={sizes}
            style={phase(0.4)}
            className={`h-full w-full object-contain animate-scene-float ${LOOP_PAUSE} ${
              tone === 'dark'
                ? 'drop-shadow-[0_18px_26px_rgba(0,0,0,0.35)]'
                : 'drop-shadow-[0_14px_20px_rgba(62,45,15,0.16)]'
            }`}
          />
        </div>

        {/* raminho à frente, na base — profundidade de foto de mesa */}
        <span
          className={`absolute -bottom-[6%] left-[8%] z-10 h-[34cqh] origin-bottom rotate-[-58deg] transition-[rotate] duration-700 ${EASE} group-hover:rotate-[-64deg]`}
        >
          <Image
            src="/cena/ramo-fino.webp"
            alt=""
            width={317}
            height={640}
            sizes="60px"
            style={phase(4.1)}
            className={`h-full w-auto max-w-none origin-bottom animate-scene-sway [animation-duration:6.2s] ${LOOP_PAUSE}`}
          />
        </span>
      </div>
    </div>
  );
}

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

      <InViewLoops className="grid grid-cols-2 gap-3.5 sm:auto-rows-[12.5rem] sm:gap-4 lg:auto-rows-[14.5rem] lg:grid-cols-4">
        {tiles.map((tile, index) => {
          const category = findCategory(tile.slug);
          const product = findProduct(tile.image);
          if (!category || !product) return null;
          const layout = layouts[tile.size === 'xl' ? 'feature' : tile.wide ? 'wide' : 'compact'];

          return (
            <Reveal
              key={tile.slug}
              as="article"
              delay={Math.min(index * 0.05, 0.3)}
              className={`${tile.span} min-w-0`}
            >
              <Link
                href={`/categoria/${category.slug}`}
                className={`group relative flex h-full overflow-hidden rounded-lg transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  layout.link
                } ${toneStyles[tile.tone]}`}
              >
                <span
                  className={`absolute inset-0 ${tile.tone === 'dark' ? 'honeycomb-light' : 'honeycomb'} opacity-[0.08]`}
                  aria-hidden
                />

                <Scene
                  product={product}
                  tone={tile.tone}
                  index={index}
                  sizes={
                    tile.size === 'xl'
                      ? '(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 28vw'
                      : '(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 16vw'
                  }
                  className={layout.stage}
                />

                <div className={`relative z-10 ${layout.text}`}>
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
                    className={`mt-auto inline-flex items-center gap-1.5 pt-3 text-[0.75rem] sm:mt-4 sm:pt-0 ${
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
      </InViewLoops>
      </div>
    </section>
  );
}
