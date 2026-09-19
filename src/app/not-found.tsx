import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { getCategories } from '@/server/catalog';

export default async function NotFound() {
  const categories = await getCategories();
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="eyebrow text-honey-700">Erro 404</span>
      <h1 className="mt-6 text-[clamp(2rem,5vw,3.2rem)] leading-tight text-forest-900">
        Essa página saiu da colmeia
      </h1>
      <p className="mt-5 max-w-md text-[0.97rem] leading-relaxed text-ink-muted">
        O endereço que você abriu não existe mais. Comece pelo catálogo completo ou escolha uma categoria.
      </p>
      <ButtonLink href="/produtos" size="lg" className="mt-9" arrow>
        Ver todos os produtos
      </ButtonLink>

      <ul className="mt-12 flex max-w-2xl flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/categoria/${category.slug}`}
              className="inline-flex rounded-full border border-line bg-cream-100 px-4 py-2 text-[0.82rem] text-forest-800 transition-colors hover:border-forest-700 hover:bg-forest-700 hover:text-cream-50"
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
