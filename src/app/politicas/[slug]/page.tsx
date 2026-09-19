import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPage, policyPages } from '@/lib/pages';
import { PageHero } from '@/components/layout/PageHero';
import { site } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return policyPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page || slug === 'quem-somos') return { title: 'Página não encontrada' };

  return {
    title: page.title,
    description: page.blocks.find((block) => block.kind === 'paragraph')?.text.slice(0, 200) ?? site.description,
    alternates: { canonical: `/politicas/${page.slug}` },
  };
}

export default async function PolicyPage({ params }: Params) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page || slug === 'quem-somos') notFound();

  return (
    <>
      <PageHero title={page.title} crumbs={[{ label: page.title }]} compact />

      <article className="container-page pb-24">
        <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Outras políticas" className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="eyebrow mb-4 text-honey-700">Institucional</h2>
            <ul className="flex flex-col gap-2 text-[0.88rem]">
              {policyPages.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/politicas/${item.slug}`}
                    className={`transition-colors duration-300 ${
                      item.slug === page.slug ? 'text-honey-700' : 'text-ink-soft hover:text-forest-800'
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contato" className="text-ink-soft transition-colors hover:text-forest-800">
                  Fale conosco
                </Link>
              </li>
            </ul>
          </nav>

          <div className="max-w-2xl">
            {page.blocks.map((block, index) => {
              if (block.kind === 'heading') {
                return (
                  <h2
                    key={`${block.text}-${index}`}
                    className="mt-12 text-[1.35rem] leading-snug text-forest-900 first:mt-0 sm:text-[1.55rem]"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.kind === 'item') {
                return (
                  <p
                    key={`${block.text}-${index}`}
                    className="mt-3 flex gap-3 text-[0.95rem] leading-relaxed text-ink-soft"
                  >
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-honey-500" />
                    {block.text}
                  </p>
                );
              }
              return (
                <p key={`${block.text}-${index}`} className="mt-5 text-[0.97rem] leading-relaxed text-ink-soft">
                  {block.text}
                </p>
              );
            })}

            <p className="mt-14 border-t border-line pt-6 text-[0.8rem] text-ink-muted">
              Dúvidas sobre este texto? Fale com a gente pelo e-mail{' '}
              <a href={`mailto:${site.contact.email}`} className="text-honey-700 link-underline">
                {site.contact.email}
              </a>{' '}
              ou pelo WhatsApp {site.contact.whatsapp}.
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
