import Image from 'next/image';
import { getProduct } from '@/server/catalog';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Parallax } from '@/components/ui/Parallax';
import { ButtonLink } from '@/components/ui/Button';
import { Blob, Texture } from '@/components/ui/Texture';

/**
 * Os quatro pilares abaixo reescrevem, de forma editorial, o que a própria
 * Vida Natural publica na página "Quem somos". Nenhum fato foi acrescentado.
 */
const pillars = [
  {
    number: '01',
    title: 'Natureza',
    text: 'Méis de abelhas nativas sem ferrão e de Apis mellifera, de floradas que vão da Caatinga à Mata Atlântica — cada pote com a assinatura da sua origem.',
  },
  {
    number: '02',
    title: 'Origem',
    text: 'Há mais de 40 anos a Vida Natural nasceu da filosofia de vida do nosso fundador, Edson de Rezende, com uma missão clara: transformar saúde em algo acessível.',
  },
  {
    number: '03',
    title: 'Qualidade',
    text: 'Somos rigorosamente fiscalizados pelo SIF e operamos com 13 Programas de Auto Controle. Temos laboratório próprio para garantir a pureza e a origem de cada gota de mel.',
  },
  {
    number: '04',
    title: 'Produção',
    text: 'Mais de 500 produtos registrados no MAPA e uma estrutura que hoje faz da Vida Natural o maior parceiro de terceirização do Brasil no setor.',
  },
];

export async function StorySection() {
  const jar = await getProduct('mel-de-flores-de-acai');

  return (
    <section className="relative overflow-hidden bg-forest-900 py-20 text-cream-100 sm:py-24 lg:py-28" aria-labelledby="historia-titulo">
      <Texture variant="noise-dark" />
      <Blob className="-left-40 top-10 h-[30rem] w-[30rem]" tone="honey" />
      <div className="container-page relative">
        <SectionHeading
          eyebrow="Nossa história"
          title={
            <span id="historia-titulo">
              Quatro décadas entre <span className="italic text-honey-300">flores e favos</span>
            </span>
          }
          description="Uma fábrica em funcionamento contínuo, um laboratório próprio e um catálogo construído produto a produto."
          tone="light"
          className="mb-14"
        />

        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* pôster */}
          <Reveal className="relative">
            <div className="relative flex h-full min-h-[24rem] flex-col justify-between overflow-hidden rounded-xl border border-cream-200/10 bg-forest-800 p-8 text-cream-100 sm:min-h-[30rem] sm:p-10">
              <Texture variant="noise-dark" />
              <span
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-honey-400/15 blur-3xl"
                aria-hidden
              />
              <blockquote className="relative max-w-sm">
                <p className="font-display text-[1.6rem] leading-[1.25] sm:text-[2rem]">
                  “Transformar a filosofia de vida do nosso fundador em saúde acessível.”
                </p>
                <footer className="mt-5 text-[0.78rem] uppercase tracking-[0.16em] text-honey-300">
                  Missão da Vida Natural
                </footer>
              </blockquote>

              {jar ? (
                <Parallax distance={26} className="pointer-events-none absolute -bottom-6 right-2 w-[46%] sm:right-6 sm:w-[42%]">
                  <Image
                    src={jar.image.src}
                    alt=""
                    width={jar.image.width}
                    height={jar.image.height}
                    sizes="(max-width: 1024px) 46vw, 22vw"
                    className="h-auto w-full drop-shadow-[0_34px_50px_rgba(0,0,0,0.42)]"
                  />
                </Parallax>
              ) : null}

              <div className="relative mt-16 max-w-[52%]">
                <p className="text-[0.85rem] leading-relaxed text-cream-200/70">
                  Da colmeia ao pote, tudo acontece dentro de casa: recebimento, análise, envase e rotulagem.
                </p>
                <ButtonLink href="/sobre" variant="light" size="sm" className="mt-6" arrow>
                  Conhecer a fábrica
                </ButtonLink>
              </div>
            </div>
          </Reveal>

          {/* pilares */}
          <ol className="flex flex-col">
            {pillars.map((pillar, index) => (
              <Reveal
                as="li"
                key={pillar.number}
                delay={index * 0.08}
                className="group border-t border-cream-200/12 py-7 last:border-b sm:py-8"
              >
                <div className="flex gap-5 sm:gap-8">
                  <span className="font-display text-[0.95rem] text-honey-300">{pillar.number}</span>
                  <div className="min-w-0">
                    <h3 className="text-[1.5rem] leading-tight text-cream-100 transition-colors duration-500 group-hover:text-honey-300 sm:text-[1.75rem]">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-cream-200/70">{pillar.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
