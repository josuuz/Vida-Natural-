import Link from 'next/link';
import type { ReactNode } from 'react';
import { RevealText } from '@/components/ui/Reveal';

export type Crumb = { label: string; href?: string };

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
  /** Espaço extra embaixo quando a página emenda direto numa grade. */
  compact?: boolean;
};

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Você está aqui" className="text-[0.75rem] text-ink-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="transition-colors hover:text-honey-700">
            Início
          </Link>
        </li>
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            <span aria-hidden className="text-line">
              /
            </span>
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-honey-700">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ink-soft">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({ eyebrow, title, description, crumbs, children, compact = false }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 to-cream-50">
      <span className="honeycomb pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
      <span
        className="honey-glow pointer-events-none absolute -right-[10%] -top-[40%] h-[36rem] w-[36rem] rounded-full"
        aria-hidden
      />
      <div className={`container-page relative pt-8 ${compact ? 'pb-10' : 'pb-14 sm:pb-16'}`}>
        {crumbs ? <Breadcrumbs crumbs={crumbs} /> : null}
        <RevealText className="mt-7 max-w-3xl">
          {eyebrow ? (
            <span className="eyebrow flex items-center gap-2.5 text-honey-700">
              <span className="h-px w-8 bg-honey-600/50" aria-hidden />
              {eyebrow}
            </span>
          ) : null}
          <h1 className="mt-5 text-[clamp(2.1rem,5.2vw,3.6rem)] leading-[1.03] text-forest-900">{title}</h1>
          {description ? (
            <p className="mt-6 max-w-xl text-[1rem] leading-relaxed text-ink-soft">{description}</p>
          ) : null}
        </RevealText>
        {children}
      </div>
    </section>
  );
}
